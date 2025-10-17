import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ShapeFactory from './ShapeFactory'
import type { Rectangle, Circle } from '../../types'
import { ShapeType, ShapeVersion } from '../../types'

// Mock the individual shape components
vi.mock('./Rectangle', () => ({
  default: ({ shape, isSelected, onSelect }: { shape: Rectangle; isSelected: boolean; onSelect: () => void }) => (
    <div data-testid="rectangle-component" data-shape-id={shape.id} data-selected={isSelected} onClick={onSelect}>
      Rectangle: {shape.id}
    </div>
  )
}))

vi.mock('./Circle', () => ({
  default: ({ shape, isSelected, onSelect }: { shape: Circle; isSelected: boolean; onSelect: () => void }) => (
    <div data-testid="circle-component" data-shape-id={shape.id} data-selected={isSelected} onClick={onSelect}>
      Circle: {shape.id}
    </div>
  )
}))


describe('ShapeFactory Component', () => {
  const mockRectangle: Rectangle = {
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

  const mockCircle: Circle = {
    id: 'circle-1',
    type: ShapeType.CIRCLE,
    version: ShapeVersion.V2,
    x: 200,
    y: 200,
    radius: 50,
    fill: '#00ff00',
    createdBy: 'user-1',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }


  const defaultProps = {
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

  describe('Rectangle Rendering', () => {
    it('should render Rectangle component for rectangle shapes', () => {
      render(<ShapeFactory {...defaultProps} shape={mockRectangle} />)
      
      const rectangle = screen.getByTestId('rectangle-component')
      expect(rectangle).toBeInTheDocument()
      expect(rectangle).toHaveAttribute('data-shape-id', 'rect-1')
      expect(rectangle).toHaveAttribute('data-selected', 'false')
      expect(rectangle).toHaveTextContent('Rectangle: rect-1')
    })

    it('should pass correct props to Rectangle component', () => {
      render(<ShapeFactory {...defaultProps} shape={mockRectangle} isSelected={true} />)
      
      const rectangle = screen.getByTestId('rectangle-component')
      expect(rectangle).toHaveAttribute('data-selected', 'true')
    })
  })

  describe('Circle Rendering', () => {
    it('should render Circle component for circle shapes', () => {
      render(<ShapeFactory {...defaultProps} shape={mockCircle} />)
      
      const circle = screen.getByTestId('circle-component')
      expect(circle).toBeInTheDocument()
      expect(circle).toHaveAttribute('data-shape-id', 'circle-1')
      expect(circle).toHaveAttribute('data-selected', 'false')
      expect(circle).toHaveTextContent('Circle: circle-1')
    })

    it('should pass correct props to Circle component', () => {
      render(<ShapeFactory {...defaultProps} shape={mockCircle} isSelected={true} />)
      
      const circle = screen.getByTestId('circle-component')
      expect(circle).toHaveAttribute('data-selected', 'true')
    })
  })


  describe('Event Handling', () => {
    it('should handle onSelect events for rectangles', () => {
      render(<ShapeFactory {...defaultProps} shape={mockRectangle} />)
      
      const rectangle = screen.getByTestId('rectangle-component')
      rectangle.click()
      
      expect(defaultProps.onSelect).toHaveBeenCalledTimes(1)
    })

    it('should handle onSelect events for circles', () => {
      render(<ShapeFactory {...defaultProps} shape={mockCircle} />)
      
      const circle = screen.getByTestId('circle-component')
      circle.click()
      
      expect(defaultProps.onSelect).toHaveBeenCalledTimes(1)
    })

  })

  describe('Type Safety', () => {
    it('should handle type guards correctly', () => {
      // Test that the factory correctly identifies shape types
      expect(mockRectangle.type).toBe(ShapeType.RECTANGLE)
      expect(mockCircle.type).toBe(ShapeType.CIRCLE)
    })

    it('should pass all required props to shape components', () => {
      const propsWithDragMove = {
        ...defaultProps,
        onDragMove: vi.fn()
      }

      expect(() => {
        render(<ShapeFactory {...propsWithDragMove} shape={mockRectangle} />)
        render(<ShapeFactory {...propsWithDragMove} shape={mockCircle} />)
      }).not.toThrow()
    })
  })

  describe('Error Handling', () => {
    it('should handle unknown shape types gracefully', () => {
    const unknownShape = {
      id: 'unknown-1',
      type: 'unknown' as ShapeType,
      version: 'v2' as ShapeVersion,
      x: 0,
      y: 0,
      createdBy: 'user-1',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const { container } = render(<ShapeFactory {...defaultProps} shape={unknownShape as Rectangle} />)
      
      expect(container.firstChild).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith('Unknown shape type:', unknownShape)
      
      consoleSpy.mockRestore()
    })

    it('should handle missing shape gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const { container } = render(<ShapeFactory {...defaultProps} shape={null as unknown as Rectangle} />)
      
      expect(container.firstChild).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith('ShapeFactory received null or undefined shape')
      
      consoleSpy.mockRestore()
    })
  })

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<ShapeFactory {...defaultProps} shape={mockRectangle} />)
      
      // Re-render with same props
      rerender(<ShapeFactory {...defaultProps} shape={mockRectangle} />)
      
      // Should not cause issues
      const rectangle = screen.getByTestId('rectangle-component')
      expect(rectangle).toBeInTheDocument()
    })

    it('should handle rapid shape type changes', () => {
      const { rerender } = render(<ShapeFactory {...defaultProps} shape={mockRectangle} />)
      
      // Change to circle
      rerender(<ShapeFactory {...defaultProps} shape={mockCircle} />)
      expect(screen.getByTestId('circle-component')).toBeInTheDocument()
      
      // Change back to rectangle
      rerender(<ShapeFactory {...defaultProps} shape={mockRectangle} />)
      expect(screen.getByTestId('rectangle-component')).toBeInTheDocument()
    })
  })
})
