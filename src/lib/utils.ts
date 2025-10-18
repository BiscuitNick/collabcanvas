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
  if (currentPercentage < 100) return 2
  return 3
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
import type { TextContent, ImageContent } from '../types'
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

export function createImageContent(
  x: number,
  y: number,
  userId: string,
  options?: {
    src?: string
    width?: number
    height?: number
    alt?: string
    opacity?: number
    rotation?: number
  }
): Omit<ImageContent, 'id' | 'createdAt' | 'updatedAt'> {
  const defaults = DEFAULT_CONTENT_VALUES.image

  return {
    type: ContentType.IMAGE,
    version: ContentVersion.V2,
    x,
    y,
    src: options?.src ?? defaults.src,
    width: options?.width ?? defaults.width,
    height: options?.height ?? defaults.height,
    alt: options?.alt ?? defaults.alt,
    opacity: options?.opacity ?? 1,
    rotation: options?.rotation ?? 0,
    createdBy: userId,
    // createdAt and updatedAt will be added by Firestore with serverTimestamp()
  }
}

// Build a grid of rectangles matching AI model CanvasCommand output format
interface GridBuilderOptions {
  startX?: number
  startY?: number
  rows?: number
  cols?: number
  cellWidth?: number
  cellHeight?: number
  gap?: number
  colors?: string[] | 'random'
  stroke?: string
  strokeWidth?: number
}

interface CanvasCommand {
  action: 'create' | 'edit'
  type?: 'rectangle' | 'circle' | 'text'
  x?: number
  y?: number
  width?: number
  height?: number
  radius?: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  text?: string
  fontSize?: number
  fontFamily?: string
  fontStyle?: string
  shapeId?: string
  rotation?: number
}

export function buildGrid(options: GridBuilderOptions = {}): CanvasCommand[] {
  // Set reasonable defaults
  const startX = options.startX ?? 0
  const startY = options.startY ?? 0
  const rows = options.rows ?? 5
  const cols = options.cols ?? 5
  const cellWidth = options.cellWidth ?? 100
  const cellHeight = options.cellHeight ?? 100
  const gap = options.gap ?? 10
  const colors = options.colors ?? 'random'
  const stroke = options.stroke ?? '#000000'
  const strokeWidth = options.strokeWidth ?? 1

  // Color palette for non-random mode
  const defaultColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#FF9FF3', '#54A0FF', '#48DBFB', '#1DD1A1', '#FFA502'
  ]

  const colorArray = colors === 'random' ? null : (Array.isArray(colors) ? colors : defaultColors)

  // Helper to get color for a cell
  const getColor = (row: number, col: number): string => {
    if (colors === 'random') {
      // Generate random color for each cell
      return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`
    }
    if (colorArray && colorArray.length > 0) {
      if (colorArray.length === 1) {
        // Single color: use same color for all cells
        return colorArray[0]
      } else {
        // Multiple colors: use checkerboard pattern
        // (row + col) % 2 determines which color in the palette to use
        const paletteIndex = (row + col) % colorArray.length
        return colorArray[paletteIndex]
      }
    }
    return '#000000'
  }

  const commands: CanvasCommand[] = []

  // Generate grid cells
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = startX + col * (cellWidth + gap)
      const y = startY + row * (cellHeight + gap)

      commands.push({
        action: 'create',
        type: 'rectangle',
        x,
        y,
        width: cellWidth,
        height: cellHeight,
        fill: getColor(row, col),
        stroke,
        strokeWidth
      })
    }
  }

  return commands
}
