import { create } from 'zustand'
import type { Rectangle, SyncStatus } from '../types'

interface CanvasState {
  // Stage position and scale
  stagePosition: { x: number; y: number }
  stageScale: number
  
  // Shapes array
  shapes: Rectangle[]
  
  // Interaction states
  isPanning: boolean
  isZooming: boolean
  isDraggingShape: boolean
  
  // Selected shape
  selectedShapeId: string | null
  
  // Sync status for each shape
  shapeSyncStatus: Record<string, SyncStatus>
  
  // Pending updates queue for offline operations
  pendingUpdates: Map<string, Partial<Rectangle>>
  
  // Actions
  updatePosition: (x: number, y: number) => void
  updateScale: (scale: number) => void
  setPanning: (isPanning: boolean) => void
  setZooming: (isZooming: boolean) => void
  setDraggingShape: (isDraggingShape: boolean) => void
  addShape: (shape: Rectangle) => void
  updateShape: (id: string, updates: Partial<Rectangle>) => void
  deleteShape: (id: string) => void
  selectShape: (id: string | null) => void
  resetView: () => void
  setSyncStatus: (id: string, status: SyncStatus) => void
  addPendingUpdate: (id: string, updates: Partial<Rectangle>) => void
  clearPendingUpdates: () => void
  setShapes: (shapes: Rectangle[]) => void
}

export const useCanvasStore = create<CanvasState>((set) => ({
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
  
  setDraggingShape: (isDraggingShape: boolean) => {
    set({ isDraggingShape })
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
  
  addPendingUpdate: (id: string, updates: Partial<Rectangle>) => {
    set((state) => {
      const newPendingUpdates = new Map(state.pendingUpdates)
      newPendingUpdates.set(id, updates)
      return { pendingUpdates: newPendingUpdates }
    })
  },
  
  clearPendingUpdates: () => {
    set({ pendingUpdates: new Map() })
  },
  
  setShapes: (shapes: Rectangle[]) => {
    set({ shapes })
  }
}))
