const { validateFile } = require('../utils/validate')
const {
  uploadMcuFile,
  getMcuUploads,
  getMcuUploadById,
  deleteMcuUpload,
} = require('../services/mcuUploadService')

// POST /api/mcu/upload
// Guest: allowed, file stored but not linked to account
// Member: file stored and linked to user_id
async function upload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Tidak ada file yang dikirim.' })
    }

    const errors = validateFile(req.file)
    if (errors.length) {
      return res.status(422).json({ success: false, message: errors[0] })
    }

    const userId = req.user?.id || null
    const label = req.body.label || null
    const result = await uploadMcuFile({ file: req.file, userId, label })

    return res.status(201).json({
      success: true,
      message: userId
        ? 'File MCU berhasil diunggah dan disimpan ke akun Anda.'
        : 'File MCU berhasil diunggah. Login untuk menyimpan riwayat dan mengakses file kapan saja.',
      data: result,
      ...(userId ? {} : {
        cta: {
          label: 'Simpan ke Akun',
          url: 'https://my.20fit.id/login',
        },
      }),
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/mcu/uploads — Member only
async function listUploads(req, res, next) {
  try {
    const uploads = await getMcuUploads(req.user.id)
    res.json({ success: true, data: uploads })
  } catch (err) {
    next(err)
  }
}

// GET /api/mcu/uploads/:id — Member only
async function getUpload(req, res, next) {
  try {
    const upload = await getMcuUploadById(req.params.id, req.user.id)
    res.json({ success: true, data: upload })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/mcu/uploads/:id — Member only
async function deleteUpload(req, res, next) {
  try {
    await deleteMcuUpload(req.params.id, req.user.id)
    res.json({ success: true, message: 'File berhasil dihapus.' })
  } catch (err) {
    next(err)
  }
}

module.exports = { upload, listUploads, getUpload, deleteUpload }
