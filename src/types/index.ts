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
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
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
  createdAt: number | Date // Firestore Timestamp can be Date object too
  updatedAt: number | Date // Firestore Timestamp can be Date object too
  syncStatus?: SyncStatus // Local sync state
  // Collaborative locking (optional)
  lockedByUserId?: string | null
  lockedByUserName?: string | null
  lockedByUserColor?: string | null
  lockedAt?: number | Date | null
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
  joinedAt: number | Date // Firestore Timestamp can be Date object too
  lastSeen?: number | Date // Firestore Timestamp can be Date object too
}

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
