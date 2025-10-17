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
