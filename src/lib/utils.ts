/**
 * Utility functions for the CollabCanvas application
 */

import { COLOR_PALETTE } from './constants'

/**
 * Generate a unique ID using crypto.randomUUID
 * Falls back to timestamp + random if crypto.randomUUID is not available
 */
export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Throttle function to limit how often a function can be called.
 * Useful for performance-critical events like mousemove or resize.
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(func: T, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null
  let lastExecTime = 0
  return (...args: Parameters<T>): void => {
    const currentTime = Date.now()
    
    if (currentTime - lastExecTime > delay) {
      func(...args)
      lastExecTime = currentTime
    } else {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func(...args)
        lastExecTime = Date.now()
      }, delay - (currentTime - lastExecTime))
    }
  }
}

/**
 * Get a random color from the predefined palette
 */
export const getRandomColor = (): string => {
  const randomIndex = Math.floor(Math.random() * COLOR_PALETTE.length)
  return COLOR_PALETTE[randomIndex]
}

/**
 * Get a deterministic color for a user based on their userId
 * This ensures the same user always gets the same color
 */
export const getUserColor = (userId: string): string => {
  // Simple hash function to convert userId to a number
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Use absolute value and modulo to get a valid index
  const index = Math.abs(hash) % COLOR_PALETTE.length
  return COLOR_PALETTE[index]
}

/**
 * Clamp a value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max)
}

/**
 * Calculate viewport center considering pan and zoom
 */
export const getViewportCenter = (
  stagePosition: { x: number; y: number },
  stageScale: number,
  viewportWidth: number,
  viewportHeight: number
): { x: number; y: number } => {
  // Calculate the center of the current viewport in world coordinates
  const centerX = (-stagePosition.x + viewportWidth / 2) / stageScale
  const centerY = (-stagePosition.y + viewportHeight / 2) / stageScale
  
  return { x: centerX, y: centerY }
}
