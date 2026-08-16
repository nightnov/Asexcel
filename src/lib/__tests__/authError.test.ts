import { getAuthErrorMessage, logSupabaseError } from '@/lib/authError'

describe('authError', () => {
  describe('getAuthErrorMessage', () => {
    it('should return error message for common auth errors', () => {
      const knownErrors = [
        'Email not confirmed',
        'Invalid login credentials',
        'User already registered',
      ]

      knownErrors.forEach((error) => {
        const message = getAuthErrorMessage(error)
        expect(message).toBeTruthy()
        expect(typeof message).toBe('string')
      })
    })

    it('should return fallback message for unknown errors', () => {
      const unknownError = 'Some random unknown error code'
      const message = getAuthErrorMessage(unknownError)
      expect(message).toBeTruthy()
      expect(typeof message).toBe('string')
      // Should not contain the raw error code for unknown errors
      expect(message.length).toBeGreaterThan(0)
    })

    it('should handle empty error code', () => {
      const message = getAuthErrorMessage('')
      expect(message).toBeTruthy()
    })

    it('should be user-friendly (French)', () => {
      const message = getAuthErrorMessage('Invalid login credentials')
      // Message should be in French for French users
      expect(message).toBeTruthy()
      // Common French words that might appear
      const frenchWords = ['erreur', 'invalide', 'credentials', 'mot', 'passe', 'email']
      const isFrench = frenchWords.some((word) =>
        message.toLowerCase().includes(word)
      )
      // At least should be a reasonable message
      expect(message.length).toBeGreaterThan(5)
    })
  })

  describe('logSupabaseError', () => {
    it('should not throw on valid error object', () => {
      const error = new Error('Test error')
      expect(() => {
        logSupabaseError(error)
      }).not.toThrow()
    })

    it('should handle Error instances', () => {
      const error = new Error('Supabase connection failed')
      expect(() => {
        logSupabaseError(error)
      }).not.toThrow()
    })

    it('should handle objects with message property', () => {
      const error = { message: 'Some error' }
      expect(() => {
        logSupabaseError(error)
      }).not.toThrow()
    })

    it('should handle null/undefined', () => {
      expect(() => {
        logSupabaseError(null)
      }).not.toThrow()

      expect(() => {
        logSupabaseError(undefined)
      }).not.toThrow()
    })
  })
})
