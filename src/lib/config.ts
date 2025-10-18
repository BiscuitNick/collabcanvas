/**
 * Application configuration with environment variable support
 * Allows easy testing of different performance settings in production
 */

// Cursor throttling configuration
export const CURSOR_THROTTLE_MS = parseInt(import.meta.env.VITE_CURSOR_THROTTLE_MS || '16', 10)
export const CURSOR_DEBOUNCE_MS = parseInt(import.meta.env.VITE_CURSOR_DEBOUNCE_MS || '16', 10)

// Rectangle drag throttling configuration
export const RECTANGLE_DRAG_THROTTLE_MS = parseInt(import.meta.env.VITE_RECTANGLE_DRAG_THROTTLE_MS || '50', 10)
export const RECTANGLE_DRAG_DEBOUNCE_MS = parseInt(import.meta.env.VITE_RECTANGLE_DRAG_DEBOUNCE_MS || '100', 10)

// Shape update retry configuration
export const SHAPE_RETRY_DELAY_MS = parseInt(import.meta.env.VITE_SHAPE_RETRY_DELAY_MS || '1000', 10)
export const SHAPE_MAX_RETRIES = parseInt(import.meta.env.VITE_SHAPE_MAX_RETRIES || '3', 10)

// Presence update configuration
export const PRESENCE_UPDATE_INTERVAL_MS = parseInt(import.meta.env.VITE_PRESENCE_UPDATE_INTERVAL_MS || '30000', 10)
export const PRESENCE_CLEANUP_INTERVAL_MS = parseInt(import.meta.env.VITE_PRESENCE_CLEANUP_INTERVAL_MS || '300000', 10)

// Shape locking configuration
export const LOCK_TTL_MS = parseInt(import.meta.env.VITE_LOCK_TTL_MS || '30000', 10)
export const LOCK_INDICATOR_STROKE_WIDTH = parseInt(import.meta.env.VITE_LOCK_INDICATOR_STROKE_WIDTH || '4', 10)

// Performance monitoring
export const ENABLE_PERFORMANCE_LOGGING = import.meta.env.VITE_ENABLE_PERFORMANCE_LOGGING === 'true'

// Canvas identifier (single shared canvas for now)
// Persisted via env with safe default
export const CANVAS_ID = (import.meta.env.VITE_CANVAS_ID || 'default-canvas').toString()

// Validate configuration values
if (CURSOR_THROTTLE_MS < 1 || CURSOR_THROTTLE_MS > 1000) {
  console.warn(`Invalid CURSOR_THROTTLE_MS: ${CURSOR_THROTTLE_MS}. Using default 16ms.`)
}

if (CURSOR_DEBOUNCE_MS < 1 || CURSOR_DEBOUNCE_MS > 1000) {
  console.warn(`Invalid CURSOR_DEBOUNCE_MS: ${CURSOR_DEBOUNCE_MS}. Using default 16ms.`)
}

if (RECTANGLE_DRAG_THROTTLE_MS < 1 || RECTANGLE_DRAG_THROTTLE_MS > 1000) {
  console.warn(`Invalid RECTANGLE_DRAG_THROTTLE_MS: ${RECTANGLE_DRAG_THROTTLE_MS}. Using default 50ms.`)
}

if (RECTANGLE_DRAG_DEBOUNCE_MS < 1 || RECTANGLE_DRAG_DEBOUNCE_MS > 1000) {
  console.warn(`Invalid RECTANGLE_DRAG_DEBOUNCE_MS: ${RECTANGLE_DRAG_DEBOUNCE_MS}. Using default 100ms.`)
}

if (SHAPE_RETRY_DELAY_MS < 100 || SHAPE_RETRY_DELAY_MS > 10000) {
  console.warn(`Invalid SHAPE_RETRY_DELAY_MS: ${SHAPE_RETRY_DELAY_MS}. Using default 1000ms.`)
}

if (PRESENCE_UPDATE_INTERVAL_MS < 5000 || PRESENCE_UPDATE_INTERVAL_MS > 300000) {
  console.warn(`Invalid PRESENCE_UPDATE_INTERVAL_MS: ${PRESENCE_UPDATE_INTERVAL_MS}. Using default 30000ms.`)
}

if (PRESENCE_CLEANUP_INTERVAL_MS < 60000 || PRESENCE_CLEANUP_INTERVAL_MS > 1800000) {
  console.warn(`Invalid PRESENCE_CLEANUP_INTERVAL_MS: ${PRESENCE_CLEANUP_INTERVAL_MS}. Using default 300000ms.`)
}

// Log configuration in development
if (import.meta.env.DEV) {
  console.log('🔧 Performance Configuration:', {
    cursorThrottle: `${CURSOR_THROTTLE_MS}ms`,
    cursorDebounce: `${CURSOR_DEBOUNCE_MS}ms`,
    rectangleDragThrottle: `${RECTANGLE_DRAG_THROTTLE_MS}ms`,
    rectangleDragDebounce: `${RECTANGLE_DRAG_DEBOUNCE_MS}ms`,
    shapeRetryDelay: `${SHAPE_RETRY_DELAY_MS}ms`,
    shapeMaxRetries: SHAPE_MAX_RETRIES,
    presenceUpdateInterval: `${PRESENCE_UPDATE_INTERVAL_MS}ms`,
    presenceCleanupInterval: `${PRESENCE_CLEANUP_INTERVAL_MS}ms`,
    performanceLogging: ENABLE_PERFORMANCE_LOGGING
  })
  console.log('🖼️ Canvas Configuration:', {
    canvasId: CANVAS_ID
  })
}
