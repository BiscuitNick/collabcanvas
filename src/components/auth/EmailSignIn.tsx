import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

interface EmailSignInProps {
  onError?: (error: string) => void
}

export const EmailSignIn: React.FC<EmailSignInProps> = ({ onError }) => {
  const { signUpWithEmail, signInWithEmail, loading, error } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  })

  // Handle errors from the auth hook
  React.useEffect(() => {
    if (error && onError) {
      onError(error)
    }
  }, [error, onError])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSignUp) {
      // Validation for sign up
      if (formData.password !== formData.confirmPassword) {
        onError?.('Passwords do not match')
        return
      }
      if (formData.password.length < 6) {
        onError?.('Password must be at least 6 characters')
        return
      }
      if (!formData.email) {
        onError?.('Email is required')
        return
      }
      
      await signUpWithEmail(formData.email, formData.password, formData.displayName || undefined)
    } else {
      // Validation for sign in
      if (!formData.email || !formData.password) {
        onError?.('Email and password are required')
        return
      }
      
      await signInWithEmail(formData.email, formData.password)
    }
  }

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      displayName: ''
    })
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <p className="text-gray-600 mt-2">
            {isSignUp ? 'Join CollabCanvas' : 'Welcome back to CollabCanvas'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                Display Name (Optional)
              </label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your display name"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
              minLength={6}
            />
          </div>

          {isSignUp && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm your password"
                minLength={6}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`
              w-full flex items-center justify-center px-4 py-3 
              border border-transparent rounded-lg shadow-sm
              text-white font-medium
              focus:outline-none focus:ring-2 focus:ring-offset-2
              transition-all duration-200
              ${loading 
                ? 'opacity-50 cursor-not-allowed bg-gray-400' 
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 active:scale-95'
              }
            `}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
              </div>
            ) : (
              <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={toggleMode}
            className="text-sm text-blue-600 hover:text-blue-500 font-medium"
          >
            {isSignUp 
              ? 'Already have an account? Sign in' 
              : "Don't have an account? Sign up"
            }
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm text-center">
            {error}
          </p>
        </div>
      )}
    </div>
  )
}
