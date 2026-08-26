const { v4: uuidv4 } = require('uuid')
const { supabaseAdmin } = require('../config/supabase')

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'mcu-files'

/**
 * Builds a storage path.
 * Members: mcu/{userId}/{uuid}.{ext}
 * Guests:  mcu/guest/{uuid}.{ext}
 */
function buildStoragePath(userId, originalName) {
  const ext = originalName.split('.').pop().toLowerCase()
  const id = uuidv4()
  const folder = userId ? `mcu/${userId}` : 'mcu/guest'
  return `${folder}/${id}.${ext}`
}

async function uploadToStorage(buffer, mimeType, storagePath) {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    })

  if (error) throw new Error(`Storage upload gagal: ${error.message}`)
  return data
}

async function getSignedUrl(storagePath, expiresInSeconds = 3600) {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds)

  if (error) throw new Error(`Gagal membuat signed URL: ${error.message}`)
  return data.signedUrl
}

async function deleteFromStorage(storagePath) {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .remove([storagePath])

  if (error) throw new Error(`Gagal menghapus file: ${error.message}`)
}

module.exports = { buildStoragePath, uploadToStorage, getSignedUrl, deleteFromStorage }
