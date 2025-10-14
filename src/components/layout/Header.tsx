import React from 'react'
import { useAuth } from '../../hooks/useAuth'

const Header: React.FC = () => {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white border-b border-gray-300 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">CC</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">CollabCanvas</h1>
        </div>

        {/* User Info and Logout */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-gray-700 font-medium">
                  {user.displayName || user.email}
                </span>
              </div>
              
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
