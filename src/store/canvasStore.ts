import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Content, SyncStatus } from '../types'

// Helper function to log all canvas store content - accessible from browser console
// Usage: window.logCanvasStore()
if (typeof window !== 'undefined') {
  (window as any).logCanvasStore = () => {
    const store = (window as any).__canvasStoreRef
    if (store) {
      const state = store.getState()
      console.log('🔍 [CANVAS STORE DEBUG] === COMPLETE STORE DUMP ===')
      console.log('📊 Total content items:', state.content.length)
      console.log('🔢 ContentIds (z-index order):', state.contentIds)
      console.log('📋 All content items:')
      state.content.forEach((item: Content, index: number) => {
        console.log(`  [${index}] Type: ${item.type}, ID: ${item.id}`)
        console.log(`      Position: (${item.x}, ${item.y})`)
        console.log(`      Created by: ${item.createdBy}`)
        if (item.type === 'group') {
          console.log(`      Nested items: ${(item as any).contentIds?.length || 0}`)
        }
      })
      console.log('📦 [CANVAS STORE DEBUG] === FULL JSON DATA ===')
      console.log(JSON.stringify(state.content, null, 2))
    } else {
      console.warn('Canvas store not initialized yet')
    }
  }

  // Direct store access for debugging
  (window as any).getCanvasStore = () => {
    const store = (window as any).__canvasStoreRef
    if (store) {
      return store.getState()
    }
    return null
  }
}

interface CanvasState {
  // Stage position and scale
  stagePosition: { x: number; y: number }
  stageScale: number

  // Content array
  content: Content[]

  // Content IDs array for z-index ordering (first = bottom, last = top)
  contentIds: string[]

  // Interaction states
  isPanning: boolean
  isZooming: boolean
  isDraggingContent: boolean
  shouldAnimatePan: boolean
  isMovingContent: boolean  // True when in click-to-lock move mode

  // Selected content
  selectedContentId: string | null

  // Sync status for each content
  contentSyncStatus: Record<string, SyncStatus>

  // Pending updates queue for offline operations
  pendingUpdates: Map<string, Partial<Content>>

  // Actions
  updatePosition: (x: number, y: number) => void
  updatePositionAnimated: (x: number, y: number) => void
  updateScale: (scale: number) => void
  setPanning: (isPanning: boolean) => void
  setZooming: (isZooming: boolean) => void
  setDraggingContent: (isDraggingContent: boolean) => void
  setMovingContent: (isMovingContent: boolean) => void
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

  // Z-index ordering actions
  addToContentIds: (id: string) => void
  removeFromContentIds: (id: string) => void
  setContentIds: (ids: string[]) => void
  bringToFront: (id: string) => void
  sendToBack: (id: string) => void
  moveUp: (id: string) => void
  moveDown: (id: string) => void
  
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
  contentIds: [],
  isPanning: false,
  isZooming: false,
  isDraggingContent: false,
  shouldAnimatePan: false,
  isMovingContent: false,
  selectedContentId: null,
  contentSyncStatus: {},
  pendingUpdates: new Map(),

  // Actions
  updatePosition: (x: number, y: number) => {
    set({ stagePosition: { x, y }, shouldAnimatePan: false })
  },

  updatePositionAnimated: (x: number, y: number) => {
    set({ stagePosition: { x, y }, shouldAnimatePan: true })
  },
  
  updateScale: (scale: number) => {
    // Clamp scale between 0.05x (5%) and 3x (300%)
    const clampedScale = Math.max(0.05, Math.min(3, scale))
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

  setMovingContent: (isMovingContent: boolean) => {
    set({ isMovingContent })
  },
  
  addContent: (content: Content) => {
    set((state) => {
      const newContent = [...state.content, content]
      const newContentIds = [...state.contentIds, content.id]

      return { content: newContent, contentIds: newContentIds }
    })
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
      contentIds: state.contentIds.filter((contentId) => contentId !== id),
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
    // Note: This resets to origin (0, 0) at top-left
    // The actual centering happens in useSmoothPanning when the canvas size is known
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
    // Only update content, NOT contentIds (contentIds is managed separately via Firestore sync or z-index operations)
    set({ content })
  },
  
  clearAllContent: () => {
    set({
      content: [],
      contentIds: [],
      selectedContentId: null,
      contentSyncStatus: {},
      pendingUpdates: new Map()
    })
  },

  // Z-index ordering actions
  addToContentIds: (id: string) => {
    set((state) => {
      if (state.contentIds.includes(id)) {
        return state
      }
      const newContentIds = [...state.contentIds, id]
      return { contentIds: newContentIds }
    })
  },

  removeFromContentIds: (id: string) => {
    set((state) => {
      const newContentIds = state.contentIds.filter(contentId => contentId !== id)
      return { contentIds: newContentIds }
    })
  },

  setContentIds: (ids: string[]) => {
    set({ contentIds: ids })
  },

  bringToFront: (id: string) => {
    set((state) => {
      const newContentIds = state.contentIds.filter(contentId => contentId !== id)
      newContentIds.push(id)
      return { contentIds: newContentIds }
    })
  },

  sendToBack: (id: string) => {
    set((state) => {
      const newContentIds = state.contentIds.filter(contentId => contentId !== id)
      newContentIds.unshift(id)
      return { contentIds: newContentIds }
    })
  },

  moveUp: (id: string) => {
    set((state) => {
      const index = state.contentIds.indexOf(id)
      if (index === -1 || index === state.contentIds.length - 1) {
        return state
      }
      const newContentIds = [...state.contentIds]
      ;[newContentIds[index], newContentIds[index + 1]] = [newContentIds[index + 1], newContentIds[index]]
      return { contentIds: newContentIds }
    })
  },

  moveDown: (id: string) => {
    set((state) => {
      const index = state.contentIds.indexOf(id)
      if (index === -1 || index === 0) {
        return state
      }
      const newContentIds = [...state.contentIds]
      ;[newContentIds[index], newContentIds[index - 1]] = [newContentIds[index - 1], newContentIds[index]]
      return { contentIds: newContentIds }
    })
  },
  
  // Legacy implementations for backward compatibility during migration
  addShape: (shape: Content) => {
    set((state) => {
      const newContent = [...state.content, shape]
      const newContentIds = [...state.contentIds, shape.id]

      return { content: newContent, contentIds: newContentIds }
    })
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
      contentIds: state.contentIds.filter((contentId) => contentId !== id),
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
    // Only update content, NOT contentIds (contentIds is managed separately)
    set({ content: shapes })
  },
  clearAllShapes: () => {
    set({
      content: [],
      contentIds: [],
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

// Store reference for debugging
if (typeof window !== 'undefined') {
  (window as any).__canvasStoreRef = useCanvasStore
}
