import React from 'react'
import { Group, Line, Text, Rect } from 'react-konva'
import type { Cursor as CursorType } from '../../types'

interface CursorProps {
  cursor: CursorType
}

const Cursor: React.FC<CursorProps> = ({ cursor }) => {
  // Cursor is positioned in canvas coordinates within a Layer that is already transformed
  const x = cursor.x
  const y = cursor.y
  
  // Cursor line points (vertical line)
  const linePoints = [
    x, y,      // Start point
    x, y + 24  // End point (24px height)
  ]

  // Username label dimensions - add indicator for current user
  const labelText = cursor.isCurrentUser ? `${cursor.userName} (You)` : cursor.userName
  const labelPadding = 8
  const labelHeight = 20
  
  // Calculate label width (approximate)
  const labelWidth = labelText.length * 7 + labelPadding * 2

  return (
    <Group listening={false}>
      {/* Debug: Small dot at exact click point - Removed */}
      
      {/* Cursor Line */}
      <Line
        points={linePoints}
        stroke={cursor.color}
        strokeWidth={cursor.isCurrentUser ? 3 : 2}
        lineCap="round"
        shadowColor={cursor.color}
        shadowBlur={cursor.isCurrentUser ? 6 : 4}
        shadowOpacity={0.8}
        listening={false}
      />
      
      {/* Username Label Background */}
      <Rect
        x={x}
        y={y}
        width={labelWidth}
        height={labelHeight}
        fill={cursor.color}
        cornerRadius={4}
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={2}
        shadowOffset={{ x: 0, y: 1 }}
        listening={false}
      />
      
      {/* Username Label Text */}
      <Text
        x={x + labelPadding / 2}
        y={y + 2}
        text={labelText}
        fontSize={12}
        fontFamily="Arial, sans-serif"
        fill="white"
        fontStyle="bold"
        listening={false}
      />
    </Group>
  )
}

export default Cursor
