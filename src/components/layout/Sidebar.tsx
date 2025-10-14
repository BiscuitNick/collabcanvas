import React from 'react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null

  return (
    <div className="w-80 bg-white border-r border-gray-200 shadow-lg flex flex-col">
      {/* Sidebar header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900">
          Online Users
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Close sidebar"
        >
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      
      {/* Sidebar content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

export default Sidebar
