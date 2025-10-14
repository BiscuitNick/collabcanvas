import { useState, useEffect } from 'react'
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged
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
    } catch (error: any) {
      console.error('Google sign-in error:', error)
      setError(error.message)
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
    } catch (error: any) {
      console.error('Sign out error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    error,
    loginWithGoogle,
    logout
  }
}
