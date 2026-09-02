# medicalcheckup.20fit.id

Public subdomain that helps people **understand** medical check-up (MCU) / lab
results. Anyone can read the education and see a worked example; **members**
(logged in) analyze their own MCU document via the real AI backend on
`my.20fit.id`. Anonymous visitors never upload — the gate is at upload (spec §0.1).

**Zero runtime dependencies** — the server uses only Node's built-in `http`;
browser libraries (`@supabase/supabase-js`, `pdf.js`) are loaded from a CDN by
the client.

> The request contract below (`POST /api/analyze-mcu`, multipart, no `lang`
> param, no translate endpoint, no auth check) was verified directly against
> the `my20fit-dashboard` backend's source (`artifacts/api-server/src/routes/mcu.ts`),
> not against an earlier aspirational spec — an earlier version of this app
> was built against a `/api/mcu` JSON contract that never actually existed on
> that backend.

## Two modes

| | Anonymous | Member (logged in) |
|---|---|---|
| Education (server-rendered, SEO) | ✅ | ✅ |
| Example analysis (fictional sample) | ✅ | ✅ |
| Upload form | ❌ — login CTA instead | ✅ |
| Calls AI (`/api/analyze-mcu`) | ❌ | ✅ |
| Result shown | ❌ (see the example instead) | ✅ + saved to history |
| Saves result (`my20fit_mcu_result`, RLS) | ❌ | ✅ |
| Compare across periods / history | ❌ — CTA to login | ✅ |

> **Spec §0.1 — the gate is at UPLOAD, not at the result.** Anonymous visitors
> never upload or process a health document: they see the full educational
> page, a clearly-marked **fictional example** result (so they know what they'll
> get), and a single **"sign in / register to analyze"** button that sends them
> to `my.20fit.id/login` with a validated `return_to`. The uploader is
> revealed only after a real member session is confirmed. This is enforced in
> two independent places: the browser hides the uploader for anyone who isn't a
> confirmed member (fail-safe: hidden by default, so no JS = no upload), and the
> server (`POST /api/scan`) rejects any request without a valid member token
> (`auth_required`) — so a health document is never sent to the AI without an
> account, even if the client is bypassed.
>
> ⚠️ **The real `my.20fit.id` backend applies no rate limiting to
> `POST /api/analyze-mcu` itself.** This app adds a per-member in-memory limiter
> in `/api/scan`, but a hard backstop still has to live on
> `my.20fit.id`/`my20fit-dashboard` if abuse becomes a problem, since this app
> doesn't own that backend.

## How it fits together

```
Browser (medicalcheckup.20fit.id)
  ├─ Anonymous: SSR education + fictional example (shared renderer) + login CTA
  │    → "sign in / register to analyze" → my.20fit.id/login?return_to=<validated>
  │    (NO uploader, NO AI call — spec §0.1)
  └─ Member (after SSO fragment-token handoff):
       pick file → preprocess in-browser (downscale ≤1500px / pdf.js ≤3 pages → 1 JPEG)
       → POST /api/scan  (this app's server; JSON data-URL, Authorization: Bearer <token>)
            └─ server verifies the member token, then proxies to
               my.20fit.id/api/analyze-mcu (multipart) and returns the result
       → render result (SAME renderer as the example)
       → insert into my20fit_mcu_result { auth_user_id, result, analyzed_at }  (RLS, client-side)
       → history reads the member's own rows (RLS)
```

- **AI is only ever called server-side, and only for a member.** The browser
  posts to this app's own `/api/scan`, which authenticates the caller before
  proxying to `my.20fit.id`. No AI key ships to the browser; an anonymous
  request never reaches the AI.
- **Files are never stored** — only the JSON result, and only for logged-in
  members. The example on the page is invented, not a real document.
- **The backend always responds in Bahasa Indonesia** (its prompts are
  hardcoded) regardless of this app's `lang` — there is no translate
  endpoint, so an English-language visitor's analysis text will still come
  back in Indonesian. This app's own UI chrome (labels, disclaimer, nav) is
  still fully bilingual.
