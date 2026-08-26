const multer = require('multer')

const ALLOWED_MIME_TYPES = (process.env.ALLOWED_MIME_TYPES || 'application/pdf,image/jpeg,image/png,image/webp').split(',')
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '20', 10)

const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`Tipe file tidak didukung. Hanya: ${ALLOWED_MIME_TYPES.join(', ')}`), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 1,
  },
})

module.exports = upload
