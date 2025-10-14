// User type for authentication
export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

// Auth hook return type
export interface AuthHookReturn {
  user: User | null
  loading: boolean
  error: string | null
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

// Rectangle type for canvas with Firestore integration
export interface Rectangle {
  id: string
  x: number
  y: number
  width: number
  height: number
  fill: string
  createdBy: string
  createdAt: number | any // Firestore Timestamp
  updatedAt: number | any // Firestore Timestamp
  lockedBy?: string // User ID who is currently editing
  lockedAt?: number | any // When lock was acquired (Firestore Timestamp)
  syncStatus?: SyncStatus // Local sync state
}

// Shape lock type for preventing concurrent edits
export interface ShapeLock {
  shapeId: string
  lockedBy: string
  lockedAt: number | any // Firestore Timestamp
  expiresAt: number | any // Firestore Timestamp
  isManipulating: boolean // True if actively being dragged/resized
  lastActivity: number | any // Last time lock was extended (Firestore Timestamp)
}

// Sync status enum
export const SyncStatus = {
  SYNCED: 'synced',
  PENDING: 'pending',
  CONFLICT: 'conflict',
  ERROR: 'error'
} as const

export type SyncStatus = typeof SyncStatus[keyof typeof SyncStatus]

// Manipulation state enum
export const ManipulationState = {
  IDLE: 'idle',           // Not being manipulated
  DRAGGING: 'dragging',   // Being dragged
  RESIZING: 'resizing',   // Being resized
  LOCKED: 'locked'        // Locked by another user
} as const

export type ManipulationState = typeof ManipulationState[keyof typeof ManipulationState]

// Stage configuration type
export interface StageConfig {
  x: number
  y: number
  scale: number
}

// Interaction state type
export interface InteractionState {
  isPanning: boolean
  isZooming: boolean
}

// Cursor type for multiplayer (will be used in later PRs)
export interface Cursor {
  userId: string
  userName: string
  x: number
  y: number
  color: string
  lastUpdated: number
}

// Presence user type (will be used in later PRs)
export interface PresenceUser {
  userId: string
  userName: string
  color: string
  joinedAt: number
}
