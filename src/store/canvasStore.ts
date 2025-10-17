import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Content, SyncStatus } from '../types'

interface CanvasState {
  // Stage position and scale
  stagePosition: { x: number; y: number }
  stageScale: number
  
  // Content array
  content: Content[]
  
  // Interaction states
  isPanning: boolean
  isZooming: boolean
  isDraggingContent: boolean
  
  // Selected content
  selectedContentId: string | null
  
  // Sync status for each content
  contentSyncStatus: Record<string, SyncStatus>
  
  // Pending updates queue for offline operations
  pendingUpdates: Map<string, Partial<Content>>
  
  // Actions
  updatePosition: (x: number, y: number) => void
  updateScale: (scale: number) => void
  setPanning: (isPanning: boolean) => void
  setZooming: (isZooming: boolean) => void
  setDraggingContent: (isDraggingContent: boolean) => void
  addContent: (content: Content) => void
  updateContent: (id: string, updates: Partial<Content>) => void
  deleteContent: (id: string) => void
  selectContent: (id: string | null) => void
  resetView: () => void
  setSyncStatus: (id: string, status: SyncStatus) => void
  addPendingUpdate: (id: string, updates: Partial<Content>) => void
  clearPendingUpdates: () => void
  setContent: (content: Content[]) => void
  clearAllContent: () => void
  
  // Legacy properties for backward compatibility during migration
  get shapes(): Content[]
  get isDraggingShape(): boolean
  get selectedShapeId(): string | null
  get shapeSyncStatus(): Record<string, SyncStatus>
  addShape: (shape: Content) => void
  updateShape: (id: string, updates: Partial<Content>) => void
  deleteShape: (id: string) => void
  selectShape: (id: string | null) => void
  setShapes: (shapes: Content[]) => void
  clearAllShapes: () => void
  setDraggingShape: (isDraggingShape: boolean) => void
}

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set) => ({
  // Initial state - blank canvas
  stagePosition: { x: 0, y: 0 },
  stageScale: 1,
  content: [],
  isPanning: false,
  isZooming: false,
  isDraggingContent: false,
  selectedContentId: null,
  contentSyncStatus: {},
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
  
  setDraggingContent: (isDraggingContent: boolean) => {
    set({ isDraggingContent })
  },
  
  addContent: (content: Content) => {
    set((state) => ({
      content: [...state.content, content]
    }))
  },
  
  updateContent: (id: string, updates: Partial<Content>) => {
    set((state) => ({
      content: state.content.map(content =>
        content.id === id ? { ...content, ...updates } as Content : content
      )
    }))
  },
  
  deleteContent: (id: string) => {
    set((state) => ({
      content: state.content.filter((content) => content.id !== id),
      selectedContentId: state.selectedContentId === id ? null : state.selectedContentId,
      contentSyncStatus: Object.fromEntries(
        Object.entries(state.contentSyncStatus).filter(([key]) => key !== id)
      )
    }))
  },
  
  selectContent: (id: string | null) => {
    set({ selectedContentId: id })
  },
  
  resetView: () => {
    set({
      stagePosition: { x: 0, y: 0 },
      stageScale: 1,
      selectedContentId: null
    })
  },
  
  setSyncStatus: (id: string, status: SyncStatus) => {
    set((state) => ({
      contentSyncStatus: {
        ...state.contentSyncStatus,
        [id]: status
      }
    }))
  },
  
  addPendingUpdate: (id: string, updates: Partial<Content>) => {
    set((state) => {
      const newPendingUpdates = new Map(state.pendingUpdates)
      newPendingUpdates.set(id, updates)
      return { pendingUpdates: newPendingUpdates }
    })
  },
  
  clearPendingUpdates: () => {
    set({ pendingUpdates: new Map() })
  },
  
  setContent: (content: Content[]) => {
    set({ content })
  },
  
  clearAllContent: () => {
    set({ 
      content: [],
      selectedContentId: null,
      contentSyncStatus: {},
      pendingUpdates: new Map()
    })
  },
  
  // Legacy implementations for backward compatibility during migration
  addShape: (shape: Content) => {
    set((state) => ({
      content: [...state.content, shape]
    }))
  },
  updateShape: (id: string, updates: Partial<Content>) => {
    set((state) => ({
      content: state.content.map(content =>
        content.id === id ? { ...content, ...updates } as Content : content
      )
    }))
  },
  deleteShape: (id: string) => {
    set((state) => ({
      content: state.content.filter((content) => content.id !== id),
      selectedContentId: state.selectedContentId === id ? null : state.selectedContentId,
      contentSyncStatus: Object.fromEntries(
        Object.entries(state.contentSyncStatus).filter(([key]) => key !== id)
      )
    }))
  },
  selectShape: (id: string | null) => {
    set({ selectedContentId: id })
  },
  setShapes: (shapes: Content[]) => {
    set({ content: shapes })
  },
  clearAllShapes: () => {
    set({ 
      content: [],
      selectedContentId: null,
      contentSyncStatus: {},
      pendingUpdates: new Map()
    })
  },
  setDraggingShape: (isDraggingShape: boolean) => {
    set({ isDraggingContent: isDraggingShape })
  },
  
  // Legacy getter implementations
  get shapes() { return this.content; },
  get isDraggingShape() { return this.isDraggingContent; },
  get selectedShapeId() { return this.selectedContentId; },
  get shapeSyncStatus() { return this.contentSyncStatus; }
}),
    {
      name: 'canvas-store',
      partialize: (state) => ({
        stagePosition: state.stagePosition,
        stageScale: state.stageScale,
        selectedContentId: state.selectedContentId
      })
    }
  )
)
