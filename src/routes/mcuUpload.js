const { Router } = require('express')
const upload = require('../config/multer')
const { resolveUser, requireAuth } = require('../middleware/auth')
const {
  upload: uploadFile,
  listUploads,
  getUpload,
  deleteUpload,
} = require('../controllers/mcuUploadController')

const router = Router()

// All routes resolve user first (sets req.user = null for guests)
router.use(resolveUser)

// Guest + Member: upload a MCU file
// Members get DB record + signed URL; guests get signed URL only
router.post('/upload', upload.single('file'), uploadFile)

// Member-only routes
router.get('/uploads', requireAuth, listUploads)
router.get('/uploads/:id', requireAuth, getUpload)
router.delete('/uploads/:id', requireAuth, deleteUpload)

module.exports = router
