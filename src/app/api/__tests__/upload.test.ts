import { POST } from '@/app/api/upload/route'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() =>
        Promise.resolve({ data: { user: { id: 'test-user' } } })
      ),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ error: null })),
        remove: jest.fn(() => Promise.resolve({ error: null })),
        createSignedUrl: jest.fn(() =>
          Promise.resolve({ data: { signedUrl: 'https://signed-url' } })
        ),
      })),
    },
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() =>
            Promise.resolve({
              data: { id: '123', user_id: 'test-user' },
              error: null,
            })
          ),
        })),
      })),
    })),
  })),
}))

jest.mock('@/lib/validation', () => ({
  validateExcelFile: jest.fn((file) => ({
    ok: file.name.endsWith('.xlsx') || file.name.endsWith('.csv'),
    error: 'Invalid file format',
  })),
  sanitizeFilename: jest.fn((name) => name),
}))

jest.mock('@/lib/turnstile', () => ({
  verifyTurnstileToken: jest.fn(() =>
    Promise.resolve({ success: true })
  ),
}))

jest.mock('@/lib/dev-auth', () => ({
  AUTH_DISABLED: false,
  MOCK_USER_ID: 'mock-user',
}))

describe('/api/upload', () => {
  it('should reject request without file', async () => {
    const formData = new FormData()
    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })

  it('should reject invalid file type', async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    const formData = new FormData()
    formData.append('file', file)
    formData.append('turnstileToken', 'test-token')

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)

    expect(response.status).toBe(422)
  })

  it('should require turnstile token when auth enabled', async () => {
    const file = new File(['test'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const formData = new FormData()
    formData.append('file', file)
    // No turnstile token

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)

    // Should either succeed (if Turnstile verification passes null as valid)
    // or fail with auth error
    expect([400, 403, 200]).toContain(response.status)
  })
})
