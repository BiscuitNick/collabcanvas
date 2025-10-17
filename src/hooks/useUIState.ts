import { useState, useCallback, useEffect } from 'react'

export interface UIState {
  propertiesPaneVisible: boolean
  propertiesPanePosition: 'left' | 'right'
  topBarVisible: boolean
  bottomToolbarVisible: boolean
  gridlinesVisible: boolean
  selectedShapeId: string | null
  selectedTool: 'select' | 'rectangle' | 'circle' | 'text' | 'ai' | null
  aiAgentOpen: boolean
  zoomLevel: number
}

const DEFAULT_UI_STATE: UIState = {
  propertiesPaneVisible: true,
  propertiesPanePosition: 'left',
  topBarVisible: true,
  bottomToolbarVisible: true,
  gridlinesVisible: false,
  selectedShapeId: null,
  selectedTool: 'select',
  aiAgentOpen: false,
  zoomLevel: 1
}

interface UseUIStateReturn {
  uiState: UIState
  updateUIState: (updates: Partial<UIState>) => void
  togglePropertiesPane: () => void
  togglePropertiesPanePosition: () => void
  toggleTopBar: () => void
  toggleBottomToolbar: () => void
  toggleGridlines: () => void
  selectShape: (shapeId: string | null) => void
  selectTool: (tool: 'select' | 'rectangle' | 'circle' | 'text' | 'ai' | null) => void
  toggleAIAgent: () => void
  setZoomLevel: (level: number) => void
  resetUIState: () => void
}

export const useUIState = (): UseUIStateReturn => {
  const [uiState, setUIState] = useState<UIState>(DEFAULT_UI_STATE)

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('collabcanvas-ui-state')
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState)
        setUIState(prev => ({ ...prev, ...parsedState }))
      } catch (error) {
        console.warn('Failed to parse saved UI state:', error)
      }
    }
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('collabcanvas-ui-state', JSON.stringify(uiState))
  }, [uiState])

  const updateUIState = useCallback((updates: Partial<UIState>) => {
    setUIState(prev => ({ ...prev, ...updates }))
  }, [])

  const togglePropertiesPane = useCallback(() => {
    setUIState(prev => ({ 
      ...prev, 
      propertiesPaneVisible: !prev.propertiesPaneVisible 
    }))
  }, [])

  const togglePropertiesPanePosition = useCallback(() => {
    setUIState(prev => ({ 
      ...prev, 
      propertiesPanePosition: prev.propertiesPanePosition === 'left' ? 'right' : 'left'
    }))
  }, [])

  const toggleTopBar = useCallback(() => {
    setUIState(prev => ({ 
      ...prev, 
      topBarVisible: !prev.topBarVisible 
    }))
  }, [])

  const toggleBottomToolbar = useCallback(() => {
    setUIState(prev => ({ 
      ...prev, 
      bottomToolbarVisible: !prev.bottomToolbarVisible 
    }))
  }, [])

  const toggleGridlines = useCallback(() => {
    setUIState(prev => ({ 
      ...prev, 
      gridlinesVisible: !prev.gridlinesVisible 
    }))
  }, [])

  const selectShape = useCallback((shapeId: string | null) => {
    setUIState(prev => ({ 
      ...prev, 
      selectedShapeId: shapeId 
    }))
  }, [])

  const selectTool = useCallback((tool: 'select' | 'rectangle' | 'circle' | 'text' | 'ai' | null) => {
    setUIState(prev => ({ 
      ...prev, 
      selectedTool: tool 
    }))
  }, [])

  const toggleAIAgent = useCallback(() => {
    setUIState(prev => ({ 
      ...prev, 
      aiAgentOpen: !prev.aiAgentOpen 
    }))
  }, [])

  const setZoomLevel = useCallback((level: number) => {
    setUIState(prev => ({ 
      ...prev, 
      zoomLevel: Math.max(0.1, Math.min(5, level)) // Clamp between 0.1x and 5x
    }))
  }, [])

  const resetUIState = useCallback(() => {
    setUIState(DEFAULT_UI_STATE)
  }, [])

  return {
    uiState,
    updateUIState,
    togglePropertiesPane,
    togglePropertiesPanePosition,
    toggleTopBar,
    toggleBottomToolbar,
    toggleGridlines,
    selectShape,
    selectTool,
    toggleAIAgent,
    setZoomLevel,
    resetUIState
  }
}
