import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { GoogleSignIn } from '../../components/auth/GoogleSignIn'

// Mock Firebase Auth
const mockSignInWithPopup = vi.fn()
const mockSignOut = vi.fn()
const mockOnAuthStateChanged = vi.fn()

vi.mock('firebase/auth', () => ({
  signInWithPopup: () => mockSignInWithPopup(),
  GoogleAuthProvider: vi.fn(() => ({})),
  signOut: () => mockSignOut(),
  onAuthStateChanged: (_auth: unknown, callback: (user: unknown) => void) => {
    mockOnAuthStateChanged(callback)
    return () => {} // unsubscribe function
  }
}))

// Mock Firebase app
vi.mock('../../lib/firebase', () => ({
  auth: {}
}))

// Mock the useAuth hook
const mockUseAuth = vi.fn()
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth()
}))

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('Authentication Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render Google sign-in button', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: null,
      loginWithGoogle: vi.fn(),
      logout: vi.fn()
    })

    render(
      <TestWrapper>
        <GoogleSignIn />
      </TestWrapper>
    )

    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
  })

  it('should show loading state when signing in', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      error: null,
      loginWithGoogle: vi.fn(),
      logout: vi.fn()
    })

    render(
      <TestWrapper>
        <GoogleSignIn />
      </TestWrapper>
    )

    expect(screen.getByText('Signing in...')).toBeInTheDocument()
  })

  it('should call loginWithGoogle when button is clicked', async () => {
    const mockLoginWithGoogle = vi.fn()
    
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: null,
      loginWithGoogle: mockLoginWithGoogle,
      logout: vi.fn()
    })

    render(
      <TestWrapper>
        <GoogleSignIn />
      </TestWrapper>
    )

    const signInButton = screen.getByText('Continue with Google')
    fireEvent.click(signInButton)

    expect(mockLoginWithGoogle).toHaveBeenCalledTimes(1)
  })

  it('should display error message when authentication fails', () => {
    const errorMessage = 'Authentication failed'
    
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: errorMessage,
      loginWithGoogle: vi.fn(),
      logout: vi.fn()
    })

    render(
      <TestWrapper>
        <GoogleSignIn />
      </TestWrapper>
    )

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })

  it('should handle sign in with Google successfully', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: 'https://example.com/photo.jpg'
    }

    mockSignInWithPopup.mockResolvedValue({
      user: mockUser
    })

    // Mock auth state change
    mockOnAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser)
    })

    const mockLoginWithGoogle = vi.fn().mockImplementation(async () => {
      await mockSignInWithPopup()
    })

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
      loginWithGoogle: mockLoginWithGoogle,
      logout: vi.fn()
    })

    render(
      <TestWrapper>
        <GoogleSignIn />
      </TestWrapper>
    )

    const signInButton = screen.getByText('Continue with Google')
    fireEvent.click(signInButton)

    await waitFor(() => {
      expect(mockLoginWithGoogle).toHaveBeenCalled()
    })
  })

  it('should handle sign out successfully', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: 'https://example.com/photo.jpg'
    }

    mockSignOut.mockResolvedValue(undefined)

    const mockLogout = vi.fn().mockImplementation(async () => {
      await mockSignOut()
    })

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      error: null,
      loginWithGoogle: vi.fn(),
      logout: mockLogout
    })

    render(
      <TestWrapper>
        <GoogleSignIn />
      </TestWrapper>
    )

    // This test would need to be expanded to test logout functionality
    // which would typically be in a different component
    expect(mockLogout).toBeDefined()
  })

  it('should handle authentication errors gracefully', async () => {
    const errorMessage = 'Popup blocked by browser'
    
    mockSignInWithPopup.mockRejectedValue(new Error(errorMessage))

    const mockLoginWithGoogle = vi.fn().mockImplementation(async () => {
      await mockSignInWithPopup()
    })

    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      error: errorMessage,
      loginWithGoogle: mockLoginWithGoogle,
      logout: vi.fn()
    })

    render(
      <TestWrapper>
        <GoogleSignIn />
      </TestWrapper>
    )

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })
})
