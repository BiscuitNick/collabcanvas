import { renderHook, act } from '@testing-library/react'
import { useUIState } from './useUIState'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('useUIState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => useUIState())

    expect(result.current.uiState).toEqual({
      propertiesPaneVisible: true,
      propertiesPanePosition: 'left',
      topBarVisible: true,
      bottomToolbarVisible: true,
      gridlinesVisible: false,
      selectedShapeId: null,
      selectedTool: 'select',
      aiAgentOpen: false,
      zoomLevel: 1
    })
  })

  it('loads state from localStorage on mount', () => {
    const savedState = {
      propertiesPaneVisible: false,
      gridlinesVisible: true,
      zoomLevel: 1.5
    }
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState))

    const { result } = renderHook(() => useUIState())

    expect(result.current.uiState.propertiesPaneVisible).toBe(false)
    expect(result.current.uiState.gridlinesVisible).toBe(true)
    expect(result.current.uiState.zoomLevel).toBe(1.5)
  })

  it('toggles properties pane', () => {
    const { result } = renderHook(() => useUIState())

    act(() => {
      result.current.togglePropertiesPane()
    })

    expect(result.current.uiState.propertiesPaneVisible).toBe(false)

    act(() => {
      result.current.togglePropertiesPane()
    })

    expect(result.current.uiState.propertiesPaneVisible).toBe(true)
  })

  it('toggles properties pane position', () => {
    const { result } = renderHook(() => useUIState())

    act(() => {
      result.current.togglePropertiesPanePosition()
    })

    expect(result.current.uiState.propertiesPanePosition).toBe('right')

    act(() => {
      result.current.togglePropertiesPanePosition()
    })

    expect(result.current.uiState.propertiesPanePosition).toBe('left')
  })

  it('selects shapes', () => {
    const { result } = renderHook(() => useUIState())

    act(() => {
      result.current.selectShape('shape-123')
    })

    expect(result.current.uiState.selectedShapeId).toBe('shape-123')

    act(() => {
      result.current.selectShape(null)
    })

    expect(result.current.uiState.selectedShapeId).toBe(null)
  })

  it('selects tools', () => {
    const { result } = renderHook(() => useUIState())

    act(() => {
      result.current.selectTool('rectangle')
    })

    expect(result.current.uiState.selectedTool).toBe('rectangle')

    act(() => {
      result.current.selectTool('circle')
    })

    expect(result.current.uiState.selectedTool).toBe('circle')
  })

  it('sets zoom level with clamping', () => {
    const { result } = renderHook(() => useUIState())

    act(() => {
      result.current.setZoomLevel(10) // Above max
    })

    expect(result.current.uiState.zoomLevel).toBe(5)

    act(() => {
      result.current.setZoomLevel(0.05) // Below min
    })

    expect(result.current.uiState.zoomLevel).toBe(0.1)

    act(() => {
      result.current.setZoomLevel(2.5) // Valid range
    })

    expect(result.current.uiState.zoomLevel).toBe(2.5)
  })

  it('resets UI state', () => {
    const { result } = renderHook(() => useUIState())

    // Modify state
    act(() => {
      result.current.togglePropertiesPane()
      result.current.selectShape('test-shape')
      result.current.setZoomLevel(2)
    })

    // Reset
    act(() => {
      result.current.resetUIState()
    })

    expect(result.current.uiState).toEqual({
      propertiesPaneVisible: true,
      propertiesPanePosition: 'left',
      topBarVisible: true,
      bottomToolbarVisible: true,
      gridlinesVisible: false,
      selectedShapeId: null,
      selectedTool: 'select',
      aiAgentOpen: false,
      zoomLevel: 1
    })
  })

  it('saves state to localStorage on changes', () => {
    const { result } = renderHook(() => useUIState())

    act(() => {
      result.current.togglePropertiesPane()
    })

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'collabcanvas-ui-state',
      expect.stringContaining('"propertiesPaneVisible":false')
    )
  })
})
