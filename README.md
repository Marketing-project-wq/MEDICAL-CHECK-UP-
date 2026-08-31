# medicalcheckup.20fit.id

Public subdomain that helps people **understand** medical check-up (MCU) / lab
results, and lets anyone analyze an MCU document by calling the real AI
backend on `my.20fit.id`.

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
| Example analysis (sample data) | ✅ | ✅ |
| Upload form | ✅ (own widget, consent-gated) | ✅ |
| Calls AI (`/api/analyze-mcu`) | ✅ | ✅ |
| Result shown | ✅ once, in-page, never saved | ✅ + saved to history |
| Saves result (`my20fit_mcu_result`, RLS) | ❌ (no account to attach it to) | ✅ |
| Compare across periods / history | ❌ — CTA to login | ✅ |

> **Explicit product decision:** anonymous visitors can upload and get a
> fully-open, one-time analysis with no account — only saving/history/period
> comparison stays behind login. This app gates the anonymous path with a
> **consent checkbox** ("this file will be processed by AI, the result is not
> stored") before the analyze button enables, and never persists an
> anonymous result anywhere.
>
> ⚠️ **The real `my.20fit.id` backend applies no authentication or rate
> limiting to `POST /api/analyze-mcu` at all** — this was true before this
> app's anonymous-upload feature existed, and it is true for logged-in
> members too (the Bearer token this app sends is not actually checked
> server-side today). This app has no way to enforce rate limiting on a
> backend it doesn't own; that has to live on `my.20fit.id`/`my20fit-dashboard`
> if abuse becomes a problem. The backend's own Claude pre-check (rejecting
> documents that don't look like an MCU) is a partial, incidental mitigation,
> not a real one — it still costs one AI call per attempt.

## How it fits together

```
Browser (medicalcheckup.20fit.id)
  ├─ Anonymous: SSR education + sample (shared renderer) + upload widget
  │    (consent checkbox required)
  │    → POST https://my.20fit.id/api/analyze-mcu  (multipart, no auth header)
  │    → render result (SAME renderer as the sample) — shown once, never saved
  └─ Member (after SSO fragment-token handoff):
       pick file → preprocess in-browser (downscale ≤1500px / pdf.js ≤3 pages → 1 JPEG)
       → POST https://my.20fit.id/api/analyze-mcu  (multipart, Authorization: Bearer <token>)
       → render result (SAME renderer as the sample)
       → insert into my20fit_mcu_result { auth_user_id, result, analyzed_at }  (RLS)
       → history reads the member's own rows (RLS)
```

- **AI is only ever called from the browser to `my.20fit.id`.** No AI key
  ships here, and this app's own server never proxies the analysis call.
- **Files are never stored** — only the JSON result, and only for logged-in
  members (`file_path` is left null). Anonymous results are not stored at all.
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

## Run locally

```bash
cp .env.example .env   # fill SUPABASE_ANON_KEY
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
