import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import FullScreenLayout from './FullScreenLayout'
import type { Rectangle, Cursor as CursorType } from '../../types'

// Mock the canvas store
vi.mock('../../store/canvasStore', () => ({
  useCanvasStore: () => ({
    stagePosition: { x: 0, y: 0 },
    stageScale: 1,
    updatePosition: vi.fn(),
    selectShape: vi.fn(),
    resetView: vi.fn()
  })
}))

// Mock the useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'test-user' },
    loading: false
  })
}))

// Mock the useShapes hook
vi.mock('../../hooks/useShapes', () => ({
  useShapes: () => ({
    createShape: vi.fn(),
    clearAllShapes: vi.fn()
  })
}))

// Mock the canvas component
const MockCanvas = ({ width, height, onShapeSelect }: { width: number; height: number; onShapeSelect: (id: string) => void }) => (
  <div data-testid="canvas" style={{ width, height }}>
    <button onClick={() => onShapeSelect?.('test-shape-1')}>Select Shape</button>
  </div>
)

const defaultProps = {
  shapes: [] as Rectangle[],
  cursors: [] as CursorType[],
  updateShape: vi.fn(),
  onMouseMove: vi.fn(),
  showSelfCursor: true,
  currentUserId: 'test-user',
  enableViewportCulling: false,
  onVisibleShapesChange: vi.fn(),
  lockShape: vi.fn(),
  unlockShape: vi.fn(),
  startEditingShape: vi.fn(),
  stopEditingShape: vi.fn(),
  presence: [],
}

describe('FullScreenLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with canvas component', () => {
    render(
      <FullScreenLayout {...defaultProps}>
        <MockCanvas />
      </FullScreenLayout>
    )

    expect(screen.getByTestId('canvas')).toBeInTheDocument()
  })

  it('toggles properties pane visibility', () => {
    render(
      <FullScreenLayout {...defaultProps}>
        <MockCanvas />
      </FullScreenLayout>
    )

    const closeButton = screen.getByTitle('Close Properties Panel')
    fireEvent.click(closeButton)

    const openButton = screen.getByTitle('Open Properties Panel')
    expect(openButton).toBeInTheDocument()
  })

  it('renders bottom toolbar with tool selection', () => {
    render(
      <FullScreenLayout {...defaultProps}>
        <MockCanvas />
      </FullScreenLayout>
    )

    // Find the dropdown trigger button (the one with mouse pointer icon)
    const dropdownButtons = screen.getAllByRole('button')
    const toolDropdownButton = dropdownButtons.find(btn =>
      btn.querySelector('.lucide-mouse-pointer-2') !== null
    )

    // Verify the toolbar with tool dropdown is present
    expect(toolDropdownButton).toBeInTheDocument()
  })

  it('calculates canvas size correctly', () => {
    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 1200,
      height: 800,
      top: 0,
      left: 0,
      bottom: 800,
      right: 1200,
      x: 0,
      y: 0,
      toJSON: vi.fn()
    }))

    render(
      <FullScreenLayout {...defaultProps}>
        <MockCanvas />
      </FullScreenLayout>
    )

    const canvas = screen.getByTestId('canvas')
    expect(canvas).toHaveStyle({ width: '1200px', height: '800px' })
  })
})
