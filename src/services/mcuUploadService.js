const { supabaseAdmin } = require('../config/supabase')
const { buildStoragePath, uploadToStorage, getSignedUrl } = require('../utils/storageHelper')

const TABLE = 'mcu_uploads'

async function uploadMcuFile({ file, userId, label }) {
  const storagePath = buildStoragePath(userId, file.originalname)

  await uploadToStorage(file.buffer, file.mimetype, storagePath)

  // Only persist metadata to DB for authenticated members
  if (userId) {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .insert({
        user_id: userId,
        storage_path: storagePath,
        original_name: file.originalname,
        mime_type: file.mimetype,
        file_size: file.size,
        label: label || null,
        uploaded_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw new Error(`DB insert gagal: ${error.message}`)

    const signedUrl = await getSignedUrl(storagePath, 3600)
    return { ...data, signedUrl }
  }

  // Guest: return signed URL only, no DB record
  const signedUrl = await getSignedUrl(storagePath, 1800)
  return {
    storage_path: storagePath,
    original_name: file.originalname,
    mime_type: file.mimetype,
    file_size: file.size,
    signedUrl,
    guest: true,
    expires_in: 1800,
  }
}

async function getMcuUploads(userId) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select('id, original_name, mime_type, file_size, label, uploaded_at, storage_path')
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: false })

  if (error) throw new Error(`Gagal mengambil riwayat: ${error.message}`)

  // Attach fresh signed URLs
  const results = await Promise.all(
    data.map(async (row) => {
      const signedUrl = await getSignedUrl(row.storage_path, 3600)
      return { ...row, signedUrl }
    })
  )

  return results
}

async function getMcuUploadById(id, userId) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !data) throw new Error('File tidak ditemukan atau akses ditolak.')

  const signedUrl = await getSignedUrl(data.storage_path, 3600)
  return { ...data, signedUrl }
}

async function deleteMcuUpload(id, userId) {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select('storage_path')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error || !data) throw new Error('File tidak ditemukan atau akses ditolak.')

  const { deleteFromStorage } = require('../utils/storageHelper')
  await deleteFromStorage(data.storage_path)

  const { error: delErr } = await supabaseAdmin
    .from(TABLE)
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (delErr) throw new Error(`Gagal hapus record: ${delErr.message}`)
}

module.exports = { uploadMcuFile, getMcuUploads, getMcuUploadById, deleteMcuUpload }
