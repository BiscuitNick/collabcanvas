import { describe, it, expect } from 'vitest'
import { createTextContent, validateTextLength, truncateText, getTextExcerpt, TEXT_VALIDATION } from '../utils'
import { ContentType, ContentVersion, isTextContent } from '../../types'

describe('Text Content Factory', () => {
  const mockUserId = 'user123'
  const mockX = 100
  const mockY = 200

  it('should create text content with default values', () => {
    const textContent = createTextContent(mockX, mockY, mockUserId)

    expect(textContent.type).toBe(ContentType.TEXT)
    expect(textContent.version).toBe(ContentVersion.V2)
    expect(textContent.x).toBe(mockX)
    expect(textContent.y).toBe(mockY)
    expect(textContent.text).toBe('hello world')
    expect(textContent.fontSize).toBe(24)
    expect(textContent.fontFamily).toBe('Arial')
    expect(textContent.fontStyle).toBe('normal')
    expect(textContent.fill).toBe('#000000')
    expect(textContent.opacity).toBe(1)
    expect(textContent.rotation).toBe(0)
    expect(textContent.createdBy).toBe(mockUserId)
  })

  it('should create text content with custom values', () => {
    const customText = 'Custom text'
    const textContent = createTextContent(mockX, mockY, mockUserId, {
      text: customText,
      fontSize: 36,
      fill: '#ff0000',
      opacity: 0.8,
      rotation: 45,
    })

    expect(textContent.text).toBe(customText)
    expect(textContent.fontSize).toBe(36)
    expect(textContent.fill).toBe('#ff0000')
    expect(textContent.opacity).toBe(0.8)
    expect(textContent.rotation).toBe(45)
  })

  it('should truncate text that exceeds max length', () => {
    const longText = 'a'.repeat(6000)
    const textContent = createTextContent(mockX, mockY, mockUserId, {
      text: longText,
    })

    expect(textContent.text.length).toBe(TEXT_VALIDATION.MAX_CHARS)
  })
})

describe('Text Validation', () => {
  it('should validate text within limits', () => {
    const result = validateTextLength('Hello world')
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should accept empty text', () => {
    const result = validateTextLength('')
    expect(result.valid).toBe(true)
  })

  it('should reject text exceeding max length', () => {
    const longText = 'a'.repeat(5001)
    const result = validateTextLength(longText)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('5000')
  })

  it('should truncate text to max length', () => {
    const longText = 'a'.repeat(6000)
    const truncated = truncateText(longText)
    expect(truncated.length).toBe(TEXT_VALIDATION.MAX_CHARS)
  })

  it('should not modify text within limits', () => {
    const normalText = 'Hello world'
    const truncated = truncateText(normalText)
    expect(truncated).toBe(normalText)
  })
})

describe('Text Excerpt', () => {
  it('should return full text if within limit', () => {
    const text = 'Short text'
    expect(getTextExcerpt(text)).toBe(text)
  })

  it('should truncate long text with ellipsis', () => {
    const text = 'This is a very long text that needs to be truncated'
    const excerpt = getTextExcerpt(text, 20)
    expect(excerpt).toBe('This is a very long ...')
    expect(excerpt.length).toBe(23) // 20 chars + '...'
  })

  it('should return "Text" for empty string', () => {
    expect(getTextExcerpt('')).toBe('Text')
  })

  it('should use default max length of 20', () => {
    const text = 'a'.repeat(30)
    const excerpt = getTextExcerpt(text)
    expect(excerpt).toBe('a'.repeat(20) + '...')
  })
})

describe('Text Content Type Guard', () => {
  it('should identify text content correctly', () => {
    const textContent = {
      ...createTextContent(0, 0, 'user123'),
      id: 'text1',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    expect(isTextContent(textContent)).toBe(true)
  })

  it('should reject non-text content', () => {
    const rectangleContent = {
      type: ContentType.RECTANGLE,
      id: 'rect1',
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      fill: '#000000',
      rotation: 0,
      version: ContentVersion.V2,
      createdBy: 'user123',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    expect(isTextContent(rectangleContent as any)).toBe(false)
  })
})
