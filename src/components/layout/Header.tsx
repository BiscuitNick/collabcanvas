import React from 'react'

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-300 px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
          <span className="text-white font-bold text-sm">CC</span>
        </div>
      </div>
    </header>
  )
}

export default Header
