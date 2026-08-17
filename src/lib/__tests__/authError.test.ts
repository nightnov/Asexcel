import { getAuthErrorMessage, logSupabaseError } from '@/lib/authError'

describe('authError', () => {
  describe('getAuthErrorMessage', () => {
    it('should return the Error instance message when present', () => {
      const error = new Error('Invalid login credentials')
      expect(getAuthErrorMessage(error, 'fallback')).toBe('Invalid login credentials')
    })

    it('should return a string error as-is', () => {
      expect(getAuthErrorMessage('Some string error', 'fallback')).toBe('Some string error')
    })

    it('should extract .message from a plain error-shaped object', () => {
      const error = { message: 'Some error' }
      expect(getAuthErrorMessage(error, 'fallback')).toBe('Some error')
    })

    it('should extract .error_description when .message is absent', () => {
      const error = { error_description: 'Described error' }
      expect(getAuthErrorMessage(error, 'fallback')).toBe('Described error')
    })

    it('should extract .msg when .message and .error_description are absent', () => {
      const error = { msg: 'Msg error' }
      expect(getAuthErrorMessage(error, 'fallback')).toBe('Msg error')
    })

    it('should return the fallback for an empty string error', () => {
      expect(getAuthErrorMessage('', 'fallback message')).toBe('fallback message')
    })

    it('should return the fallback for null/undefined', () => {
      expect(getAuthErrorMessage(null, 'fallback message')).toBe('fallback message')
      expect(getAuthErrorMessage(undefined, 'fallback message')).toBe('fallback message')
    })

    it('should return the fallback for an Error with an empty message', () => {
      expect(getAuthErrorMessage(new Error(''), 'fallback message')).toBe('fallback message')
    })

    it('should return the fallback for an object with no recognized field', () => {
      expect(getAuthErrorMessage({ status: 500 }, 'fallback message')).toBe('fallback message')
    })
  })

  describe('logSupabaseError', () => {
    it('should not throw on an Error instance', () => {
      expect(() => logSupabaseError('Erreur :', new Error('Test error'))).not.toThrow()
    })

    it('should not throw on a plain object with a message property', () => {
      expect(() => logSupabaseError('Erreur :', { message: 'Some error' })).not.toThrow()
    })

    it('should not throw on null or undefined', () => {
      expect(() => logSupabaseError('Erreur :', null)).not.toThrow()
      expect(() => logSupabaseError('Erreur :', undefined)).not.toThrow()
    })
  })
})
