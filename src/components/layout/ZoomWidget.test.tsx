import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import ZoomWidget from './ZoomWidget'

// Mock the canvas store
const mockUpdateScale = vi.fn()

vi.mock('../../store/canvasStore', () => ({
  useCanvasStore: vi.fn(() => ({
    stageScale: 1,
    updateScale: mockUpdateScale
  }))
}))

describe('ZoomWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders zoom controls correctly', () => {
    render(<ZoomWidget />)
    
    expect(screen.getByTitle('Zoom Out (-10%)')).toBeInTheDocument()
    expect(screen.getByTitle('Zoom In (+10%)')).toBeInTheDocument()
    expect(screen.getByDisplayValue('100')).toBeInTheDocument()
  })

  it('calls updateScale when zoom in button is clicked', () => {
    render(<ZoomWidget />)
    
    const zoomInButton = screen.getByTitle('Zoom In (+10%)')
    fireEvent.click(zoomInButton)
    
    expect(mockUpdateScale).toHaveBeenCalledWith(1.1)
  })

  it('calls updateScale when zoom out button is clicked', () => {
    render(<ZoomWidget />)
    
    const zoomOutButton = screen.getByTitle('Zoom Out (-10%)')
    fireEvent.click(zoomOutButton)
    
    expect(mockUpdateScale).toHaveBeenCalledWith(0.9)
  })

  it('has dynamic step attribute based on zoom level', () => {
    render(<ZoomWidget />)
    
    const zoomInput = screen.getByDisplayValue('100')
    // At 100%, step should be 10
    expect(zoomInput).toHaveAttribute('step', '10')
  })

  it('displays percentage symbol inside input field', () => {
    render(<ZoomWidget />)
    
    const percentageSymbol = screen.getByText('%')
    expect(percentageSymbol).toBeInTheDocument()
    expect(percentageSymbol).toHaveClass('text-gray-500')
  })

  it('calls updateScale when zoom input is changed', () => {
    render(<ZoomWidget />)
    
    const zoomInput = screen.getByDisplayValue('100')
    fireEvent.change(zoomInput, { target: { value: '150' } })
    
    expect(mockUpdateScale).toHaveBeenCalledWith(1.5)
  })

  it('clamps zoom input to minimum value of 1%', () => {
    render(<ZoomWidget />)
    
    const zoomInput = screen.getByDisplayValue('100')
    fireEvent.change(zoomInput, { target: { value: '0' } })
    
    expect(mockUpdateScale).toHaveBeenCalledWith(0.01)
  })

  it('clamps zoom input to maximum value of 500%', () => {
    render(<ZoomWidget />)
    
    const zoomInput = screen.getByDisplayValue('100')
    fireEvent.change(zoomInput, { target: { value: '600' } })
    
    expect(mockUpdateScale).toHaveBeenCalledWith(5)
  })

  it('resets input to current value on blur with invalid input', () => {
    render(<ZoomWidget />)
    
    const zoomInput = screen.getByDisplayValue('100')
    fireEvent.change(zoomInput, { target: { value: 'invalid' } })
    fireEvent.blur(zoomInput)
    
    expect(zoomInput).toHaveValue(100)
  })


  it('displays default zoom percentage', () => {
    render(<ZoomWidget />)
    
    expect(screen.getByDisplayValue('100')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<ZoomWidget className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
