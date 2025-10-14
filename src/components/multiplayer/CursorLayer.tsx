import React from 'react'
import Cursor from './Cursor'
import type { Cursor as CursorType } from '../../types'

interface CursorLayerProps {
  cursors: CursorType[]
}

const CursorLayer: React.FC<CursorLayerProps> = ({ cursors }) => {
  console.log('🎯 CursorLayer rendering with cursors:', cursors)
  
  return (
    <div
      className="absolute inset-0 pointer-events-none z-40"
      style={{
        // Ensure cursors don't block canvas interactions
        pointerEvents: 'none',
      }}
    >
      {cursors.map((cursor) => {
        console.log('🎨 Rendering cursor:', cursor)
        return <Cursor key={cursor.userId} cursor={cursor} />
      })}
    </div>
  )
}

export default CursorLayer
