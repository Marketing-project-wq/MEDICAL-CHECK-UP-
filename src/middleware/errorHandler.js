const multer = require('multer')

function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: `Ukuran file melebihi batas ${process.env.MAX_FILE_SIZE_MB || 20}MB.`,
      })
    }
    return res.status(400).json({ success: false, message: err.message })
  }

  if (err.message && err.message.includes('Tipe file tidak didukung')) {
    return res.status(415).json({ success: false, message: err.message })
  }

  console.error('[ErrorHandler]', err)
  res.status(500).json({ success: false, message: 'Terjadi kesalahan internal.' })
}

module.exports = errorHandler
