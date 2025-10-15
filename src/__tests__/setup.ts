import '@testing-library/jest-dom'
import { vi, beforeEach } from 'vitest'

// Mock Firebase modules for testing
vi.mock('../lib/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn()
  },
  firestore: {
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    onSnapshot: vi.fn()
  },
}))

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks()
})
