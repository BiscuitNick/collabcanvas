import React from 'react'
import type { Cursor as CursorType } from '../../types'

interface CursorProps {
  cursor: CursorType
}

const Cursor: React.FC<CursorProps> = ({ cursor }) => {
  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-75 ease-out"
      style={{
        left: cursor.x,
        top: cursor.y,
      }}
    >
      {/* Vertical Line Cursor */}
      <div
        className="w-0.5 h-6 relative"
        style={{ 
          backgroundColor: cursor.color,
          boxShadow: `0 0 4px ${cursor.color}`
        }}
      />
      
      {/* Username Label - positioned to the right */}
      <div
        className="absolute top-0 left-2 px-2 py-1 text-xs font-medium text-white rounded shadow-sm whitespace-nowrap"
        style={{ 
          backgroundColor: cursor.color,
          lineHeight: '24px' // Match the height of the vertical line
        }}
      >
        {cursor.userName}
      </div>
    </div>
  )
}

export default Cursor
