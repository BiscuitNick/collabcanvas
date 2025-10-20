import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

interface CanvasContextType {
  canvasId: string
  canEdit: boolean
}

const CanvasContext = createContext<CanvasContextType | null>(null)

interface CanvasProviderProps {
  canvasId: string
  canEdit?: boolean
  children: ReactNode
}

export function CanvasProvider({ canvasId, canEdit = true, children }: CanvasProviderProps) {
  return (
    <CanvasContext.Provider value={{ canvasId, canEdit }}>
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

export function useCanEdit(): boolean {
  const context = useContext(CanvasContext)
  // Default to true for backward compatibility
  return context?.canEdit ?? true
}
