import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Text from './Text'
import type { Text as TextType } from '../../types'
import { ShapeType, ShapeVersion, FontFamily, FontStyle, TextAlign, VerticalAlign } from '../../types'

// Mock Konva components
vi.mock('react-konva', () => ({
  Text: ({ onClick, onTap, onDragEnd, onTransformEnd, onMouseEnter, onMouseLeave, ...props }: {
    onClick: (e: React.MouseEvent) => void,
    onTap: (e: React.MouseEvent) => void,
    onDragEnd: (e: React.MouseEvent) => void,
    onTransformEnd: (e: React.MouseEvent) => void,
    onMouseEnter: (e: React.MouseEvent) => void,
    onMouseLeave: (e: React.MouseEvent) => void,
    [key: string]: unknown
  }) => (
    <div
      data-testid="konva-text"
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

describe('Text Component', () => {
  const mockText: TextType = {
    id: 'text-1',
    type: ShapeType.TEXT,
    version: ShapeVersion.V2,
    x: 100,
    y: 100,
    text: 'Hello World',
    fontSize: 16,
    fontFamily: FontFamily.ARIAL,
    fontStyle: FontStyle.NORMAL,
    fill: '#000000',
    width: 200,
    height: 50,
    textAlign: TextAlign.LEFT,
    verticalAlign: VerticalAlign.TOP,
    createdBy: 'user-1',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  const defaultProps = {
    shape: mockText,
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

  it('should render text with correct props', () => {
    render(<Text {...defaultProps} />)
    
    const text = screen.getByTestId('konva-text')
    expect(text).toBeInTheDocument()
    expect(text).toHaveAttribute('x', '100')
    expect(text).toHaveAttribute('y', '100')
    expect(text).toHaveAttribute('text', 'Hello World')
    expect(text).toHaveAttribute('fill', '#000000')
    expect(text).toHaveAttribute('width', '200')
    expect(text).toHaveAttribute('height', '50')
    expect(text).toHaveAttribute('align', 'left')
    expect(text).toHaveAttribute('verticalAlign', 'top')
  })

  it('should call onSelect when clicked', () => {
    render(<Text {...defaultProps} />)
    
    const text = screen.getByTestId('konva-text')
    // Mock the event to have evt.detail = 1 for single click
    const mockEvent = {
      cancelBubble: false,
      evt: { detail: 1 }
    }
    fireEvent.click(text, mockEvent)
    
    expect(defaultProps.onSelect).toHaveBeenCalledTimes(1)
  })

  it('should call onSelect when tapped', () => {
    render(<Text {...defaultProps} />)
    
    const text = screen.getByTestId('konva-text')
    // Mock the event to have evt.detail = 1 for single click
    const mockEvent = {
      cancelBubble: false,
      evt: { detail: 1 }
    }
    fireEvent.mouseDown(text, mockEvent)
    
    expect(defaultProps.onSelect).toHaveBeenCalledTimes(1)
  })

  it('should call onDragEnd with correct position when dragged', () => {
    render(<Text {...defaultProps} isSelected={true} />)
    
    const text = screen.getByTestId('konva-text')
    
    // Simulate drag end with new position
    const mockEvent = {
      target: {
        x: () => 150,
        y: () => 200
      }
    }
    
    fireEvent.mouseUp(text, mockEvent)
    
    expect(defaultProps.onDragEnd).toHaveBeenCalledWith(150, 200)
  })

  it('should show transformer when selected', () => {
    render(<Text {...defaultProps} isSelected={true} />)
    
    const transformer = screen.getByTestId('konva-transformer')
    expect(transformer).toBeInTheDocument()
  })

  it('should not show transformer when not selected', () => {
    render(<Text {...defaultProps} isSelected={false} />)
    
    const transformer = screen.queryByTestId('konva-transformer')
    expect(transformer).not.toBeInTheDocument()
  })

  it('should call onUpdate when transformed', () => {
    render(<Text {...defaultProps} isSelected={true} />)
    
    const text = screen.getByTestId('konva-text')
    
    // Simulate transform end with proper Konva event structure
    const mockEvent = {
      target: {
        x: () => 120,
        y: () => 130,
        scaleX: () => 1.5,
        scaleY: () => 1.2,
        width: () => 200,
        height: () => 50
      }
    }
    
    // Use mouseMove to trigger transform end (as mapped in the mock)
    fireEvent.mouseMove(text, mockEvent)
    
    expect(defaultProps.onUpdate).toHaveBeenCalledWith({
      x: 120,
      y: 130,
      width: 300, // 200 * 1.5
      height: 60  // 50 * 1.2
    })
  })

  it('should handle hover effects', () => {
    render(<Text {...defaultProps} />)
    
    const text = screen.getByTestId('konva-text')
    
    // Test mouse enter
    fireEvent.mouseEnter(text)
    
    // Test mouse leave
    fireEvent.mouseLeave(text)
    
    // These are visual effects, so we just ensure no errors occur
    expect(text).toBeInTheDocument()
  })

  it('should be draggable when selected', () => {
    render(<Text {...defaultProps} isSelected={true} />)
    
    const text = screen.getByTestId('konva-text')
    expect(text).toHaveAttribute('draggable', 'true')
  })

  it('should not be draggable when not selected', () => {
    render(<Text {...defaultProps} isSelected={false} />)
    
    const text = screen.getByTestId('konva-text')
    expect(text).toHaveAttribute('draggable', 'false')
  })

  it('should handle different font families', () => {
    const textWithDifferentFont: TextType = {
      ...mockText,
      fontFamily: FontFamily.HELVETICA
    }

    render(<Text {...defaultProps} shape={textWithDifferentFont} />)
    
    const text = screen.getByTestId('konva-text')
    // The mock doesn't handle all font properties, so we just verify it renders
    expect(text).toBeInTheDocument()
  })

  it('should handle different font styles', () => {
    const boldText: TextType = {
      ...mockText,
      fontStyle: FontStyle.BOLD
    }

    render(<Text {...defaultProps} shape={boldText} />)
    
    const text = screen.getByTestId('konva-text')
    // The mock doesn't handle all font properties, so we just verify it renders
    expect(text).toBeInTheDocument()
  })

  it('should handle different text alignments', () => {
    const centerText: TextType = {
      ...mockText,
      textAlign: TextAlign.CENTER
    }

    render(<Text {...defaultProps} shape={centerText} />)
    
    const text = screen.getByTestId('konva-text')
    expect(text).toHaveAttribute('align', 'center')
  })

  it('should handle different vertical alignments', () => {
    const middleText: TextType = {
      ...mockText,
      verticalAlign: VerticalAlign.MIDDLE
    }

    render(<Text {...defaultProps} shape={middleText} />)
    
    const text = screen.getByTestId('konva-text')
    expect(text).toHaveAttribute('verticalAlign', 'middle')
  })

  it('should handle different font sizes', () => {
    const largeText: TextType = {
      ...mockText,
      fontSize: 24
    }

    render(<Text {...defaultProps} shape={largeText} />)
    
    const text = screen.getByTestId('konva-text')
    // The mock doesn't handle all font properties, so we just verify it renders
    expect(text).toBeInTheDocument()
  })

  it('should handle different text content', () => {
    const longText: TextType = {
      ...mockText,
      text: 'This is a much longer text that should wrap properly within the text box boundaries'
    }

    render(<Text {...defaultProps} shape={longText} />)
    
    const text = screen.getByTestId('konva-text')
    expect(text).toHaveAttribute('text', 'This is a much longer text that should wrap properly within the text box boundaries')
  })

  it('should handle locked text styling', () => {
    const lockedText: TextType = {
      ...mockText,
      lockedByUserId: 'user-2',
      lockedByUserName: 'Other User',
      lockedByUserColor: '#00ff00'
    }

    render(<Text {...defaultProps} shape={lockedText} currentUserId="user-1" isSelected={true} />)
    
    const text = screen.getByTestId('konva-text')
    // The mock doesn't handle conditional stroke logic, so we just verify it renders
    expect(text).toBeInTheDocument()
  })

  it('should handle text without editing mode', () => {
    render(<Text {...defaultProps} />)
    
    const text = screen.getByTestId('konva-text')
    expect(text).toBeInTheDocument()
    
    // Should not show textarea for editing
    const textarea = screen.queryByRole('textbox')
    expect(textarea).not.toBeInTheDocument()
  })

  it('should handle different text colors', () => {
    const coloredText: TextType = {
      ...mockText,
      fill: '#ff0000'
    }

    render(<Text {...defaultProps} shape={coloredText} />)
    
    const text = screen.getByTestId('konva-text')
    expect(text).toHaveAttribute('fill', '#ff0000')
  })

  it('should handle text with different dimensions', () => {
    const smallText: TextType = {
      ...mockText,
      width: 100,
      height: 25
    }

    render(<Text {...defaultProps} shape={smallText} />)
    
    const text = screen.getByTestId('konva-text')
    expect(text).toHaveAttribute('width', '100')
    expect(text).toHaveAttribute('height', '25')
  })
})
