import React from 'react'

interface LayoutProps {
  children: React.ReactNode
  leftColumn: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children, leftColumn }) => {

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Fixed Left Column */}
      <div className="w-80 bg-white border-r border-gray-300 flex flex-col">
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
