require('dotenv').config()
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
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

module.exports = app

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`MCU Upload service running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`)
  })
}
