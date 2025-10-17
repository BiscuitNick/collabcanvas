import { useEffect } from 'react'

export type CursorContext = 
  | 'default'
  | 'grab'
  | 'grabbing' 
  | 'pointer'
  | 'text'
  | 'crosshair'
  | 'move'
  | 'resize'
  | 'not-allowed'

interface UseCursorContextProps {
  selectedTool: 'select' | 'rectangle' | 'circle' | 'text' | 'ai' | 'pan' | null
  isDragging?: boolean
  isPanning?: boolean
  isResizing?: boolean
}

export const useCursorContext = ({
  selectedTool,
  isDragging = false,
  isPanning = false,
  isResizing = false
}: UseCursorContextProps) => {
  useEffect(() => {
    const body = document.body
    let cursor: CursorContext = 'default'

    // Determine cursor based on tool and interaction state
    if (isResizing) {
      cursor = 'resize'
    } else if (isDragging) {
      cursor = 'grabbing'
    } else if (isPanning) {
      cursor = 'grabbing'
    } else {
      switch (selectedTool) {
        case 'pan':
          cursor = 'grab'
          break
        case 'select':
          cursor = 'pointer'
          break
        case 'text':
          cursor = 'text'
          break
        case 'rectangle':
        case 'circle':
          cursor = 'crosshair'
          break
        case 'ai':
          cursor = 'pointer'
          break
        default:
          cursor = 'default'
      }
    }

    // Apply cursor to body
    body.style.cursor = cursor

    // Cleanup on unmount
    return () => {
      body.style.cursor = 'default'
    }
  }, [selectedTool, isDragging, isPanning, isResizing])
}