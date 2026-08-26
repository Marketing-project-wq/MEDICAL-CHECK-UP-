const { createClient } = require('@supabase/supabase-js')

let _admin = null
let _anon = null

function getAdmin() {
  if (!_admin) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus diset di environment.')
    }
    _admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  }
  return _admin
}

function getAnon() {
  if (!_anon) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error('SUPABASE_URL dan SUPABASE_ANON_KEY harus diset di environment.')
    }
    _anon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  }
  return _anon
}

// Proxy objects so existing `supabaseAdmin.xxx` call sites still work unchanged
const supabaseAdmin = new Proxy({}, { get: (_, prop) => getAdmin()[prop] })
const supabaseAnon  = new Proxy({}, { get: (_, prop) => getAnon()[prop] })

module.exports = { supabaseAdmin, supabaseAnon }
