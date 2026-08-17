import { validateExcelFile, sanitizeFilename } from '@/lib/validation'

describe('validation', () => {
  describe('validateExcelFile', () => {
    it('should accept valid XLSX file', () => {
      const file = new File(['test'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const result = validateExcelFile(file)
      expect(result.ok).toBe(true)
    })

    it('should accept valid XLS file', () => {
      const file = new File(['test'], 'test.xls', { type: 'application/vnd.ms-excel' })
      const result = validateExcelFile(file)
      expect(result.ok).toBe(true)
    })

    it('should accept valid CSV file', () => {
      const file = new File(['test'], 'test.csv', { type: 'text/csv' })
      const result = validateExcelFile(file)
      expect(result.ok).toBe(true)
    })

    it('should reject non-Excel file types', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      const result = validateExcelFile(file)
      expect(result.ok).toBe(false)
      expect(result.error?.toLowerCase()).toContain('format')
    })

    it('should reject file by extension even if MIME type is correct', () => {
      // File with .txt extension but Excel MIME type
      const file = new File(['test'], 'test.txt', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const result = validateExcelFile(file)
      expect(result.ok).toBe(false)
    })

    it('should reject files over 10MB', () => {
      const largeContent = new Uint8Array(11 * 1024 * 1024) // 11 MB
      const file = new File([largeContent], 'large.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const result = validateExcelFile(file)
      expect(result.ok).toBe(false)
      // Oversized files report via `sizeExceeded` (not `error`) so callers can
      // render a plan-aware, translated message — see src/lib/validation.ts.
      expect(result.sizeExceeded).toBeTruthy()
      expect(result.sizeExceeded?.limitBytes).toBe(10 * 1024 * 1024)
    })

    it('should accept files exactly at 10MB limit', () => {
      const content = new Uint8Array(10 * 1024 * 1024) // Exactly 10 MB
      const file = new File([content], 'large.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const result = validateExcelFile(file)
      expect(result.ok).toBe(true)
    })

    it('should provide error message on failure', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const result = validateExcelFile(file)
      expect(result.ok).toBe(false)
      expect(result.error).toBeTruthy()
      expect(typeof result.error).toBe('string')
    })
  })

  describe('sanitizeFilename', () => {
    it('should remove path traversal sequences', () => {
      const filename = '../../../etc/passwd'
      const result = sanitizeFilename(filename)
      expect(result).not.toContain('..')
      expect(result).not.toContain('/')
    })

    it('should remove null bytes', () => {
      const filename = 'test\x00file.xlsx'
      const result = sanitizeFilename(filename)
      expect(result).not.toContain('\x00')
    })

    it('should preserve file extension', () => {
      const filename = 'My Data 2024.xlsx'
      const result = sanitizeFilename(filename)
      expect(result).toContain('.xlsx')
    })

    it('should handle filenames with special characters', () => {
      const filename = 'file@name#$%&.csv'
      const result = sanitizeFilename(filename)
      expect(result).toBeTruthy()
      // Should not crash and return something usable
      expect(typeof result).toBe('string')
    })

    it('should handle very long filenames', () => {
      const filename = 'a'.repeat(300) + '.xlsx'
      const result = sanitizeFilename(filename)
      expect(result.length).toBeLessThan(filename.length)
    })

    it('should not sanitize to empty string', () => {
      const filename = '../../../'
      const result = sanitizeFilename(filename)
      expect(result.length).toBeGreaterThan(0)
    })
  })
})
