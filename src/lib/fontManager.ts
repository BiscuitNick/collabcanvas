import { FontFamily, FontStyle } from '../types'

/**
 * Font management system for CollabCanvas text shapes
 * Provides utilities for font loading, validation, and management
 */

// Font configuration for the 5 most popular fonts
export const FONT_CONFIG = {
  [FontFamily.ARIAL]: {
    name: 'Arial',
    fallback: 'sans-serif',
    weights: ['normal', 'bold'],
    styles: ['normal', 'italic']
  },
  [FontFamily.HELVETICA]: {
    name: 'Helvetica',
    fallback: 'sans-serif',
    weights: ['normal', 'bold'],
    styles: ['normal', 'italic']
  },
  [FontFamily.TIMES_NEW_ROMAN]: {
    name: 'Times New Roman',
    fallback: 'serif',
    weights: ['normal', 'bold'],
    styles: ['normal', 'italic']
  },
  [FontFamily.GEORGIA]: {
    name: 'Georgia',
    fallback: 'serif',
    weights: ['normal', 'bold'],
    styles: ['normal', 'italic']
  },
  [FontFamily.VERDANA]: {
    name: 'Verdana',
    fallback: 'sans-serif',
    weights: ['normal', 'bold'],
    styles: ['normal', 'italic']
  }
} as const

/**
 * Font loading status tracking
 */
const fontLoadStatus = new Map<FontFamily, boolean>()

/**
 * Preload fonts to ensure they're available when needed
 * This helps prevent layout shifts and improves performance
 */
export const preloadFonts = async (): Promise<void> => {
  const fontPromises = Object.values(FONT_CONFIG).map(async (font) => {
    try {
      // Check if font is already loaded
      if (document.fonts && document.fonts.check) {
        const isLoaded = document.fonts.check(`16px "${font.name}"`)
        if (isLoaded) {
          fontLoadStatus.set(font.name as FontFamily, true)
          return
        }
      }

      // Load font using FontFace API if available
      if (window.FontFace) {
        const fontFace = new FontFace(font.name, `url(https://fonts.googleapis.com/css2?family=${font.name.replace(/\s+/g, '+')}:wght@400;700&display=swap)`)
        
        try {
          await fontFace.load()
          document.fonts.add(fontFace)
          fontLoadStatus.set(font.name as FontFamily, true)
        } catch (error) {
          console.warn(`Failed to load font ${font.name}:`, error)
          fontLoadStatus.set(font.name as FontFamily, false)
        }
      } else {
        // Fallback: assume font is available
        fontLoadStatus.set(font.name as FontFamily, true)
      }
    } catch (error) {
      console.warn(`Error preloading font ${font.name}:`, error)
      fontLoadStatus.set(font.name as FontFamily, false)
    }
  })

  await Promise.allSettled(fontPromises)
}

/**
 * Check if a font is loaded and available
 */
export const isFontLoaded = (fontFamily: FontFamily): boolean => {
  return fontLoadStatus.get(fontFamily) ?? false
}

/**
 * Get the CSS font family string with fallbacks
 */
export const getFontFamilyCSS = (fontFamily: FontFamily): string => {
  const config = FONT_CONFIG[fontFamily]
  if (!config) {
    console.warn(`Unknown font family: ${fontFamily}`)
    return 'Arial, sans-serif'
  }

  return `"${config.name}", ${config.fallback}`
}

/**
 * Get the Konva font family string (without quotes)
 */
export const getKonvaFontFamily = (fontFamily: FontFamily): string => {
  const config = FONT_CONFIG[fontFamily]
  if (!config) {
    console.warn(`Unknown font family: ${fontFamily}`)
    return 'Arial'
  }

  return config.name
}

/**
 * Validate if a font style is supported for a given font family
 */
export const isFontStyleSupported = (fontFamily: FontFamily): boolean => {
  const config = FONT_CONFIG[fontFamily]
  if (!config) {
    return false
  }

  // All font families support all styles in our configuration
  return true
}

/**
 * Get all available font families
 */
export const getAvailableFontFamilies = (): FontFamily[] => {
  return Object.keys(FONT_CONFIG) as FontFamily[]
}

/**
 * Get font configuration for a specific font family
 */
export const getFontConfig = (fontFamily: FontFamily) => {
  return FONT_CONFIG[fontFamily]
}

/**
 * Generate font style string for Konva Text component
 */
export const generateFontStyle = (fontFamily: FontFamily, fontSize: number, fontStyle: FontStyle): string => {
  const family = getKonvaFontFamily(fontFamily)
  const weight = fontStyle === 'bold' || fontStyle === 'bold italic' ? 'bold' : 'normal'
  const style = fontStyle === 'italic' || fontStyle === 'bold italic' ? 'italic' : 'normal'
  
  return `${style} ${weight} ${fontSize}px ${family}`
}

/**
 * Get font metrics for text sizing calculations
 * This is a simplified version - in a real app you might want to use a more sophisticated approach
 */
export const getFontMetrics = (fontFamily: FontFamily, fontSize: number, fontStyle: FontStyle) => {
  const style = generateFontStyle(fontFamily, fontSize, fontStyle)
  
  // Create a temporary element to measure text
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  
  if (!context) {
    return {
      lineHeight: fontSize * 1.2,
      baseline: fontSize * 0.8,
      ascent: fontSize * 0.8,
      descent: fontSize * 0.2
    }
  }

  context.font = style
  
  // Measure common characters to estimate metrics
  const testText = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const metrics = context.measureText(testText)
  
  return {
    lineHeight: fontSize * 1.2,
    baseline: fontSize * 0.8,
    ascent: fontSize * 0.8,
    descent: fontSize * 0.2,
    averageCharWidth: metrics.width / testText.length
  }
}

/**
 * Calculate text dimensions for a given text string
 */
export const calculateTextDimensions = (
  text: string,
  fontFamily: FontFamily,
  fontSize: number,
  fontStyle: FontStyle,
  maxWidth?: number
): { width: number; height: number; lines: string[] } => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  
  if (!context) {
    // Fallback calculations
    const estimatedWidth = text.length * fontSize * 0.6
    const estimatedHeight = fontSize * 1.2
    return {
      width: estimatedWidth,
      height: estimatedHeight,
      lines: [text]
    }
  }

  const style = generateFontStyle(fontFamily, fontSize, fontStyle)
  context.font = style
  
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''
  let maxLineWidth = 0
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const metrics = context.measureText(testLine)
    const lineWidth = metrics.width
    
    if (maxWidth && lineWidth > maxWidth && currentLine) {
      lines.push(currentLine)
      maxLineWidth = Math.max(maxLineWidth, context.measureText(currentLine).width)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  
  if (currentLine) {
    lines.push(currentLine)
    maxLineWidth = Math.max(maxLineWidth, context.measureText(currentLine).width)
  }
  
  return {
    width: maxLineWidth,
    height: lines.length * fontSize * 1.2,
    lines
  }
}

/**
 * Initialize font management system
 * Call this when the app starts to preload fonts
 */
export const initializeFontManager = async (): Promise<void> => {
  try {
    await preloadFonts()
    console.log('✅ Font management system initialized')
  } catch (error) {
    console.warn('⚠️ Font management system initialization failed:', error)
  }
}
