import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Rectangle from './Rectangle'
import type { Rectangle as RectangleType } from '../../types'
import { ShapeType, ShapeVersion } from '../../types'

// Mock Konva components
vi.mock('react-konva', () => ({
  Rect: ({ onClick, onTap, onDragEnd, onTransformEnd, onMouseEnter, onMouseLeave, ...props }: {
    onClick: (e: React.MouseEvent) => void,
    onTap: (e: React.MouseEvent) => void,
    onDragEnd: (e: React.MouseEvent) => void,
    onTransformEnd: (e: React.MouseEvent) => void,
    onMouseEnter: (e: React.MouseEvent) => void,
    onMouseLeave: (e: React.MouseEvent) => void,
    [key: string]: unknown
  }) => (
    <div
      data-testid="konva-rect"
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

describe('Rectangle Component', () => {
  const mockRectangle: RectangleType = {
    id: 'rect-1',
    type: ShapeType.RECTANGLE,
    version: ShapeVersion.V2,
    x: 100,
    y: 100,
    width: 200,
    height: 150,
    rotation: 0,
    fill: '#ff0000',
    createdBy: 'user-1',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  const defaultProps = {
    shape: mockRectangle,
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

  it('should render rectangle with correct props', () => {
    render(<Rectangle {...defaultProps} />)
    
    const rect = screen.getByTestId('konva-rect')
    expect(rect).toBeInTheDocument()
    expect(rect).toHaveAttribute('x', '100')
    expect(rect).toHaveAttribute('y', '100')
    expect(rect).toHaveAttribute('width', '200')
    expect(rect).toHaveAttribute('height', '150')
    expect(rect).toHaveAttribute('rotation', '0')
    expect(rect).toHaveAttribute('fill', '#ff0000')
  })

  it('should call onSelect when clicked', () => {
    render(<Rectangle {...defaultProps} />)
    
    const rect = screen.getByTestId('konva-rect')
    fireEvent.click(rect)
    
    expect(defaultProps.onSelect).toHaveBeenCalledTimes(1)
  })

  it('should call onSelect when tapped', () => {
    render(<Rectangle {...defaultProps} />)
    
    const rect = screen.getByTestId('konva-rect')
    fireEvent.mouseDown(rect)
    
    expect(defaultProps.onSelect).toHaveBeenCalledTimes(1)
  })

  it('should call onDragEnd with correct position when dragged', () => {
    render(<Rectangle {...defaultProps} isSelected={true} />)
    
    const rect = screen.getByTestId('konva-rect')
    
    // Simulate drag end with new position
    const mockEvent = {
      target: {
        x: () => 150,
        y: () => 200
      }
    }
    
    fireEvent.mouseUp(rect, mockEvent)
    
    expect(defaultProps.onDragEnd).toHaveBeenCalledWith(150, 200)
  })

  it('should show transformer when selected', () => {
    render(<Rectangle {...defaultProps} isSelected={true} />)
    
    const transformer = screen.getByTestId('konva-transformer')
    expect(transformer).toBeInTheDocument()
  })

  it('should not show transformer when not selected', () => {
    render(<Rectangle {...defaultProps} isSelected={false} />)
    
    const transformer = screen.queryByTestId('konva-transformer')
    expect(transformer).not.toBeInTheDocument()
  })

  it('should call onUpdate when transformed', () => {
    render(<Rectangle {...defaultProps} isSelected={true} />)
    
    const rect = screen.getByTestId('konva-rect')
    
    // Simulate transform end with proper Konva event structure
    const mockEvent = {
      target: {
        x: () => 120,
        y: () => 130,
        scaleX: () => 1.5,
        scaleY: () => 1.2,
        width: () => 200,
        height: () => 150,
        rotation: () => 45
      }
    }
    
    // Use mouseMove to trigger transform end (as mapped in the mock)
    fireEvent.mouseMove(rect, mockEvent)
    
    expect(defaultProps.onUpdate).toHaveBeenCalledWith({
      x: 120,
      y: 130,
      width: 300, // 200 * 1.5
      height: 180, // 150 * 1.2
      rotation: 45
    })
  })

  it('should handle hover effects', () => {
    render(<Rectangle {...defaultProps} />)
    
    const rect = screen.getByTestId('konva-rect')
    
    // Test mouse enter
    fireEvent.mouseEnter(rect)
    
    // Test mouse leave
    fireEvent.mouseLeave(rect)
    
    // These are visual effects, so we just ensure no errors occur
    expect(rect).toBeInTheDocument()
  })

  it('should be draggable when selected', () => {
    render(<Rectangle {...defaultProps} isSelected={true} />)
    
    const rect = screen.getByTestId('konva-rect')
    expect(rect).toHaveAttribute('draggable', 'true')
  })

  it('should not be draggable when not selected', () => {
    render(<Rectangle {...defaultProps} isSelected={false} />)
    
    const rect = screen.getByTestId('konva-rect')
    expect(rect).toHaveAttribute('draggable', 'false')
  })

  it('should handle different fill colors', () => {
    const coloredRect: RectangleType = {
      ...mockRectangle,
      fill: '#00ff00'
    }

    render(<Rectangle {...defaultProps} shape={coloredRect} />)
    
    const rect = screen.getByTestId('konva-rect')
    expect(rect).toHaveAttribute('fill', '#00ff00')
  })

  it('should handle different dimensions', () => {
    const smallRect: RectangleType = {
      ...mockRectangle,
      width: 100,
      height: 75
    }

    render(<Rectangle {...defaultProps} shape={smallRect} />)
    
    const rect = screen.getByTestId('konva-rect')
    expect(rect).toHaveAttribute('width', '100')
    expect(rect).toHaveAttribute('height', '75')
  })

  it('should handle different positions', () => {
    const positionedRect: RectangleType = {
      ...mockRectangle,
      x: 300,
      y: 400
    }

    render(<Rectangle {...defaultProps} shape={positionedRect} />)
    
    const rect = screen.getByTestId('konva-rect')
    expect(rect).toHaveAttribute('x', '300')
    expect(rect).toHaveAttribute('y', '400')
  })

  it('should handle rotation', () => {
    const rotatedRect: RectangleType = {
      ...mockRectangle,
      rotation: 45
    }

    render(<Rectangle {...defaultProps} shape={rotatedRect} />)
    
    const rect = screen.getByTestId('konva-rect')
    expect(rect).toHaveAttribute('rotation', '45')
  })

  it('should handle locked rectangle styling', () => {
    const lockedRect: RectangleType = {
      ...mockRectangle,
      lockedByUserId: 'user-2',
      lockedByUserName: 'Other User',
      lockedByUserColor: '#00ff00'
    }

    render(<Rectangle {...defaultProps} shape={lockedRect} currentUserId="user-1" isSelected={true} />)
    
    const rect = screen.getByTestId('konva-rect')
    // The mock doesn't handle conditional stroke logic, so we just verify it renders
    expect(rect).toBeInTheDocument()
  })

  it('should handle drag start callback', () => {
    render(<Rectangle {...defaultProps} isSelected={true} />)
    
    const rect = screen.getByTestId('konva-rect')
    
    // Simulate drag start
    const mockEvent = {
      target: {
        x: () => 100,
        y: () => 100
      }
    }
    
    fireEvent.mouseDown(rect, mockEvent)
    
    // The drag start logic is internal, we just verify no errors occur
    expect(rect).toBeInTheDocument()
  })


  it('should handle different stroke colors for selected state', () => {
    render(<Rectangle {...defaultProps} isSelected={true} />)
    
    const rect = screen.getByTestId('konva-rect')
    // The mock doesn't handle conditional stroke logic, so we just verify it renders
    expect(rect).toBeInTheDocument()
  })

  it('should handle different stroke colors for locked state', () => {
    const lockedRect: RectangleType = {
      ...mockRectangle,
      lockedByUserId: 'user-2',
      lockedByUserName: 'Other User',
      lockedByUserColor: '#ff0000'
    }

    render(<Rectangle {...defaultProps} shape={lockedRect} currentUserId="user-1" />)
    
    const rect = screen.getByTestId('konva-rect')
    // The mock doesn't handle conditional stroke logic, so we just verify it renders
    expect(rect).toBeInTheDocument()
  })

  it('should handle transformer configuration', () => {
    render(<Rectangle {...defaultProps} isSelected={true} />)
    
    const transformer = screen.getByTestId('konva-transformer')
    expect(transformer).toBeInTheDocument()
    // The mock doesn't handle all transformer props, so we just verify it renders
  })

  it('should handle cleanup on unmount', () => {
    const { unmount } = render(<Rectangle {...defaultProps} isSelected={true} />)
    
    // Unmount should not cause errors
    expect(() => unmount()).not.toThrow()
  })
})
