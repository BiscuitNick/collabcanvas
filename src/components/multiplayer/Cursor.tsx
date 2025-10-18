import React from 'react'
import { Group, Text, Rect } from 'react-konva'
import type { Cursor as CursorType } from '../../types'

interface CursorProps {
  cursor: CursorType
  scale?: number
}

const Cursor: React.FC<CursorProps> = ({ cursor, scale = 1 }) => {
  // Cursor is positioned in canvas coordinates within a Layer that is already transformed
  const x = cursor.x
  const y = cursor.y

  // Scale cursor elements inversely to match zoom level (so cursor stays visually constant size)
  // When zoomed in (scale > 1), we shrink the cursor proportionally
  const inverseScale = 1 / scale

  // Base cursor dimensions
  const baseLabelPadding = 8
  const baseLabelHeight = 20
  const baseLabelFontSize = 12

  // Scaled dimensions
  const labelPadding = baseLabelPadding * inverseScale
  const labelHeight = baseLabelHeight * inverseScale
  const labelFontSize = baseLabelFontSize * inverseScale

  // Username label dimensions - add indicator for current user
  const labelText = cursor.isCurrentUser ? `${cursor.userName} (You)` : cursor.userName

  // Calculate label width (approximate) - scaled
  const labelWidth = labelText.length * 7 * inverseScale + labelPadding * 2

  return (
    <Group listening={false}>
      {/* Username Label Background */}
      <Rect
        x={x}
        y={y}
        width={labelWidth}
        height={labelHeight}
        fill={cursor.color}
        cornerRadius={4 * inverseScale}
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={2 * inverseScale}
        shadowOffset={{ x: 0, y: 1 * inverseScale }}
        listening={false}
      />

      {/* Username Label Text */}
      <Text
        x={x + labelPadding / 2}
        y={y + 2 * inverseScale}
        text={labelText}
        fontSize={labelFontSize}
        fontFamily="Arial, sans-serif"
        fill="white"
        fontStyle="bold"
        listening={false}
      />
    </Group>
  )
}

export default Cursor
