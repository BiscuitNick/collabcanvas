import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Shape, SyncStatus } from '../types'

interface CanvasState {
  // Stage position and scale
  stagePosition: { x: number; y: number }
  stageScale: number
  
  // Shapes array
  shapes: Shape[]
  
  // Interaction states
  isPanning: boolean
  isZooming: boolean
  isDraggingShape: boolean
  
  // Selected shape
  selectedShapeId: string | null
  
  // Sync status for each shape
  shapeSyncStatus: Record<string, SyncStatus>
  
  // Pending updates queue for offline operations
  pendingUpdates: Map<string, Partial<Shape>>
  
  // Actions
  updatePosition: (x: number, y: number) => void
  updateScale: (scale: number) => void
  setPanning: (isPanning: boolean) => void
  setZooming: (isZooming: boolean) => void
  setDraggingShape: (isDraggingShape: boolean) => void
  addShape: (shape: Shape) => void
  updateShape: (id: string, updates: Partial<Shape>) => void
  deleteShape: (id: string) => void
  selectShape: (id: string | null) => void
  resetView: () => void
  setSyncStatus: (id: string, status: SyncStatus) => void
  addPendingUpdate: (id: string, updates: Partial<Shape>) => void
  clearPendingUpdates: () => void
  setShapes: (shapes: Shape[]) => void
  clearAllShapes: () => void
}

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set) => ({
  // Initial state - blank canvas
  stagePosition: { x: 0, y: 0 },
  stageScale: 1,
  shapes: [],
  isPanning: false,
  isZooming: false,
  isDraggingShape: false,
  selectedShapeId: null,
  shapeSyncStatus: {},
  pendingUpdates: new Map(),
  
  // Actions
  updatePosition: (x: number, y: number) => {
    set({ stagePosition: { x, y } })
  },
  
  updateScale: (scale: number) => {
    // Clamp scale between 0.01x (1%) and 3x (300%)
    const clampedScale = Math.max(0.01, Math.min(3, scale))
    set({ stageScale: clampedScale })
  },
  
  setPanning: (isPanning: boolean) => {
    set({ isPanning })
  },
  
  setZooming: (isZooming: boolean) => {
    set({ isZooming })
  },
  
  setDraggingShape: (isDraggingShape: boolean) => {
    set({ isDraggingShape })
  },
  
  addShape: (shape: Shape) => {
    set((state) => ({
      shapes: [...state.shapes, shape]
    }))
  },
  
  updateShape: (id: string, updates: Partial<Shape>) => {
    set((state) => ({
      shapes: state.shapes.map(shape =>
        shape.id === id ? { ...shape, ...updates } as Shape : shape
      )
    }))
  },
  
  deleteShape: (id: string) => {
    set((state) => ({
      shapes: state.shapes.filter((shape) => shape.id !== id),
      selectedShapeId: state.selectedShapeId === id ? null : state.selectedShapeId,
      shapeSyncStatus: Object.fromEntries(
        Object.entries(state.shapeSyncStatus).filter(([key]) => key !== id)
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
  },
  
  setSyncStatus: (id: string, status: SyncStatus) => {
    set((state) => ({
      shapeSyncStatus: {
        ...state.shapeSyncStatus,
        [id]: status
      }
    }))
  },
  
  addPendingUpdate: (id: string, updates: Partial<Shape>) => {
    set((state) => {
      const newPendingUpdates = new Map(state.pendingUpdates)
      newPendingUpdates.set(id, updates)
      return { pendingUpdates: newPendingUpdates }
    })
  },
  
  clearPendingUpdates: () => {
    set({ pendingUpdates: new Map() })
  },
  
  setShapes: (shapes: Shape[]) => {
    set({ shapes })
  },
  
  clearAllShapes: () => {
    set({ 
      shapes: [],
      selectedShapeId: null,
      shapeSyncStatus: {},
      pendingUpdates: new Map()
    })
  }
}),
    {
      name: 'canvas-store',
      partialize: (state) => ({
        stagePosition: state.stagePosition,
        stageScale: state.stageScale,
        selectedShapeId: state.selectedShapeId
      })
    }
  )
)
