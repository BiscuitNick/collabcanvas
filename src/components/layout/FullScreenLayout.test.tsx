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
    selectShape: vi.fn()
  })
}))

// Mock the canvas component
const MockCanvas = ({ width, height, onShapeSelect }: any) => (
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
  stopEditingShape: vi.fn()
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

    const toggleButton = screen.getByText('Hide Properties')
    fireEvent.click(toggleButton)

    expect(screen.getByText('Show Properties')).toBeInTheDocument()
  })

  it('toggles gridlines visibility', () => {
    render(
      <FullScreenLayout {...defaultProps}>
        <MockCanvas />
      </FullScreenLayout>
    )

    const gridlinesButton = screen.getByText('Gridlines')
    fireEvent.click(gridlinesButton)

    expect(gridlinesButton).toHaveClass('bg-blue-100')
  })

  it('shows shape properties when shape is selected', () => {
    render(
      <FullScreenLayout {...defaultProps}>
        <MockCanvas />
      </FullScreenLayout>
    )

    // Properties pane is already visible by default

    // Select a shape
    const selectButton = screen.getByText('Select Shape')
    fireEvent.click(selectButton)

    expect(screen.getByText('Selected Shape: test-shape-1')).toBeInTheDocument()
  })

  it('renders bottom toolbar with shape creation buttons', () => {
    render(
      <FullScreenLayout {...defaultProps}>
        <MockCanvas />
      </FullScreenLayout>
    )

    expect(screen.getByText('Rectangle')).toBeInTheDocument()
    expect(screen.getByText('Circle')).toBeInTheDocument()
    expect(screen.getByText('Text')).toBeInTheDocument()
    expect(screen.getByText('AI Agent')).toBeInTheDocument()
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
    expect(canvas).toHaveStyle({ width: '680px', height: '680px' })
  })
})
