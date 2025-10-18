import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

// Clamp value between min and max
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// Get random color from predefined palette
const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
]

export function getRandomColor(): string {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]
}

// Get consistent color for user ID
export function getUserColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length]
}

// Get viewport center considering stage position and scale
export function getViewportCenter(
  stagePosition: { x: number; y: number },
  stageScale: number,
  viewportWidth: number,
  viewportHeight: number
): { x: number; y: number } {
  return {
    x: (-stagePosition.x + viewportWidth / 2) / stageScale,
    y: (-stagePosition.y + viewportHeight / 2) / stageScale
  }
}

// Calculate dynamic step for zoom based on current zoom level
export const getZoomStep = (currentPercentage: number) => {
  if (currentPercentage < 25) return 1
  if (currentPercentage < 100) return 5
  return 10
}

// Text validation constants
export const TEXT_VALIDATION = {
  MIN_CHARS: 0,
  MAX_CHARS: 5000,
} as const

// Validate text content length
export function validateTextLength(text: string): { valid: boolean; error?: string } {
  if (text.length < TEXT_VALIDATION.MIN_CHARS) {
    return { valid: false, error: `Text must be at least ${TEXT_VALIDATION.MIN_CHARS} characters` }
  }
  if (text.length > TEXT_VALIDATION.MAX_CHARS) {
    return { valid: false, error: `Text must not exceed ${TEXT_VALIDATION.MAX_CHARS} characters` }
  }
  return { valid: true }
}

// Truncate text to max length
export function truncateText(text: string, maxLength: number = TEXT_VALIDATION.MAX_CHARS): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength)
}

// Get text excerpt for display (e.g., in layers panel)
export function getTextExcerpt(text: string, maxLength: number = 20): string {
  if (!text) return 'Text'
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Format time elapsed (e.g., "2 minutes ago", "just now")
export function formatTimeAgo(date: number | Date | null | undefined): string {
  if (!date) return 'never'

  const now = Date.now()
  const dateTime = date instanceof Date ? date.getTime() : (typeof date === 'number' ? date : Date.now())
  const elapsedMs = now - dateTime

  if (elapsedMs < 1000) return 'just now'

  const elapsedSecs = Math.floor(elapsedMs / 1000)
  if (elapsedSecs < 60) return `${elapsedSecs}s ago`

  const elapsedMins = Math.floor(elapsedSecs / 60)
  if (elapsedMins < 60) return elapsedMins === 1 ? '1 minute ago' : `${elapsedMins} minutes ago`

  const elapsedHours = Math.floor(elapsedMins / 60)
  if (elapsedHours < 24) return elapsedHours === 1 ? '1 hour ago' : `${elapsedHours} hours ago`

  const elapsedDays = Math.floor(elapsedHours / 24)
  return elapsedDays === 1 ? '1 day ago' : `${elapsedDays} days ago`
}

// Import types for factory function
import type { TextContent } from '../types'
import { ContentType, ContentVersion, DEFAULT_CONTENT_VALUES } from '../types'

// Factory function to create TextContent
export function createTextContent(
  x: number,
  y: number,
  userId: string,
  options?: {
    text?: string
    fontSize?: number
    fontFamily?: typeof DEFAULT_CONTENT_VALUES.text.fontFamily
    fontStyle?: typeof DEFAULT_CONTENT_VALUES.text.fontStyle
    fill?: string
    textAlign?: typeof DEFAULT_CONTENT_VALUES.text.textAlign
    verticalAlign?: typeof DEFAULT_CONTENT_VALUES.text.verticalAlign
    opacity?: number
    rotation?: number
  }
): Omit<TextContent, 'id' | 'createdAt' | 'updatedAt'> {
  const defaults = DEFAULT_CONTENT_VALUES.text

  // Validate and truncate text if needed
  const text = options?.text !== undefined
    ? truncateText(options.text)
    : defaults.text

  return {
    type: ContentType.TEXT,
    version: ContentVersion.V2,
    x,
    y,
    text,
    fontSize: options?.fontSize ?? defaults.fontSize,
    fontFamily: options?.fontFamily ?? defaults.fontFamily,
    fontStyle: options?.fontStyle ?? defaults.fontStyle,
    fill: options?.fill ?? defaults.fill,
    textAlign: options?.textAlign ?? defaults.textAlign,
    verticalAlign: options?.verticalAlign ?? defaults.verticalAlign,
    opacity: options?.opacity ?? defaults.opacity,
    rotation: options?.rotation ?? defaults.rotation,
    createdBy: userId,
    // createdAt and updatedAt will be added by Firestore with serverTimestamp()
  }
}
