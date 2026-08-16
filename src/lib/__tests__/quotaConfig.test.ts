import { MEMBER_DAILY_LIMIT, GUEST_DAILY_LIMIT } from '@/lib/quotaConfig'

describe('quotaConfig', () => {
  describe('quota constants', () => {
    it('should define MEMBER_DAILY_LIMIT', () => {
      expect(MEMBER_DAILY_LIMIT).toBeDefined()
      expect(typeof MEMBER_DAILY_LIMIT).toBe('number')
      expect(MEMBER_DAILY_LIMIT).toBeGreaterThan(0)
    })

    it('should define GUEST_DAILY_LIMIT', () => {
      expect(GUEST_DAILY_LIMIT).toBeDefined()
      expect(typeof GUEST_DAILY_LIMIT).toBe('number')
      expect(GUEST_DAILY_LIMIT).toBeGreaterThan(0)
    })

    it('should have GUEST_DAILY_LIMIT less than MEMBER_DAILY_LIMIT', () => {
      expect(GUEST_DAILY_LIMIT).toBeLessThan(MEMBER_DAILY_LIMIT)
    })

    it('should use NEXT_PUBLIC_DAILY_FREE_QUESTIONS env var if set', () => {
      // If the env var is set, MEMBER_DAILY_LIMIT should reflect it
      const expectedValue = Number(process.env.NEXT_PUBLIC_DAILY_FREE_QUESTIONS || 15)
      expect(MEMBER_DAILY_LIMIT).toBe(expectedValue)
    })

    it('should default to 15 if env var not set', () => {
      // This test passes if MEMBER_DAILY_LIMIT is 15 (the default)
      // In CI, if env var is not set, it should default to 15
      if (!process.env.NEXT_PUBLIC_DAILY_FREE_QUESTIONS) {
        expect(MEMBER_DAILY_LIMIT).toBe(15)
      }
    })

    it('should have GUEST_DAILY_LIMIT as 5', () => {
      expect(GUEST_DAILY_LIMIT).toBe(5)
    })
  })
})
