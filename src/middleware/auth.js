const { supabaseAdmin } = require('../config/supabase')

/**
 * Tries to resolve a Supabase user from Authorization header or URL fragment token.
 * Sets req.user if valid, otherwise req.user = null (guest mode).
 */
async function resolveUser(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null

  if (!token) {
    req.user = null
    return next()
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data?.user) {
    req.user = null
    return next()
  }

  req.user = data.user
  next()
}

/**
 * Hard gate — rejects unauthenticated requests with a locked CTA response.
 */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      gated: true,
      message: 'Fitur ini membutuhkan login. Daftar atau masuk untuk mengakses riwayat dan insight MCU Anda.',
      cta: {
        label: 'Masuk / Daftar',
        url: 'https://my.20fit.id/login',
      },
    })
  }
  next()
}

module.exports = { resolveUser, requireAuth }
