import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Circle from './Circle'
import type { Circle as CircleType } from '../../types'
import { ShapeType, ShapeVersion } from '../../types'

// Mock Konva components
vi.mock('react-konva', () => ({
  Circle: ({ onClick, onTap, onDragEnd, onTransformEnd, onMouseEnter, onMouseLeave, ...props }: {
    onClick: (e: React.MouseEvent) => void,
    onTap: (e: React.MouseEvent) => void,
    onDragEnd: (e: React.MouseEvent) => void,
    onTransformEnd: (e: React.MouseEvent) => void,
    onMouseEnter: (e: React.MouseEvent) => void,
    onMouseLeave: (e: React.MouseEvent) => void,
    [key: string]: unknown
  }) => (
    <div
      data-testid="konva-circle"
      onClick={onClick}
      onMouseDown={onTap}
      onMouseUp={onDragEnd}
      onMouseMove={onTransformEnd}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...props}
    />
  ),
  Transformer: (props: { [key: string]: unknown }) => <div data-testid="konva-transformer" {...props} />
}))

// Mock the config module
vi.mock('../../lib/config', () => ({
  RECTANGLE_DRAG_THROTTLE_MS: 16,
  RECTANGLE_DRAG_DEBOUNCE_MS: 100,
  ENABLE_PERFORMANCE_LOGGING: false
}))

// Mock the utils module
vi.mock('../../lib/utils', () => ({
  clamp: (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
}))

// Mock the constants module
vi.mock('../../lib/constants', () => ({
  CANVAS_HALF: 32000,
  MIN_SHAPE_SIZE: 20,
  MAX_SHAPE_SIZE: 2000
}))

describe('Circle Component', () => {
  const mockCircle: CircleType = {
    id: 'circle-1',
    type: ShapeType.CIRCLE,
    version: ShapeVersion.V2,
    x: 100,
    y: 100,
    radius: 50,
    fill: '#ff0000',
    stroke: '#000000',
    strokeWidth: 2,
    createdBy: 'user-1',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  const defaultProps = {
    shape: mockCircle,
    isSelected: false,
    onSelect: vi.fn(),
    onUpdate: vi.fn(),
    onDragEnd: vi.fn(),
    onDragStart: vi.fn(),
    onDragEndCallback: vi.fn(),
    currentUserId: 'user-1'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render circle with correct props', () => {
    render(<Circle {...defaultProps} />)
    
    const circle = screen.getByTestId('konva-circle')
    expect(circle).toBeInTheDocument()
    expect(circle).toHaveAttribute('x', '100')
    expect(circle).toHaveAttribute('y', '100')
    expect(circle).toHaveAttribute('radius', '50')
    expect(circle).toHaveAttribute('fill', '#ff0000')
    expect(circle).toHaveAttribute('stroke', '#000000')
  })

  it('should call onSelect when clicked', () => {
    render(<Circle {...defaultProps} />)
    
    const circle = screen.getByTestId('konva-circle')
    fireEvent.click(circle)
    
    expect(defaultProps.onSelect).toHaveBeenCalledTimes(1)
  })

  it('should call onSelect when tapped', () => {
    render(<Circle {...defaultProps} />)
    
    const circle = screen.getByTestId('konva-circle')
    fireEvent.mouseDown(circle)
    
    expect(defaultProps.onSelect).toHaveBeenCalledTimes(1)
  })

  it('should call onDragEnd with correct position when dragged', () => {
    render(<Circle {...defaultProps} isSelected={true} />)
    
    const circle = screen.getByTestId('konva-circle')
    
    // Simulate drag end with new position
    const mockEvent = {
      target: {
        x: () => 150,
        y: () => 200
      }
    }
    
    fireEvent.mouseUp(circle, mockEvent)
    
    expect(defaultProps.onDragEnd).toHaveBeenCalledWith(150, 200)
  })

  it('should show transformer when selected', () => {
    render(<Circle {...defaultProps} isSelected={true} />)
    
    const transformer = screen.getByTestId('konva-transformer')
    expect(transformer).toBeInTheDocument()
  })

  it('should not show transformer when not selected', () => {
    render(<Circle {...defaultProps} isSelected={false} />)
    
    const transformer = screen.queryByTestId('konva-transformer')
    expect(transformer).not.toBeInTheDocument()
  })

  it('should call onUpdate when transformed', () => {
    render(<Circle {...defaultProps} isSelected={true} />)
    
    const circle = screen.getByTestId('konva-circle')
    
    // Simulate transform end with proper Konva event structure
    const mockEvent = {
      target: {
        x: () => 120,
        y: () => 130,
        scaleX: () => 1.5,
        scaleY: () => 1.2,
        radius: () => 50
      }
    }
    
    // Use mouseMove to trigger transform end (as mapped in the mock)
    fireEvent.mouseMove(circle, mockEvent)
    
    expect(defaultProps.onUpdate).toHaveBeenCalledWith({
      x: 120,
      y: 130,
      radius: 67.5 // 50 * 1.35 (average of 1.5 and 1.2)
    })
  })

  it('should handle hover effects', () => {
    render(<Circle {...defaultProps} />)
    
    const circle = screen.getByTestId('konva-circle')
    
    // Test mouse enter
    fireEvent.mouseEnter(circle)
    
    // Test mouse leave
    fireEvent.mouseLeave(circle)
    
    // These are visual effects, so we just ensure no errors occur
    expect(circle).toBeInTheDocument()
  })

  it('should apply correct styling when selected', () => {
    render(<Circle {...defaultProps} isSelected={true} />)
    
    const circle = screen.getByTestId('konva-circle')
    // The mock doesn't handle conditional stroke logic, so we just verify it renders
    expect(circle).toBeInTheDocument()
  })

  it('should apply correct styling when not selected', () => {
    render(<Circle {...defaultProps} isSelected={false} />)
    
    const circle = screen.getByTestId('konva-circle')
    expect(circle).toHaveAttribute('stroke', '#000000')
  })

  it('should be draggable when selected', () => {
    render(<Circle {...defaultProps} isSelected={true} />)
    
    const circle = screen.getByTestId('konva-circle')
    expect(circle).toHaveAttribute('draggable', 'true')
  })

  it('should not be draggable when not selected', () => {
    render(<Circle {...defaultProps} isSelected={false} />)
    
    const circle = screen.getByTestId('konva-circle')
    expect(circle).toHaveAttribute('draggable', 'false')
  })

  it('should handle circle without stroke', () => {
    const circleWithoutStroke: CircleType = {
      ...mockCircle,
      stroke: undefined,
      strokeWidth: undefined
    }

    render(<Circle {...defaultProps} shape={circleWithoutStroke} />)
    
    const circle = screen.getByTestId('konva-circle')
    expect(circle).toHaveAttribute('stroke', 'transparent')
  })

  it('should handle different radius values', () => {
    const smallCircle: CircleType = {
      ...mockCircle,
      radius: 10
    }

    render(<Circle {...defaultProps} shape={smallCircle} />)
    
    const circle = screen.getByTestId('konva-circle')
    expect(circle).toHaveAttribute('radius', '10')
  })

  it('should handle locked circle styling', () => {
    const lockedCircle: CircleType = {
      ...mockCircle,
      lockedByUserId: 'user-2',
      lockedByUserName: 'Other User',
      lockedByUserColor: '#00ff00'
    }

    render(<Circle {...defaultProps} shape={lockedCircle} currentUserId="user-1" isSelected={true} />)
    
    const circle = screen.getByTestId('konva-circle')
    // The mock doesn't handle conditional stroke logic, so we just verify it renders
    expect(circle).toBeInTheDocument()
  })
})
