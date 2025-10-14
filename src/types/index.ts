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
  rotation: number
  fill: string
  createdBy: string
  createdAt: number | any // Firestore Timestamp
  updatedAt: number | any // Firestore Timestamp
  syncStatus?: SyncStatus // Local sync state
}


// Sync status enum
export const SyncStatus = {
  SYNCED: 'synced',
  PENDING: 'pending',
  CONFLICT: 'conflict',
  ERROR: 'error'
} as const

export type SyncStatus = typeof SyncStatus[keyof typeof SyncStatus]

// Cursor type for multiplayer cursors
export interface Cursor {
  userId: string
  userName: string
  x: number
  y: number
  color: string
  lastUpdated: number
  isVisible?: boolean // Whether cursor is within current viewport
  isCurrentUser?: boolean // Whether this is the current user's cursor
}

// Presence user type for online users
export interface PresenceUser {
  userId: string
  userName: string
  color: string
  joinedAt: number | any // Firestore Timestamp
  lastSeen?: number | any // Firestore Timestamp
}

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
