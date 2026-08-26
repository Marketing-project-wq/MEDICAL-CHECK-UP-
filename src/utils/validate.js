const ALLOWED_MIME_TYPES = (process.env.ALLOWED_MIME_TYPES || 'application/pdf,image/jpeg,image/png,image/webp').split(',')
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '20', 10)

function validateFile(file) {
  const errors = []

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    errors.push(`Tipe file '${file.mimetype}' tidak didukung. Gunakan: PDF, JPEG, PNG, atau WebP.`)
  }

  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    errors.push(`Ukuran file (${(file.size / 1024 / 1024).toFixed(1)}MB) melebihi batas ${MAX_FILE_SIZE_MB}MB.`)
  }

  return errors
}

module.exports = { validateFile }