- **SSO** uses the fragment-token model. `return_to` is validated to
  `*.20fit.id` only (open-redirect guard); tokens are consumed via
  `supabase.auth.setSession(...)` then scrubbed from the URL/history.
- The backend validates the upload actually looks like an MCU document
  (a Claude pre-check) before running the full analysis, and returns
  `{error: "not_mcu", ...}` or `{error: "incomplete_mcu", missing, message}`
  for a bad upload — this app surfaces `message` as the error status.

## Health articles (Tahap 1)

`/articles` (+ `/id/articles`) list and `/articles/<slug>` detail pages render
20FIT's published health articles **server-side** (good for SEO), read from
`public.media_articles` where `status='published'` via the service-role key
(server-only). Highlights:

- **No duplication / stays fresh** — content comes straight from your media
  pipeline; nothing is copied by hand.
- **No SEO cannibalization** — every article already lives on media.20fit.id,
  so each mcu detail page sets `<link rel="canonical">` to that `published_url`.
  mcu shows the article (read without leaving) while media.20fit keeps ranking.
  Only the article *list* pages are in mcu's sitemap.
- **First-party HTML is sanitized** (`sanitizeArticleHtml`) as defense-in-depth
  on top of the strict CSP; article pages widen `img-src` to `https:` for
  embedded images (images only — scripts stay locked to `'self'`+nonce).
- **Always safe** — every page carries the shared health disclaimer
  ("education/awareness, not a formal diagnosis") and the escalation CTA
  ("Consult a 20FIT Doctor" → `DOCTOR_BOOKING_URL`, the in-app Book Doctor
  flow). These components (`src/shared/health.js`) are reused by every tool.
- **Graceful** — if Supabase is unreachable the list shows an empty state and a
  bad slug 404s; never a 500.

## Run locally

```bash
cp .env.example .env   # fill SUPABASE_ANON_KEY (+ SUPABASE_SERVICE_ROLE_KEY for the member scan path)
npm start              # node src/server.js  (no install needed)
npm test               # node --test (pure-logic unit tests)
```

Open http://localhost:3000 (Indonesian) or /en (English).

## Configuration

See `.env.example`. Key points: `MY20FIT_ORIGIN` is the host that serves
`/api/analyze-mcu`; `SUPABASE_ANON_KEY` is the public client key (never the
service_role key) — used only for member sign-in/history, not for the
analysis call itself.

## Deploy to staging

This app is **zero-dependency** (Node built-ins only), so there is no install or
build step — `node src/server.js` is the whole runtime. A `Dockerfile` and
`railway.json` are included for turnkey deploys.

### Railway
1. New Project → Deploy from GitHub repo → `Marketing-project-wq/MEDICAL-CHECK-UP-`.
   Railway uses the `Dockerfile` automatically (see `railway.json`).
2. Set service **Variables** (see table below).
3. Deploy. Health check is `GET /healthz`. Railway gives a
   `*.up.railway.app` staging URL — set `PUBLIC_ORIGIN` to it.
4. (Later, for production) add `medicalcheckup.20fit.id` as a custom domain and
   point Cloudflare DNS at the deployment.

Any container/Node host works the same way (Render, Fly, Replit): start command
`node src/server.js`, Node ≥ 18.

### Required staging variables
| Variable | Staging value |
|---|---|
| `SUPABASE_ANON_KEY` | the project's publishable/anon key (public client key) |
| `MY20FIT_ORIGIN` | the host serving `/api/analyze-mcu` (e.g. `https://my.20fit.id`) |
| `PUBLIC_ORIGIN` | this deployment's URL (e.g. the Railway `*.up.railway.app` URL) |
| `SUPABASE_URL` | `https://cpvzwqptzcxnwzfzgrmt.supabase.co` (default; optional) |
| `PORT` | injected by the platform |

## Testing note

Pure logic (i18n key parity, the shared result renderer, the open-redirect
guard, XSS-escaping) is covered by `node --test`. The live browser flow
(pdf.js, Supabase from CDN, a real `POST /api/analyze-mcu` call) must be
verified on staging in a real browser — this repo's sandbox has no network
path to a live `my.20fit.id`.
