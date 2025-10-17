import React from 'react'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { useCanvasStore } from '../../store/canvasStore'

import type { Shape, Cursor, PresenceUser } from '../../types';

interface DebugWidgetProps {
  shapes: Shape[];
  cursors: Cursor[];
  presence: PresenceUser[];
  selectedShapeId: string | null
  debugMode: boolean
  showSelfCursor: boolean
  onToggleSelfCursor: (show: boolean) => void
  showFPS: boolean
  onToggleFPS: (show: boolean) => void
  enableViewportCulling: boolean
  onToggleViewportCulling: (enable: boolean) => void
  fps: number
}

const DebugWidget: React.FC<DebugWidgetProps> = ({
  shapes,
  cursors,
  presence,
  selectedShapeId,
  debugMode,
  showSelfCursor,
  onToggleSelfCursor,
  showFPS,
  onToggleFPS,
  enableViewportCulling,
  onToggleViewportCulling,
  fps
}) => {
  const { stagePosition, stageScale, isPanning, isDraggingShape, isZooming } = useCanvasStore()

  if (!debugMode) return null

  return (
    <div className="space-y-3 text-xs">
        {/* Canvas State */}
        <div>
          <h4 className="font-medium text-gray-700 mb-1">Canvas State</h4>
          <div className="space-y-1 text-gray-600">
            <div>Position: ({Math.round(stagePosition.x)}, {Math.round(stagePosition.y)})</div>
            <div>Scale: {Math.round(stageScale * 100)}%</div>
            <div>FPS: {Math.round(fps)}</div>
            <div className="flex gap-1">
              <Badge variant={isPanning ? "default" : "outline"} className="text-xs px-1 py-0">
                Panning
              </Badge>
              <Badge variant={isDraggingShape ? "default" : "outline"} className="text-xs px-1 py-0">
                Dragging
              </Badge>
              <Badge variant={isZooming ? "default" : "outline"} className="text-xs px-1 py-0">
                Zooming
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Shapes Info */}
        <div>
          <h4 className="font-medium text-gray-700 mb-1">Shapes ({shapes.length})</h4>
          <div className="space-y-1 text-gray-600">
            <div>Selected: {selectedShapeId || 'None'}</div>
            <div className="text-xs">
              {shapes.map(shape => (
                <div key={shape.id} className="flex justify-between">
                  <span>{shape.type}</span>
                  <span className="text-gray-400">({Math.round(shape.x)}, {Math.round(shape.y)})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Cursors Info */}
        <div>
          <h4 className="font-medium text-gray-700 mb-1">Cursors ({cursors.length})</h4>
          <div className="space-y-1 text-gray-600">
            {cursors.map(cursor => (
              <div key={cursor.userId} className="flex justify-between">
                <span>{cursor.userName || 'Unknown'}</span>
                <span className="text-gray-400">({Math.round(cursor.x)}, {Math.round(cursor.y)})</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Debug Controls */}
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Debug Controls</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-self-cursor" className="text-xs">
                Show Self Cursor
              </Label>
              <Switch
                id="show-self-cursor"
                checked={showSelfCursor}
                onCheckedChange={onToggleSelfCursor}
                className="scale-75"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-fps" className="text-xs">
                Show FPS Monitor
              </Label>
              <Switch
                id="show-fps"
                checked={showFPS}
                onCheckedChange={onToggleFPS}
                className="scale-75"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="viewport-culling" className="text-xs">
                Enable Viewport Culling
              </Label>
              <Switch
                id="viewport-culling"
                checked={enableViewportCulling}
                onCheckedChange={onToggleViewportCulling}
                className="scale-75"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Presence Info */}
        <div>
          <h4 className="font-medium text-gray-700 mb-1">Presence ({presence.length})</h4>
          <div className="space-y-1 text-gray-600">
            {presence.map(user => (
              <div key={user.userId} className="flex justify-between">
                <span>{user.userName}</span>
                <span className="text-gray-400">Active</span>
              </div>
            ))}
          </div>
        </div>
    </div>
  )
}

export default DebugWidget
