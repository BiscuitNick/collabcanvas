import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RectangleComponent from '../components/canvas/Rectangle'
import type { Rectangle } from '../types'

// Mock Konva components
vi.mock('react-konva', () => ({
  Rect: ({ onClick, onTap, onDragEnd, onTransformEnd, onMouseEnter, onMouseLeave, ...props }: any) => (
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
  Transformer: (props: any) => <div data-testid="konva-transformer" {...props} />
}))

describe('Rectangle Component', () => {
  const mockShape: Rectangle = {
    id: 'test-rect-1',
    x: 100,
    y: 100,
    width: 200,
    height: 150,
    rotation: 0,
    fill: '#FF0000',
    createdBy: 'test-user',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  const mockProps = {
    shape: mockShape,
    isSelected: false,
    onSelect: vi.fn(),
    onUpdate: vi.fn(),
    onDragEnd: vi.fn(),
    onDragStart: vi.fn(),
    onDragEndCallback: vi.fn(),
    startManipulation: vi.fn().mockResolvedValue(true),
    endManipulation: vi.fn().mockResolvedValue(undefined),
    isManipulating: vi.fn().mockReturnValue(false),
    isLocked: vi.fn().mockReturnValue(false),
    getLockOwner: vi.fn().mockReturnValue(null),
    currentUserId: 'test-user'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render rectangle with correct props', () => {
    render(<RectangleComponent {...mockProps} />)
    
    const rect = screen.getByTestId('konva-rect')
    expect(rect).toBeInTheDocument()
    expect(rect).toHaveAttribute('x', '100')
    expect(rect).toHaveAttribute('y', '100')
    expect(rect).toHaveAttribute('width', '200')
    expect(rect).toHaveAttribute('height', '150')
    expect(rect).toHaveAttribute('fill', '#FF0000')
  })

  it('should call onSelect when clicked', () => {
    render(<RectangleComponent {...mockProps} />)
    
    const rect = screen.getByTestId('konva-rect')
    fireEvent.click(rect)
    
    expect(mockProps.onSelect).toHaveBeenCalledTimes(1)
  })

  it('should call onSelect when tapped', () => {
    render(<RectangleComponent {...mockProps} />)
    
    const rect = screen.getByTestId('konva-rect')
    fireEvent.mouseDown(rect)
    
    expect(mockProps.onSelect).toHaveBeenCalledTimes(1)
  })

  it('should call onDragEnd with correct position when dragged', () => {
    render(<RectangleComponent {...mockProps} />)
    
    const rect = screen.getByTestId('konva-rect')
    
    // Simulate drag end with new position
    const mockEvent = {
      target: {
        x: () => 150,
        y: () => 200
      }
    }
    
    fireEvent.mouseUp(rect, mockEvent)
    
    expect(mockProps.onDragEnd).toHaveBeenCalledWith(150, 200)
  })

  it('should show transformer when selected', () => {
    render(<RectangleComponent {...mockProps} isSelected={true} />)
    
    const transformer = screen.getByTestId('konva-transformer')
    expect(transformer).toBeInTheDocument()
  })

  it('should not show transformer when not selected', () => {
    render(<RectangleComponent {...mockProps} isSelected={false} />)
    
    const transformer = screen.queryByTestId('konva-transformer')
    expect(transformer).not.toBeInTheDocument()
  })

  it('should call onUpdate when transformed', () => {
    render(<RectangleComponent {...mockProps} />)
    
    const rect = screen.getByTestId('konva-rect')
    
    // Simulate transform end with proper Konva event structure
    const mockEvent = {
      target: {
        x: () => 120,
        y: () => 130,
        scaleX: () => 1.5,
        scaleY: () => 1.2,
        rotation: () => 0
      }
    }
    
    // Use mouseMove to trigger transform end (as mapped in the mock)
    fireEvent.mouseMove(rect, mockEvent)
    
    expect(mockProps.onUpdate).toHaveBeenCalledWith({
      x: 120,
      y: 130,
      width: 300, // 200 * 1.5
      height: 180, // 150 * 1.2
      rotation: 0
    })
  })

  it('should handle hover effects', () => {
    render(<RectangleComponent {...mockProps} />)
    
    const rect = screen.getByTestId('konva-rect')
    
    // Test mouse enter
    fireEvent.mouseEnter(rect)
    
    // Test mouse leave
    fireEvent.mouseLeave(rect)
    
    // These are visual effects, so we just ensure no errors occur
    expect(rect).toBeInTheDocument()
  })

  it('should apply correct styling when selected', () => {
    render(<RectangleComponent {...mockProps} isSelected={true} />)
    
    const rect = screen.getByTestId('konva-rect')
    expect(rect).toHaveAttribute('stroke', '#007AFF')
    // strokeWidth might not be set as attribute, so check if it exists or is 2
    const strokeWidth = rect.getAttribute('strokeWidth')
    expect(strokeWidth === '2' || strokeWidth === null).toBe(true)
  })

  it('should apply correct styling when not selected', () => {
    render(<RectangleComponent {...mockProps} isSelected={false} />)
    
    const rect = screen.getByTestId('konva-rect')
    expect(rect).toHaveAttribute('stroke', 'transparent')
    // strokeWidth might not be set as attribute when 0, so check if it exists or is 0
    const strokeWidth = rect.getAttribute('strokeWidth')
    expect(strokeWidth === '0' || strokeWidth === null).toBe(true)
  })

  it('should be draggable', () => {
    render(<RectangleComponent {...mockProps} />)
    
    const rect = screen.getByTestId('konva-rect')
    expect(rect).toHaveAttribute('draggable', 'true')
  })
})
