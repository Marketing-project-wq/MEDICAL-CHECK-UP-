require('dotenv').config()
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const mcuUploadRoutes = require('./routes/mcuUpload')
const errorHandler = require('./middleware/errorHandler')

const app = express()
const PORT = process.env.PORT || 3000

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean)

app.use(helmet())
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error('CORS: origin not allowed'))
  },
  credentials: true,
}))
app.use(express.json())

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak request. Coba lagi sebentar.' },
}))

app.get('/health', (req, res) => res.json({ status: 'ok' }))

// One-shot migration endpoint protected by secret
app.get('/admin/run-migration', async (req, res) => {
  if (req.query.secret !== process.env.MIGRATE_SECRET) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const https = require('https')
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  const HOST = process.env.SUPABASE_URL.replace('https://', '')

  const SQL = `
    create table if not exists mcu_uploads (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references auth.users(id) on delete cascade,
      storage_path text not null,
      original_name text not null,
      mime_type text not null,
      file_size bigint not null,
      label text,
      uploaded_at timestamptz not null default now()
    );
    alter table mcu_uploads enable row level security;
    do $migr$ begin
      if not exists (select 1 from pg_policies where tablename='mcu_uploads' and policyname='owner_select') then
        create policy owner_select on mcu_uploads for select using (auth.uid() = user_id);
      end if;
      if not exists (select 1 from pg_policies where tablename='mcu_uploads' and policyname='owner_insert') then
        create policy owner_insert on mcu_uploads for insert with check (auth.uid() = user_id);
      end if;
      if not exists (select 1 from pg_policies where tablename='mcu_uploads' and policyname='owner_delete') then
        create policy owner_delete on mcu_uploads for delete using (auth.uid() = user_id);
      end if;
    end $migr$;
    create index if not exists mcu_uploads_user_idx on mcu_uploads (user_id, uploaded_at desc);
  `

  // Use Supabase pg_query via service role
  function httpsPost(path, body) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body)
      const req = https.request({
        hostname: HOST, path, method: 'POST',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': 'Bearer ' + SERVICE_KEY,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      }, r => {
        let d = ''
        r.on('data', c => d += c)
        r.on('end', () => resolve({ status: r.statusCode, body: d }))
      })
      req.on('error', reject)
      req.write(data)
      req.end()
    })
  }

  try {
    // Try pg via Supabase's internal postgres endpoint
    const r = await httpsPost('/pg/query', { query: SQL })
    if (r.status === 200 || r.status === 201) {
      return res.json({ success: true, message: 'Migration berhasil!' })
    }

    // Fallback: try via rpc
    const r2 = await httpsPost('/rest/v1/rpc/exec_sql', { sql: SQL })
    if (r2.status === 200 || r2.status === 204) {
      return res.json({ success: true, message: 'Migration berhasil via RPC!' })
    }

    return res.status(500).json({
      error: 'Migration gagal',
      pg_status: r.status, pg_body: r.body.slice(0, 200),
      rpc_status: r2.status, rpc_body: r2.body.slice(0, 200)
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.use('/api/mcu', mcuUploadRoutes)

app.use(errorHandler)

module.exports = app

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`MCU Upload service running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`)
  })
}
