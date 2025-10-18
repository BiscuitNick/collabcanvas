import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

interface CanvasContextType {
  canvasId: string
}

const CanvasContext = createContext<CanvasContextType | null>(null)

interface CanvasProviderProps {
  canvasId: string
  children: ReactNode
}

export function CanvasProvider({ canvasId, children }: CanvasProviderProps) {
  return (
    <CanvasContext.Provider value={{ canvasId }}>
      {children}
    </CanvasContext.Provider>
  )
}

export function useCanvasId(): string {
  const context = useContext(CanvasContext)
  if (!context) {
    // Fallback to env variable for backward compatibility
    const envCanvasId = (import.meta.env.VITE_CANVAS_ID || 'default-canvas').toString()
    return envCanvasId
  }
  return context.canvasId
}
