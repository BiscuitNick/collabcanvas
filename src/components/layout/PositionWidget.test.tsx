import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import PositionWidget from './PositionWidget'

// Mock the canvas store
const mockUpdatePosition = vi.fn()
const mockUpdateScale = vi.fn()

vi.mock('../../store/canvasStore', () => ({
  useCanvasStore: vi.fn(() => ({
    stagePosition: { x: 0, y: 0 },
    stageScale: 1,
    updatePosition: mockUpdatePosition,
    updateScale: mockUpdateScale
  }))
}))

// Mock window dimensions
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1920,
})

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 1080,
})

describe('PositionWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders position controls correctly', () => {
    render(<PositionWidget />)

    expect(screen.getByTitle('Reset to Origin')).toBeInTheDocument()
    // Check for input fields by their placeholders and types
    const inputs = screen.getAllByRole('spinbutton')
    expect(inputs.length).toBe(2)
  })

  it('displays current viewport center coordinates', () => {
    render(<PositionWidget />)
    
    // With stage position (0,0) and scale 1, viewport center should be (960, -540)
    // (half of 1920x1080, with Y flipped for proper math coordinates)
    expect(screen.getByDisplayValue('960')).toBeInTheDocument()
    expect(screen.getByDisplayValue('-540')).toBeInTheDocument()
  })

  it('calls updatePosition when reset button is clicked', () => {
    render(<PositionWidget />)
    
    const resetButton = screen.getByTitle('Reset to Origin')
    fireEvent.click(resetButton)
    
    expect(mockUpdatePosition).toHaveBeenCalledWith(960, 540)
  })

  it('updates position when X input is changed and blurred', () => {
    render(<PositionWidget />)

    const inputs = screen.getAllByRole('spinbutton')
    const xInput = inputs[0] // First input is X
    fireEvent.change(xInput, { target: { value: '100' } })
    fireEvent.blur(xInput)

    expect(mockUpdatePosition).toHaveBeenCalled()
  })

  it('updates position when Y input is changed and blurred', () => {
    render(<PositionWidget />)

    const inputs = screen.getAllByRole('spinbutton')
    const yInput = inputs[1] // Second input is Y
    fireEvent.change(yInput, { target: { value: '200' } })
    fireEvent.blur(yInput)

    expect(mockUpdatePosition).toHaveBeenCalled()
  })

  it('handles Enter key press', () => {
    render(<PositionWidget />)

    const inputs = screen.getAllByRole('spinbutton')
    const xInput = inputs[0]
    fireEvent.change(xInput, { target: { value: '500' } })
    fireEvent.keyPress(xInput, { key: 'Enter' })

    // The component should handle the Enter key without errors
    expect(xInput).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<PositionWidget className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
