/**
 * Utility functions for the CollabCanvas application
 */

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
 * Predefined color palette for rectangles
 */
const COLOR_PALETTE = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Lavender
  '#85C1E9', // Sky Blue
  '#F8C471', // Orange
  '#82E0AA', // Light Green
]

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
