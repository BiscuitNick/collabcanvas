import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ContentProperties from './ContentProperties'
import type { Text as TextType, Rectangle as RectangleType } from '../../types'

// Mock the UI components
vi.mock('../ui/input', () => ({
  Input: ({ id, value, onChange, className, type, min, max, placeholder, ...props }: any) => (
    <input
      id={id}
      value={value}
      onChange={onChange}
      className={className}
      type={type}
      min={min}
      max={max}
      placeholder={placeholder}
      {...props}
    />
  )
}))

vi.mock('../ui/label', () => ({
  Label: ({ htmlFor, children, className }: any) => (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  )
}))

vi.mock('../ui/button', () => ({
  Button: ({ children, onClick, disabled, className, variant, size, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  )
}))

vi.mock('../ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <select value={value} onChange={(e) => onValueChange(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectValue: () => <span>Select Value</span>
}))

describe('ContentProperties Component', () => {
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

  const defaultProps = {
    onUpdate: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Text Properties', () => {
    it('should render text-specific properties for text shapes', () => {
      render(<ContentProperties content={mockTextShape} {...defaultProps} />)
      
      // Check for text-specific inputs
      expect(screen.getByLabelText('Text Content')).toBeInTheDocument()
      expect(screen.getByLabelText('Font Size')).toBeInTheDocument()
      
      // Check for select elements by role (there are 2: font family and alignment)
      expect(screen.getAllByRole('combobox')).toHaveLength(2)
      
      // Check for font style buttons
      expect(screen.getByText('N')).toBeInTheDocument() // Normal
      expect(screen.getByText('B')).toBeInTheDocument() // Bold
      expect(screen.getByText('I')).toBeInTheDocument() // Italic
      expect(screen.getByText('B+I')).toBeInTheDocument() // Bold Italic
    })

    it('should display current text values', () => {
      render(<ContentProperties content={mockTextShape} {...defaultProps} />)
      
      const textInput = screen.getByLabelText('Text Content')
      const fontSizeInput = screen.getByLabelText('Font Size')
      
      expect(textInput).toHaveValue('Hello World')
      expect(fontSizeInput).toHaveValue(16)
    })

    it('should call onUpdate when text content changes', () => {
      render(<ContentProperties content={mockTextShape} {...defaultProps} />)
      
      const textInput = screen.getByLabelText('Text Content')
      fireEvent.change(textInput, { target: { value: 'New Text' } })
      
      expect(defaultProps.onUpdate).toHaveBeenCalledWith({ text: 'New Text' })
    })

    it('should call onUpdate when font size changes', () => {
      render(<ContentProperties content={mockTextShape} {...defaultProps} />)
      
      const fontSizeInput = screen.getByLabelText('Font Size')
      fireEvent.change(fontSizeInput, { target: { value: '20' } })
      
      expect(defaultProps.onUpdate).toHaveBeenCalledWith({ fontSize: 20 })
    })

    it('should adjust font size with +/- buttons', () => {
      render(<ContentProperties content={mockTextShape} {...defaultProps} />)
      
      const minusButton = screen.getByText('-')
      const plusButton = screen.getByText('+')
      
      fireEvent.click(plusButton)
      expect(defaultProps.onUpdate).toHaveBeenCalledWith({ fontSize: 17 })
      
      fireEvent.click(minusButton)
      expect(defaultProps.onUpdate).toHaveBeenCalledWith({ fontSize: 15 })
    })

    it('should disable +/- buttons at font size limits', () => {
      const minSizeShape = { ...mockTextShape, fontSize: 8 }
      const maxSizeShape = { ...mockTextShape, fontSize: 72 }
      
      const { rerender } = render(<ContentProperties content={minSizeShape} {...defaultProps} />)
      expect(screen.getByText('-')).toBeDisabled()
      
      rerender(<ContentProperties content={maxSizeShape} {...defaultProps} />)
      expect(screen.getByText('+')).toBeDisabled()
    })

    it('should call onUpdate when font style changes', () => {
      render(<ContentProperties content={mockTextShape} {...defaultProps} />)
      
      const boldButton = screen.getByText('B')
      fireEvent.click(boldButton)
      
      expect(defaultProps.onUpdate).toHaveBeenCalledWith({ fontStyle: 'bold' })
    })

    it('should highlight active font style', () => {
      const boldShape = { ...mockTextShape, fontStyle: 'bold' }
      render(<ContentProperties content={boldShape} {...defaultProps} />)
      
      const boldButton = screen.getByText('B')
      expect(boldButton).toHaveAttribute('data-variant', 'default')
    })
  })

  describe('Common Properties', () => {
    it('should render common properties for all shapes', () => {
      render(<ContentProperties content={mockTextShape} {...defaultProps} />)
      
      expect(screen.getByLabelText('X')).toBeInTheDocument()
      expect(screen.getByLabelText('Y')).toBeInTheDocument()
      expect(screen.getByLabelText('Fill')).toBeInTheDocument()
      expect(screen.getByLabelText('Rotation')).toBeInTheDocument()
    })

    it('should not render text-specific properties for non-text shapes', () => {
      render(<ContentProperties content={mockRectangleShape} {...defaultProps} />)
      
      expect(screen.queryByLabelText('Text Content')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Font Family')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Font Size')).not.toBeInTheDocument()
    })

    it('should render rectangle-specific properties for rectangle shapes', () => {
      render(<ContentProperties content={mockRectangleShape} {...defaultProps} />)
      
      expect(screen.getByLabelText('Width')).toBeInTheDocument()
      expect(screen.getByLabelText('Height')).toBeInTheDocument()
    })
  })

  describe('Position Updates', () => {
    it('should call onUpdate when position changes', () => {
      render(<ContentProperties content={mockTextShape} {...defaultProps} />)
      
      const xInput = screen.getByLabelText('X')
      const yInput = screen.getByLabelText('Y')
      
      fireEvent.change(xInput, { target: { value: '150' } })
      expect(defaultProps.onUpdate).toHaveBeenCalledWith({ x: 150 })
      
      fireEvent.change(yInput, { target: { value: '250' } })
      expect(defaultProps.onUpdate).toHaveBeenCalledWith({ y: 250 })
    })
  })

  describe('Color Updates', () => {
    it('should call onUpdate when fill color changes', () => {
      render(<ContentProperties content={mockTextShape} {...defaultProps} />)
      
      const fillInput = screen.getByLabelText('Fill')
      fireEvent.change(fillInput, { target: { value: '#ff0000' } })
      
      expect(defaultProps.onUpdate).toHaveBeenCalledWith({ fill: '#ff0000' })
    })
  })
})
