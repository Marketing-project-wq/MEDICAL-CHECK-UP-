require('dotenv').config()
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const { Client } = require('pg')
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

app.use('/api/mcu', mcuUploadRoutes)

app.use(errorHandler)

async function runMigration() {
  if (!process.env.DATABASE_URL) return
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  try {
    await client.connect()
    await client.query(`
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
      do $$ begin
        if not exists (select 1 from pg_policies where tablename='mcu_uploads' and policyname='owner_select') then
          create policy owner_select on mcu_uploads for select using (auth.uid() = user_id);
        end if;
        if not exists (select 1 from pg_policies where tablename='mcu_uploads' and policyname='owner_insert') then
          create policy owner_insert on mcu_uploads for insert with check (auth.uid() = user_id);
        end if;
        if not exists (select 1 from pg_policies where tablename='mcu_uploads' and policyname='owner_delete') then
          create policy owner_delete on mcu_uploads for delete using (auth.uid() = user_id);
        end if;
      end $$;
      create index if not exists mcu_uploads_user_idx on mcu_uploads (user_id, uploaded_at desc);
    `)
    console.log('[migration] mcu_uploads table: OK')
  } catch (e) {
    console.error('[migration] error:', e.message)
  } finally {
    await client.end()
  }
}

module.exports = app

if (require.main === module) {
  runMigration().then(() => {
    app.listen(PORT, () => {
      console.log(`MCU Upload service running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`)
    })
  })
}
