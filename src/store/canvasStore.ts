import { create } from 'zustand'
import type { Rectangle } from '../types'

interface CanvasState {
  // Stage position and scale
  stagePosition: { x: number; y: number }
  stageScale: number
  
  // Shapes array (empty for now)
  shapes: Rectangle[]
  
  // Interaction states
  isPanning: boolean
  isZooming: boolean
  
  // Selected shape
  selectedShapeId: string | null
  
  // Actions
  updatePosition: (x: number, y: number) => void
  updateScale: (scale: number) => void
  setPanning: (isPanning: boolean) => void
  setZooming: (isZooming: boolean) => void
  addShape: (shape: Rectangle) => void
  updateShape: (id: string, updates: Partial<Rectangle>) => void
  selectShape: (id: string | null) => void
  resetView: () => void
}

export const useCanvasStore = create<CanvasState>((set) => ({
  // Initial state - blank canvas
  stagePosition: { x: 0, y: 0 },
  stageScale: 1,
  shapes: [],
  isPanning: false,
  isZooming: false,
  selectedShapeId: null,
  
  // Actions
  updatePosition: (x: number, y: number) => {
    set({ stagePosition: { x, y } })
  },
  
  updateScale: (scale: number) => {
    // Clamp scale between 0.1x and 3x
    const clampedScale = Math.max(0.1, Math.min(3, scale))
    set({ stageScale: clampedScale })
  },
  
  setPanning: (isPanning: boolean) => {
    set({ isPanning })
  },
  
  setZooming: (isZooming: boolean) => {
    set({ isZooming })
  },
  
  addShape: (shape: Rectangle) => {
    set((state) => ({
      shapes: [...state.shapes, shape]
    }))
  },
  
  updateShape: (id: string, updates: Partial<Rectangle>) => {
    set((state) => ({
      shapes: state.shapes.map(shape =>
        shape.id === id ? { ...shape, ...updates } : shape
      )
    }))
  },
  
  selectShape: (id: string | null) => {
    set({ selectedShapeId: id })
  },
  
  resetView: () => {
    set({
      stagePosition: { x: 0, y: 0 },
      stageScale: 1,
      selectedShapeId: null
    })
  }
}))
