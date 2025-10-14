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

// Rectangle type for canvas (will be used in later PRs)
export interface Rectangle {
  id: string
  x: number
  y: number
  width: number
  height: number
  fill: string
  createdBy: string
  createdAt: number
  updatedAt: number
}

// Stage configuration type
export interface StageConfig {
  x: number
  y: number
  scale: number
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
