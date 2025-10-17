import { useEffect } from 'react'
import { useCanvasStore } from '../store/canvasStore'

export const useKeyboardShortcuts = () => {
  const { updateScale, resetView } = useCanvasStore()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '=': // Zoom In
          case '+':
            event.preventDefault()
            updateScale(useCanvasStore.getState().stageScale + 0.1)
            break
          case '-': // Zoom Out
            event.preventDefault()
            updateScale(useCanvasStore.getState().stageScale - 0.1)
            break
          case '0': // Reset View
            event.preventDefault()
            resetView()
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [updateScale, resetView])
}
