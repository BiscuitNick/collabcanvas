import { useState, useEffect } from 'react'
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth'
import type { User as FirebaseUser } from 'firebase/auth'
import { auth } from '../lib/firebase'
import type { User, AuthHookReturn } from '../types'

// Google Auth Provider
const googleProvider = new GoogleAuthProvider()

export const useAuth = (): AuthHookReturn => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Convert Firebase user to our User type
  const convertFirebaseUser = (firebaseUser: FirebaseUser | null): User | null => {
    if (!firebaseUser) return null
    
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL
    }
  }

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(convertFirebaseUser(firebaseUser))
        setLoading(false)
        setError(null)
      },
      (error) => {
        console.error('Auth state change error:', error)
        setError(error.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  // Sign in with Google
  const loginWithGoogle = async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await signInWithPopup(auth, googleProvider)
      console.log('Google sign-in successful:', result.user)
    } catch (error: unknown) {
      console.error('Google sign-in error:', error)
      setError((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // Sign up with email and password
  const signUpWithEmail = async (email: string, password: string, displayName?: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await createUserWithEmailAndPassword(auth, email, password)
      
      // Update the user's display name if provided
      if (displayName && result.user) {
        await updateProfile(result.user, { displayName })
      }
      
      console.log('Email sign-up successful:', result.user)
    } catch (error: unknown) {
      console.error('Email sign-up error:', error)
      setError((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // Sign in with email and password
  const signInWithEmail = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await signInWithEmailAndPassword(auth, email, password)
      console.log('Email sign-in successful:', result.user)
    } catch (error: unknown) {
      console.error('Email sign-in error:', error)
      setError((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // Sign out
  const logout = async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      
      await signOut(auth)
      console.log('Sign out successful')
    } catch (error: unknown) {
      console.error('Sign out error:', error)
      setError((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    error,
    loginWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    logout
  }
}
