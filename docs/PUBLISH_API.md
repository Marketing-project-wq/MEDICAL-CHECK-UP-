# Publish API — `POST /api/articles`

Lets another website publish an article onto **medicalcheckup.20fit.id**. The
article is stored in this subdomain's own `mcu_articles` table (isolated from the
shared `media_articles` / media.20fit.id pipeline) and appears at
`/articles` and `/articles/<slug>` (and `/id/...`).

## Endpoint

```
POST https://medicalcheckup.20fit.id/api/articles
Authorization: Bearer <ARTICLES_PUBLISH_TOKEN>
Content-Type: application/json
```

The token is a shared secret set server-side (`ARTICLES_PUBLISH_TOKEN`). While it
is unset the endpoint is disabled and returns `503`.

## Body

| field | type | required | notes |
|---|---|---|---|
| `title` | string | **yes** | ≤ 300 chars |
| `slug` | string | no | derived from `title` if omitted; normalized to `a-z0-9-` |
| `body_html` | string | no | article body; **sanitized server-side** (script/style/iframe/event-handlers stripped) |
| `excerpt` | string | no | card + meta summary (≤ 500) |
| `category` | string | no | e.g. `nutrition`, `lifestyle`; default `other` |
| `tags` | string[] | no | up to 20 |
| `author_name` | string | no | shown on the article |
| `meta_title` / `meta_description` | string | no | SEO |
| `cover_image_url` | string | no | must be `https://`; else the generated cover is used |
| `published_url` | string | no | canonical URL if the original lives elsewhere; omit to make the MCU page canonical |

`org`, `status` and storage table are fixed server-side — a caller cannot choose
them. Publishing the same `slug` again **updates** that article (idempotent upsert).

## Responses

```json
200 { "ok": true, "id": "…", "slug": "…", "status": "published",
      "url": "https://medicalcheckup.20fit.id/articles/…" }
```

| status | `code` | meaning |
|---|---|---|
| 401 | `unauthorized` | missing/wrong bearer token |
| 400 | `title_required` / `invalid_json` / `invalid_body` | bad payload |
| 413 | `payload_too_large` | body over 512 KB |
| 429 | `rate_limited` | > 60 requests / 10 min |
| 502 | `publish_failed` | upstream write failed |
| 503 | `publish_not_configured` / `service_unavailable` | token or service-role key not set |

## Example

```bash
curl -sS -X POST https://medicalcheckup.20fit.id/api/articles \
  -H "Authorization: Bearer $ARTICLES_PUBLISH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Cara Membaca Hasil Gula Darah Puasa",
    "excerpt": "Panduan singkat memahami angka gula darah puasa di hasil MCU.",
    "category": "nutrition",
    "tags": ["gula darah", "mcu"],
    "author_name": "Tim 20FIT",
    "body_html": "<p>Gula darah puasa adalah…</p><h2>Rentang rujukan</h2><p>…</p>"
  }'
```

## Security notes

- The service-role key stays server-side; it is never returned or exposed.
- `body_html` is sanitized on write, on top of the page's strict CSP.
- Articles are written only to `mcu_articles` for the 20FIT org — never to the
  shared `media_articles` pipeline, and never to another table or org.
- Every API-published row is tagged `source = "external-api"` (or a `source` you
  pass) for auditing / bulk removal.
- Rotate the token by changing `ARTICLES_PUBLISH_TOKEN` and redeploying.

## Storage table (applied migration `create_mcu_articles`)

```sql
create table if not exists public.mcu_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body_html text,
  category text not null default 'other',
  tags text[] default '{}',
  author_name text,
  meta_title text,
  meta_description text,
  cover_image_url text,
  published_url text,
  status text not null default 'published',
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz not null default now()
);
alter table public.mcu_articles enable row level security;
-- No policies: only the service-role key (server-side) reads/writes, exactly
-- like public.media_articles. Anonymous/authenticated clients get nothing.
create index if not exists mcu_articles_status_published_at_idx
  on public.mcu_articles (status, published_at desc);
```

