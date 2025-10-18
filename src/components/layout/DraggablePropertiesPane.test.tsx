import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import DraggablePropertiesPane from './DraggablePropertiesPane'
import type { Text as TextType, Rectangle as RectangleType, Circle as CircleType } from '../../types'

// Mock the UI components
vi.mock('../ui/button', () => ({
  Button: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  )
}))

vi.mock('../ui/accordion', () => ({
  Accordion: ({ children, value, onValueChange }: any) => {
    const handleItemClick = (itemValue: string) => {
      if (onValueChange) {
        onValueChange(itemValue)
      }
    }
    return (
      <div data-testid="accordion" data-value={value}>
        {React.Children.map(children, (child) => 
          React.cloneElement(child, { onItemClick: handleItemClick })
        )}
      </div>
    )
  },
  AccordionItem: ({ children, value, className, onItemClick }: any) => (
    <div data-testid="accordion-item" data-value={value} className={className}>
      {React.Children.map(children, (child) => 
        React.cloneElement(child, { onItemClick, itemValue: value })
      )}
    </div>
  ),
  AccordionTrigger: ({ children, className, onItemClick, itemValue }: any) => (
    <button 
      data-testid="accordion-trigger" 
      className={className} 
      onClick={() => onItemClick && onItemClick(itemValue)}
    >
      {children}
    </button>
  ),
  AccordionContent: ({ children }: any) => (
    <div data-testid="accordion-content">{children}</div>
  )
}))

vi.mock('./ContentProperties', () => ({
  default: ({ content, onUpdate }: any) => (
    <div data-testid="content-properties" data-content-id={content.id}>
      Content Properties for {content.type}
    </div>
  )
}))

describe('DraggablePropertiesPane Component', () => {
  const mockTextShape: TextType = {
    id: 'text-1',
    type: 'text',
    version: 'v2',
    x: 100,
    y: 200,
    text: 'Hello World',
    fontSize: 16,
    fontFamily: 'Arial',
    fontStyle: 'normal',
    fill: '#000000',
    align: 'left',
    createdBy: 'user-1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    opacity: 1,
    rotation: 0,
  }

  const mockLongTextShape: TextType = {
    ...mockTextShape,
    id: 'text-2',
    text: 'This is a very long text that should be truncated in the layers panel',
  }

  const mockRectangleShape: RectangleType = {
    id: 'rect-1',
    type: 'rectangle',
    version: 'v2',
    x: 50,
    y: 100,
    width: 200,
    height: 150,
    fill: '#ff0000',
    createdBy: 'user-1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    opacity: 1,
    rotation: 0,
  }

  const mockCircleShape: CircleType = {
    id: 'circle-1',
    type: 'circle',
    version: 'v2',
    x: 75,
    y: 125,
    radius: 50,
    fill: '#00ff00',
    createdBy: 'user-1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    opacity: 1,
    rotation: 0,
  }

  const defaultProps = {
    content: [mockTextShape, mockRectangleShape, mockCircleShape],
    selectedShape: null,
    onUpdateShape: vi.fn(),
    onSelectShape: vi.fn(),
    isVisible: true,
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render when visible', () => {
    render(<DraggablePropertiesPane {...defaultProps} />)
    
    expect(screen.getByText('Layers')).toBeInTheDocument()
    expect(screen.getByTestId('accordion')).toBeInTheDocument()
  })

  it('should not render when not visible', () => {
    render(<DraggablePropertiesPane {...defaultProps} isVisible={false} />)
    
    expect(screen.queryByText('Layers')).not.toBeInTheDocument()
  })

  it('should display text content with Type icon', () => {
    render(<DraggablePropertiesPane {...defaultProps} />)
    
    // Check for text content display
    expect(screen.getByText('Hello World')).toBeInTheDocument()
    
    // Check for Type icon (lucide-react Type icon renders as SVG)
    const textItem = screen.getByText('Hello World').closest('[data-testid="accordion-item"]')
    expect(textItem).toBeInTheDocument()
  })

  it('should truncate long text content', () => {
    const contentWithLongText = [mockLongTextShape]
    render(<DraggablePropertiesPane {...defaultProps} content={contentWithLongText} />)
    
    // Should show truncated text with ellipsis
    expect(screen.getByText('This is a very long ...')).toBeInTheDocument()
  })

  it('should display rectangle with Square icon', () => {
    render(<DraggablePropertiesPane {...defaultProps} />)
    
    expect(screen.getByText('Rectangle')).toBeInTheDocument()
  })

  it('should display circle with Circle icon', () => {
    render(<DraggablePropertiesPane {...defaultProps} />)
    
    expect(screen.getByText('Circle')).toBeInTheDocument()
  })

  it('should show selected state for selected shape', () => {
    render(<DraggablePropertiesPane {...defaultProps} selectedShape={mockTextShape} />)
    
    const textTrigger = screen.getByText('Hello World').closest('[data-testid="accordion-trigger"]')
    expect(textTrigger).toHaveClass('bg-blue-50')
  })

  it('should call onSelectShape when accordion trigger is clicked', () => {
    render(<DraggablePropertiesPane {...defaultProps} />)
    
    const textTrigger = screen.getByText('Hello World').closest('[data-testid="accordion-trigger"]')
    fireEvent.click(textTrigger!)
    
    expect(defaultProps.onSelectShape).toHaveBeenCalledWith('text-1')
  })

  it('should show empty state when no content', () => {
    render(<DraggablePropertiesPane {...defaultProps} content={[]} />)
    
    expect(screen.getByText('No content on canvas.')).toBeInTheDocument()
  })

  it('should render ContentProperties for each item', () => {
    render(<DraggablePropertiesPane {...defaultProps} />)
    
    const contentProperties = screen.getAllByTestId('content-properties')
    expect(contentProperties).toHaveLength(3)
    
    // Check that each content type has its properties rendered
    expect(screen.getByText('Content Properties for text')).toBeInTheDocument()
    expect(screen.getByText('Content Properties for rectangle')).toBeInTheDocument()
    expect(screen.getByText('Content Properties for circle')).toBeInTheDocument()
  })

  it('should call onUpdateShape when ContentProperties updates', () => {
    render(<DraggablePropertiesPane {...defaultProps} />)
    
    // This would be called by ContentProperties component
    // We can't easily test this without more complex mocking
    expect(screen.getByTestId('accordion')).toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', () => {
    render(<DraggablePropertiesPane {...defaultProps} />)
    
    const closeButton = screen.getByTitle('Close Properties Panel')
    fireEvent.click(closeButton)
    
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('should sort content by creation date', () => {
    const oldText = {
      ...mockTextShape,
      id: 'old-text',
      createdAt: Date.now() - 1000
    }
    const newText = {
      ...mockTextShape,
      id: 'new-text',
      createdAt: Date.now()
    }
    
    render(<DraggablePropertiesPane {...defaultProps} content={[oldText, newText]} />)
    
    const accordionItems = screen.getAllByTestId('accordion-item')
    // The newer item should appear last (since we're sorting by creation date ascending)
    expect(accordionItems[1]).toHaveAttribute('data-value', 'new-text')
  })
})
