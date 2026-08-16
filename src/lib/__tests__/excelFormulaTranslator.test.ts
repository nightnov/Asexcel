import {
  translateFormula,
  detectLanguage,
  swapSeparators,
  LANGUAGES,
} from '@/lib/excelFormulaTranslator'

describe('excelFormulaTranslator', () => {
  describe('translateFormula', () => {
    it('should translate RECHERCHEV (FR) to VLOOKUP (EN)', () => {
      const input = '=RECHERCHEV(A1,B:C,2,0)'
      const result = translateFormula(input, 'fr', 'en')
      expect(result).toContain('VLOOKUP')
      expect(result).not.toContain('RECHERCHEV')
    })

    it('should translate VLOOKUP (EN) to RECHERCHEV (FR)', () => {
      const input = '=VLOOKUP(A1,B:C,2,0)'
      const result = translateFormula(input, 'en', 'fr')
      expect(result).toContain('RECHERCHEV')
      expect(result).not.toContain('VLOOKUP')
    })

    it('should preserve quoted text during translation', () => {
      const input = '=IF(A1="RECHERCHEV",B1,C1)'
      const result = translateFormula(input, 'en', 'fr')
      // "RECHERCHEV" inside quotes should remain unchanged
      expect(result).toContain('"RECHERCHEV"')
    })

    it('should handle multiple functions in one formula', () => {
      const input = '=IF(AND(A1>0,B1>0),RECHERCHEV(A2,C:D,2,0),SOMME(E:E))'
      const result = translateFormula(input, 'fr', 'en')
      expect(result).toContain('IF')
      expect(result).toContain('AND')
      expect(result).toContain('VLOOKUP')
      expect(result).toContain('SUM')
    })

    it('should return same formula when source and target are identical', () => {
      const input = '=RECHERCHEV(A1,B:C,2,0)'
      const result = translateFormula(input, 'fr', 'fr')
      expect(result).toBe(input)
    })

    it('should handle complex nested formulas', () => {
      const input = '=SI(RECHERCHEV(A1;B:C;2;FAUX)>10;"Grand";"Petit")'
      const result = translateFormula(input, 'fr', 'en')
      expect(result).toContain('IF')
      expect(result).toContain('VLOOKUP')
    })

    it('should preserve case insensitivity', () => {
      const inputs = [
        '=recherchev(A1,B:C,2,0)',
        '=RECHERCHEV(A1,B:C,2,0)',
        '=ReCheRchEv(A1,B:C,2,0)',
      ]
      inputs.forEach((input) => {
        const result = translateFormula(input, 'fr', 'en')
        expect(result.toUpperCase()).toContain('VLOOKUP')
      })
    })
  })

  describe('detectLanguage', () => {
    it('should detect French formula', () => {
      const formula = '=RECHERCHEV(A1,B:C,2,0)'
      const detected = detectLanguage(formula)
      expect(detected).toBe('fr')
    })

    it('should detect English formula', () => {
      const formula = '=VLOOKUP(A1,B:C,2,0)'
      const detected = detectLanguage(formula)
      expect(detected).toBe('en')
    })

    it('should detect Spanish formula', () => {
      const formula = '=BUSCARV(A1,B:C,2,0)'
      const detected = detectLanguage(formula)
      expect(detected).toBe('es')
    })

    it('should return null for empty formula', () => {
      const detected = detectLanguage('')
      expect(detected).toBeNull()
    })

    it('should return null for plain text without functions', () => {
      const detected = detectLanguage('hello world')
      expect(detected).toBeNull()
    })

    it('should detect most prominent language in mixed formula', () => {
      const formula = '=RECHERCHEV(A1,B:C,2,0)+VLOOKUP(D1,E:F,2,0)'
      const detected = detectLanguage(formula)
      // Should detect one of the two; at minimum, not return null
      expect(detected).not.toBeNull()
    })
  })

  describe('swapSeparators', () => {
    it('should swap semicolons and commas', () => {
      const input = '=RECHERCHEV(A1;B:C;2;FAUX)'
      const result = swapSeparators(input)
      expect(result).toBe('=RECHERCHEV(A1,B:C,2,FAUX)')
    })

    it('should swap commas to semicolons', () => {
      const input = '=VLOOKUP(A1,B:C,2,FALSE)'
      const result = swapSeparators(input)
      expect(result).toBe('=VLOOKUP(A1;B:C;2;FALSE)')
    })

    it('should preserve separators inside quoted text', () => {
      const input = '=IF(A1="text;with;semicolons",B1,C1)'
      const result = swapSeparators(input)
      expect(result).toContain('"text;with;semicolons"')
    })

    it('should handle empty formula', () => {
      const result = swapSeparators('')
      expect(result).toBe('')
    })
  })

  describe('LANGUAGES constant', () => {
    it('should contain 13 languages', () => {
      expect(LANGUAGES.length).toBe(13)
    })

    it('should contain expected language codes', () => {
      const codes = LANGUAGES.map((l) => l.code)
      expect(codes).toContain('en')
      expect(codes).toContain('fr')
      expect(codes).toContain('es')
      expect(codes).toContain('de')
      expect(codes).toContain('pt')
      expect(codes).toContain('it')
      expect(codes).toContain('nl')
      expect(codes).toContain('pl')
      expect(codes).toContain('ru')
      expect(codes).toContain('tr')
      expect(codes).toContain('sv')
      expect(codes).toContain('zh')
      expect(codes).toContain('ja')
    })
  })
})
