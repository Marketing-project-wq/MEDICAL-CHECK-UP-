const request = require('supertest')

jest.mock('../config/supabase', () => ({
  supabaseAdmin: {
    auth: {
      getUser: jest.fn(),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: { path: 'mcu/guest/test.pdf' }, error: null }),
        createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: 'https://signed.url/test.pdf' }, error: null }),
        remove: jest.fn().mockResolvedValue({ error: null }),
      })),
    },
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'uuid-123',
          user_id: 'user-abc',
          storage_path: 'mcu/user-abc/test.pdf',
          original_name: 'test.pdf',
          mime_type: 'application/pdf',
          file_size: 1024,
          label: null,
          uploaded_at: new Date().toISOString(),
        },
        error: null,
      }),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
      delete: jest.fn().mockReturnThis(),
    })),
  },
  supabaseAnon: {},
}))

const app = require('../index')

const VALID_PDF = Buffer.from('%PDF-1.4 test content')

describe('POST /api/mcu/upload — guest', () => {
  it('rejects request with no file', async () => {
    const res = await request(app).post('/api/mcu/upload')
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('rejects unsupported file type', async () => {
    const res = await request(app)
      .post('/api/mcu/upload')
      .attach('file', Buffer.from('hello'), { filename: 'doc.txt', contentType: 'text/plain' })
    expect(res.status).toBe(415)
    expect(res.body.success).toBe(false)
  })

  it('accepts a valid PDF as guest', async () => {
    const res = await request(app)
      .post('/api/mcu/upload')
      .attach('file', VALID_PDF, { filename: 'result.pdf', contentType: 'application/pdf' })
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.guest).toBe(true)
    expect(res.body.data.signedUrl).toBeDefined()
    expect(res.body.cta).toBeDefined()
  })
})

describe('GET /api/mcu/uploads — member only', () => {
  it('returns 401 with gated CTA for guests', async () => {
    const res = await request(app).get('/api/mcu/uploads')
    expect(res.status).toBe(401)
    expect(res.body.gated).toBe(true)
    expect(res.body.cta).toBeDefined()
  })
})

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })
})
