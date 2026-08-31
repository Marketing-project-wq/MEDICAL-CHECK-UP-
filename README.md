# medicalcheckup.20fit.id

Public subdomain that helps people **understand** medical check-up (MCU) / lab
results, and lets **logged-in 20FIT members** analyze their own results by
calling the existing AI backend on `my.20fit.id`.

Built to `MEDICALCHECKUPSUBDOMAINSPEC.md` (the binding spec). **Zero runtime
dependencies** — the server uses only Node's built-in `http`; browser libraries
(`@supabase/supabase-js`, `pdf.js`) are loaded from a CDN by the client.

## Two modes (updated — see note below)

| | Anonymous | Member (logged in) |
|---|---|---|
| Education (server-rendered, SEO) | ✅ | ✅ |
| Example analysis (sample data) | ✅ | ✅ |
| Upload form | ✅ (own widget, consent-gated) | ✅ |
| Calls AI (`/api/mcu`) | ✅ — no Authorization header, no persistence | ✅ — Bearer auth |
| Result shown | ✅ once, in-page, never saved | ✅ + saved to history |
| Saves result (`my20fit_mcu_result`, RLS) | ❌ (no account to attach it to) | ✅ |
| Compare across periods / history | ❌ — CTA to login | ✅ |

> **Change of policy from the original spec:** the original spec gated the
> upload UI itself behind login. Per an explicit product decision, anonymous
> visitors can now upload and get a fully-open, one-time analysis with no
> account — only saving/history/period comparison stays behind login. The
> anonymous path requires the visitor to tick a consent checkbox ("this file
> will be processed by AI, the result is not stored") before the analyze
> button enables, and its result is never persisted anywhere by this app.
> Anonymous **rate limiting / abuse protection must be enforced on the
> `my.20fit.id` side** — this static app has no way to throttle calls it
> doesn't proxy.

## How it fits together

```
Browser (medicalcheckup.20fit.id)
  ├─ Anonymous: SSR education + sample (spec §4 renderer)
  │    + upload widget (consent checkbox required)
  │    → POST https://my.20fit.id/api/mcu  (NO Authorization header)
  │    → render result (SAME renderer as the sample) — shown once, never saved
  └─ Member (after SSO fragment-token handoff):
       pick file → preprocess in-browser (downscale ≤1500px / pdf.js ≤3 pages → 1 JPEG)
       → POST https://my.20fit.id/api/mcu  (Authorization: Bearer <token>)
       → render result (SAME renderer as the sample)
       → optional POST /api/translate (ID↔EN)
       → insert into my20fit_mcu_result { auth_user_id, result, analyzed_at }  (RLS)
       → history reads the member's own rows (RLS)
```

- **AI is only ever called on the server** (`my.20fit.id`). No AI key ships to the browser.
- **Files are never stored** — only the JSON `result` (spec §6), and only for
  logged-in members. `file_path` is left null. Anonymous results are not
  stored at all.
- **SSO** uses the fragment-token model (spec §5). `return_to` is validated to
  `*.20fit.id` only (open-redirect guard); tokens are consumed via
  `supabase.auth.setSession(...)` then scrubbed from the URL/history.

## Run locally

```bash
cp .env.example .env   # fill SUPABASE_ANON_KEY
npm start              # node src/server.js  (no install needed)
npm test               # node --test (pure-logic unit tests)
```

Open http://localhost:3000 (Indonesian) or /en (English).

## Configuration

See `.env.example`. Key points: `MY20FIT_ORIGIN` is the host that serves the
member app + API; `SUPABASE_ANON_KEY` is the public client key (never the
service_role key).

## ⚠️ Requires on the `my.20fit.id` side (repo `my20fit-dashboard`)

This subdomain calls a contract that the spec defines but that did **not** exist
in `my20fit-dashboard` at the time of writing (the live endpoint was
`/api/analyze-mcu` with a different shape, no `/api/translate`, and no SSO
fragment handoff). Those additive pieces are provided in a companion PR to
`my20fit-dashboard`:

- `POST /api/mcu` — Bearer auth, `{file,mime,lang}` → spec §4 result shape.
- `POST /api/translate` — Bearer auth, ID↔EN, rate-limited.
- SSO producer — `/login?return_to=<*.20fit.id>` redirects with
  `#access_token&refresh_token`.

**This subdomain only works once that companion PR is deployed to
`my.20fit.id`.** CORS is already open on that server (`cors()`).

### New requirement: anonymous `/api/mcu` calls

Per the updated gating policy above, this app now also calls `POST /api/mcu`
**without** an `Authorization` header for anonymous visitors. `my.20fit.id`
must accept that (returning the same result shape) for the anonymous flow to
work at all — today it likely 401s on a missing Bearer token. Because this
removes the auth requirement, `my.20fit.id` should also apply its own
rate limiting / abuse protection to unauthenticated calls to this endpoint;
this repo has no way to enforce that itself.

## Deploy to staging

This app is **zero-dependency** (Node built-ins only), so there is no install or
build step — `node src/server.js` is the whole runtime. A `Dockerfile` and
`railway.json` are included for turnkey deploys.

### Railway (spec §9.3)
1. New Project → Deploy from GitHub repo → `Marketing-project-wq/MEDICAL-CHECK-UP-`,
   branch `claude/medicalcheckup-subdomain-setup-myerpu` (or `main` after merge).
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
| `MY20FIT_ORIGIN` | the host serving `/api/mcu` etc. (e.g. `https://my.20fit.id`, or the backend's staging origin) |
| `PUBLIC_ORIGIN` | this deployment's URL (e.g. the Railway `*.up.railway.app` URL) |
| `SUPABASE_URL` | `https://cpvzwqptzcxnwzfzgrmt.supabase.co` (default; optional) |
| `PORT` | injected by the platform |

### Staging caveat
The **member flow** (`/api/mcu`, `/api/translate`, SSO) only works once the
companion `my20fit-dashboard` PR is deployed to whatever `MY20FIT_ORIGIN` points
to. Until then, staging exercises the **anonymous** experience (education,
sample, and the login redirect) end to end; the member analysis will get a 404
from the API host.

## Testing note

The npm registry is blocked in the authoring sandbox, so the full toolchain
(bundlers, headless browser) could not run there. Pure logic is covered by
`node --test`; the browser flow (pdf.js, Supabase from CDN, live `/api/mcu`)
must be verified on staging in a real browser.
