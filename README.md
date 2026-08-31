# medicalcheckup.20fit.id

Public subdomain that helps people **understand** medical check-up (MCU) / lab
results, and lets **logged-in 20FIT members** analyze their own results by
calling the existing AI backend on `my.20fit.id`.

Built to `MEDICALCHECKUPSUBDOMAINSPEC.md` (the binding spec). **Zero runtime
dependencies** — the server uses only Node's built-in `http`; browser libraries
(`@supabase/supabase-js`, `pdf.js`) are loaded from a CDN by the client.

## Two modes (spec §1)

| | Anonymous | Member (logged in) |
|---|---|---|
| Education (server-rendered, SEO) | ✅ | ✅ |
| Example analysis (sample data) | ✅ | ✅ |
| Upload form | ❌ never rendered | ✅ |
| Calls AI (`/api/mcu`) | ❌ never | ✅ |
| Saves result (`my20fit_mcu_result`, RLS) | ❌ | ✅ |

The upload UI is gated **at the point of upload**: it is never present for
anonymous visitors (not server-rendered, not injected). Anonymous "Analisa hasil
punya saya" links to `my.20fit.id/login?return_to=<this page>`.

## How it fits together

```
Browser (medicalcheckup.20fit.id)
  ├─ Anonymous: SSR education + sample (spec §4 renderer) + login CTA
  └─ Member (after SSO fragment-token handoff):
       pick file → preprocess in-browser (downscale ≤1500px / pdf.js ≤3 pages → 1 JPEG)
       → POST https://my.20fit.id/api/mcu  (Authorization: Bearer <token>)
       → render result (SAME renderer as the sample)
       → optional POST /api/translate (ID↔EN)
       → insert into my20fit_mcu_result { auth_user_id, result, analyzed_at }  (RLS)
       → history reads the member's own rows (RLS)
```

- **AI is only ever called on the server** (`my.20fit.id`). No AI key ships to the browser.
- **Files are never stored** — only the JSON `result` (spec §6). `file_path` is left null.
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

## Deploy / DNS

1. Deploy this app (e.g. Railway); set env from `.env.example`.
2. Point DNS: `medicalcheckup.20fit.id` (Cloudflare) → the deployment, and add
   it as a custom domain. (It does **not** resolve yet.)

## Testing note

The npm registry is blocked in the authoring sandbox, so the full toolchain
(bundlers, headless browser) could not run there. Pure logic is covered by
`node --test`; the browser flow (pdf.js, Supabase from CDN, live `/api/mcu`)
must be verified on staging in a real browser.
