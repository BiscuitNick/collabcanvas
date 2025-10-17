import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  FONT_CONFIG,
  preloadFonts,
  isFontLoaded,
  getFontFamilyCSS,
  getKonvaFontFamily,
  isFontStyleSupported,
  getAvailableFontFamilies,
  getFontConfig,
  generateFontStyle,
  getFontMetrics,
  calculateTextDimensions,
  initializeFontManager
} from './fontManager'
import { FontFamily, FontStyle } from '../types'

// Mock document.fonts
const mockFonts = {
  check: vi.fn(),
  add: vi.fn()
}

Object.defineProperty(document, 'fonts', {
  value: mockFonts,
  writable: true
})

// Mock FontFace
const mockFontFace = vi.fn().mockImplementation(() => ({
  load: vi.fn().mockResolvedValue(undefined)
}))

Object.defineProperty(window, 'FontFace', {
  value: mockFontFace,
  writable: true
})

// Mock canvas context
const mockContext = {
  measureText: vi.fn().mockReturnValue({ width: 100 }),
  font: ''
}

const mockCanvas = {
  getContext: vi.fn().mockReturnValue(mockContext)
}

// Mock document.createElement
const originalCreateElement = document.createElement
vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
  if (tagName === 'canvas') {
    return mockCanvas as HTMLCanvasElement;
  }
  return originalCreateElement.call(document, tagName)
})

