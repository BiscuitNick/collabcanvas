import React from 'react'
import { useAuth } from '../../hooks/useAuth'

interface LayoutProps {
  children: React.ReactNode
  leftColumn: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children, leftColumn }) => {
  const { user, logout } = useAuth()

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Fixed Left Column */}
      <div className="w-80 bg-white border-r border-gray-300 flex flex-col">
        {/* Header Section in Left Column */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">CC</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">CollabCanvas</h1>
            </div>
          </div>

          {/* User Info and Logout */}
          {user && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {user.displayName || user.email}
                  </span>
                  <span className="text-xs text-gray-500">Online</span>
                </div>
              </div>
              
              <button
                onClick={logout}
                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Left Column Content */}
        <div className="flex-1 overflow-y-auto">
          {leftColumn}
        </div>
      </div>

      {/* Main Content Area - Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}

export default Layout
