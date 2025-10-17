import React from 'react'
import { Badge } from '../ui/badge'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
import { useCanvasStore } from '../../store/canvasStore'

import type { Content, Cursor, PresenceUser } from '../../types';

interface DebugWidgetProps {
  content: Content[];
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
  content,
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
    <div className="text-xs">
      <Accordion type="multiple" defaultValue={["canvas-state", "debug-controls"]} className="w-full">
        {/* Canvas State */}
        <AccordionItem value="canvas-state" className="border-b">
          <AccordionTrigger className="py-2 text-xs font-medium text-gray-700 hover:no-underline">
            Canvas State
          </AccordionTrigger>
          <AccordionContent className="pb-2">
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
          </AccordionContent>
        </AccordionItem>

        {/* Content Info */}
        <AccordionItem value="content-info" className="border-b">
          <AccordionTrigger className="py-2 text-xs font-medium text-gray-700 hover:no-underline">
            Content ({content.length})
          </AccordionTrigger>
          <AccordionContent className="pb-2">
            <div className="space-y-1 text-gray-600">
              <div>Selected: {selectedShapeId || 'None'}</div>
              <div className="text-xs max-h-32 overflow-y-auto">
                {content.map(shape => (
                  <div key={shape.id} className="flex justify-between py-0.5">
                    <span>{shape.type}</span>
                    <span className="text-gray-400">({Math.round(shape.x)}, {Math.round(shape.y)})</span>
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Cursors Info */}
        <AccordionItem value="cursors-info" className="border-b">
          <AccordionTrigger className="py-2 text-xs font-medium text-gray-700 hover:no-underline">
            Cursors ({cursors.length})
          </AccordionTrigger>
          <AccordionContent className="pb-2">
            <div className="space-y-1 text-gray-600 max-h-32 overflow-y-auto">
              {cursors.map(cursor => (
                <div key={cursor.userId} className="flex justify-between py-0.5">
                  <span>{cursor.userName || 'Unknown'}</span>
                  <span className="text-gray-400">({Math.round(cursor.x)}, {Math.round(cursor.y)})</span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Debug Controls */}
        <AccordionItem value="debug-controls" className="border-b">
          <AccordionTrigger className="py-2 text-xs font-medium text-gray-700 hover:no-underline">
            Debug Controls
          </AccordionTrigger>
          <AccordionContent className="pb-2">
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
          </AccordionContent>
        </AccordionItem>

        {/* Presence Info */}
        <AccordionItem value="presence-info" className="border-b">
          <AccordionTrigger className="py-2 text-xs font-medium text-gray-700 hover:no-underline">
            Presence ({presence.length})
          </AccordionTrigger>
          <AccordionContent className="pb-2">
            <div className="space-y-1 text-gray-600 max-h-32 overflow-y-auto">
              {presence.map(user => (
                <div key={user.userId} className="flex justify-between py-0.5">
                  <span>{user.userName}</span>
                  <span className="text-gray-400">Active</span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

export default DebugWidget