describe('Font Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFonts.check.mockReturnValue(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('FONT_CONFIG', () => {
    it('should have configuration for all font families', () => {
      const fontFamilies = Object.values(FontFamily)
      
      fontFamilies.forEach(fontFamily => {
        expect(FONT_CONFIG[fontFamily]).toBeDefined()
        expect(FONT_CONFIG[fontFamily].name).toBeTruthy()
        expect(FONT_CONFIG[fontFamily].fallback).toBeTruthy()
        expect(FONT_CONFIG[fontFamily].weights).toBeInstanceOf(Array)
        expect(FONT_CONFIG[fontFamily].styles).toBeInstanceOf(Array)
      })
    })

    it('should have correct font names', () => {
      expect(FONT_CONFIG[FontFamily.ARIAL].name).toBe('Arial')
      expect(FONT_CONFIG[FontFamily.HELVETICA].name).toBe('Helvetica')
      expect(FONT_CONFIG[FontFamily.TIMES_NEW_ROMAN].name).toBe('Times New Roman')
      expect(FONT_CONFIG[FontFamily.GEORGIA].name).toBe('Georgia')
      expect(FONT_CONFIG[FontFamily.VERDANA].name).toBe('Verdana')
    })
  })

  describe('preloadFonts', () => {
    it('should handle fonts that are already loaded', async () => {
      mockFonts.check.mockReturnValue(true)
      
      await preloadFonts()
      
      expect(mockFonts.check).toHaveBeenCalled()
    })

    it('should attempt to load fonts that are not loaded', async () => {
      mockFonts.check.mockReturnValue(false)
      const mockLoad = vi.fn().mockResolvedValue(undefined)
      mockFontFace.mockImplementation(() => ({
        load: mockLoad
      }))
      
      await preloadFonts()
      
      expect(mockFontFace).toHaveBeenCalled()
      expect(mockLoad).toHaveBeenCalled()
      expect(mockFonts.add).toHaveBeenCalled()
    })

    it('should handle font loading errors gracefully', async () => {
      mockFonts.check.mockReturnValue(false)
      const mockLoad = vi.fn().mockRejectedValue(new Error('Font loading failed'))
      mockFontFace.mockImplementation(() => ({
        load: mockLoad
      }))
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      await preloadFonts()
      
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('isFontLoaded', () => {
    it('should return false for unknown font families', () => {
      expect(isFontLoaded('unknown' as FontFamily)).toBe(false)
    })
  })

  describe('getFontFamilyCSS', () => {
    it('should return correct CSS font family string', () => {
      expect(getFontFamilyCSS(FontFamily.ARIAL)).toBe('"Arial", sans-serif')
      expect(getFontFamilyCSS(FontFamily.TIMES_NEW_ROMAN)).toBe('"Times New Roman", serif')
    })

    it('should handle unknown font families', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const result = getFontFamilyCSS('unknown' as FontFamily)
      
      expect(result).toBe('Arial, sans-serif')
      expect(consoleSpy).toHaveBeenCalledWith('Unknown font family: unknown')
      
      consoleSpy.mockRestore()
    })
  })

  describe('getKonvaFontFamily', () => {
    it('should return correct Konva font family string', () => {
      expect(getKonvaFontFamily(FontFamily.ARIAL)).toBe('Arial')
      expect(getKonvaFontFamily(FontFamily.TIMES_NEW_ROMAN)).toBe('Times New Roman')
    })

    it('should handle unknown font families', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const result = getKonvaFontFamily('unknown' as FontFamily)
      
      expect(result).toBe('Arial')
      expect(consoleSpy).toHaveBeenCalledWith('Unknown font family: unknown')
      
      consoleSpy.mockRestore()
    })
  })

  describe('isFontStyleSupported', () => {
    it('should return true for supported font styles', () => {
      expect(isFontStyleSupported(FontFamily.ARIAL, FontStyle.NORMAL)).toBe(true)
      expect(isFontStyleSupported(FontFamily.ARIAL, FontStyle.BOLD)).toBe(true)
      expect(isFontStyleSupported(FontFamily.ARIAL, FontStyle.ITALIC)).toBe(true)
      expect(isFontStyleSupported(FontFamily.ARIAL, FontStyle.BOLD_ITALIC)).toBe(true)
    })

    it('should return false for unknown font families', () => {
      expect(isFontStyleSupported('unknown' as FontFamily, FontStyle.NORMAL)).toBe(false)
    })
  })

  describe('getAvailableFontFamilies', () => {
    it('should return all available font families', () => {
      const families = getAvailableFontFamilies()
      
      expect(families).toHaveLength(5)
      expect(families).toContain(FontFamily.ARIAL)
      expect(families).toContain(FontFamily.HELVETICA)
      expect(families).toContain(FontFamily.TIMES_NEW_ROMAN)
      expect(families).toContain(FontFamily.GEORGIA)
      expect(families).toContain(FontFamily.VERDANA)
    })
  })

  describe('getFontConfig', () => {
    it('should return font configuration for valid font families', () => {
      const config = getFontConfig(FontFamily.ARIAL)
      
      expect(config).toBeDefined()
      expect(config.name).toBe('Arial')
      expect(config.fallback).toBe('sans-serif')
    })

    it('should return undefined for unknown font families', () => {
      const config = getFontConfig('unknown' as FontFamily)
      
      expect(config).toBeUndefined()
    })
  })

  describe('generateFontStyle', () => {
    it('should generate correct font style for normal text', () => {
      const style = generateFontStyle(FontFamily.ARIAL, 16, FontStyle.NORMAL)
      
      expect(style).toBe('normal normal 16px Arial')
    })

    it('should generate correct font style for bold text', () => {
      const style = generateFontStyle(FontFamily.ARIAL, 16, FontStyle.BOLD)
      
      expect(style).toBe('normal bold 16px Arial')
    })

    it('should generate correct font style for italic text', () => {
      const style = generateFontStyle(FontFamily.ARIAL, 16, FontStyle.ITALIC)
      
      expect(style).toBe('italic normal 16px Arial')
    })

    it('should generate correct font style for bold italic text', () => {
      const style = generateFontStyle(FontFamily.ARIAL, 16, FontStyle.BOLD_ITALIC)
      
      expect(style).toBe('italic bold 16px Arial')
    })
  })

  describe('getFontMetrics', () => {
    it('should return font metrics with canvas context', () => {
      const metrics = getFontMetrics(FontFamily.ARIAL, 16, FontStyle.NORMAL)
      
      expect(metrics).toHaveProperty('lineHeight')
      expect(metrics).toHaveProperty('baseline')
      expect(metrics).toHaveProperty('ascent')
      expect(metrics).toHaveProperty('descent')
      expect(metrics.lineHeight).toBe(19.2) // 16 * 1.2
    })

    it('should handle missing canvas context gracefully', () => {
      mockCanvas.getContext.mockReturnValue(null)
      
      const metrics = getFontMetrics(FontFamily.ARIAL, 16, FontStyle.NORMAL)
      
      expect(metrics).toHaveProperty('lineHeight')
      expect(metrics).toHaveProperty('baseline')
      expect(metrics.lineHeight).toBe(19.2) // 16 * 1.2
    })
  })

  describe('calculateTextDimensions', () => {
    it('should calculate text dimensions with canvas context', () => {
      mockContext.measureText.mockReturnValue({ width: 100 })
      
      const dimensions = calculateTextDimensions('Hello World', FontFamily.ARIAL, 16, FontStyle.NORMAL)
      
      expect(dimensions).toHaveProperty('width')
      expect(dimensions).toHaveProperty('height')
      expect(dimensions).toHaveProperty('lines')
      expect(dimensions.lines).toEqual(['Hello World'])
    })

    it('should handle text wrapping with maxWidth', () => {
      // Mock measureText to return width based on text length
      mockContext.measureText.mockImplementation((text) => ({ width: text.length * 20 }))
      
      const dimensions = calculateTextDimensions(
        'This is a very long text that should wrap',
        FontFamily.ARIAL,
        16,
        FontStyle.NORMAL,
        50
      )
      
      // Verify the function returns proper structure
      expect(dimensions).toHaveProperty('width')
      expect(dimensions).toHaveProperty('height')
      expect(dimensions).toHaveProperty('lines')
      expect(Array.isArray(dimensions.lines)).toBe(true)
      expect(dimensions.lines.length).toBeGreaterThan(0)
    })

    it('should handle missing canvas context gracefully', () => {
      mockCanvas.getContext.mockReturnValue(null)
      
      const dimensions = calculateTextDimensions('Hello World', FontFamily.ARIAL, 16, FontStyle.NORMAL)
      
      expect(dimensions).toHaveProperty('width')
      expect(dimensions).toHaveProperty('height')
      expect(dimensions).toHaveProperty('lines')
      expect(dimensions.lines).toEqual(['Hello World'])
    })
  })

  describe('initializeFontManager', () => {
    it('should initialize font manager successfully', async () => {
      mockFonts.check.mockReturnValue(true)
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      await initializeFontManager()
      
      expect(consoleSpy).toHaveBeenCalledWith('✅ Font management system initialized')
      
      consoleSpy.mockRestore()
    })

    it('should handle initialization errors gracefully', async () => {
      mockFonts.check.mockImplementation(() => {
        throw new Error('Font check failed')
      })
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      await initializeFontManager()
      
      // Should have multiple warn calls for each font that failed to load
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })
})
