import React from 'react'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
import { useCanvasStore } from '../../store/canvasStore'
import { isGroupContent } from '../../types'

import type { Content, Cursor } from '../../types';

interface DebugWidgetProps {
  content: Content[];
  cursors: Cursor[];
  selectedShapeId: string | null
  debugMode: boolean
  showSelfCursor: boolean
  onToggleSelfCursor: (show: boolean) => void
  showFPS: boolean
  onToggleFPS: (show: boolean) => void
  enableViewportCulling: boolean
  onToggleViewportCulling: (enable: boolean) => void
  fps: number
  enableFirestore?: boolean
  onToggleFirestore?: (enable: boolean) => void
  enableRTDB?: boolean
  onToggleRTDB?: (enable: boolean) => void
  enableGroupCaching?: boolean
  onToggleGroupCaching?: (enable: boolean) => void
  canvasWidth: number
  canvasHeight: number
  onCanvasWidthChange?: (width: number) => void
  onCanvasHeightChange?: (height: number) => void
  lastEvent?: {
    type: 'mouse' | 'touch'
    x: number
    y: number
    canvasX?: number
    canvasY?: number
    target: string
    contentTarget?: string
    tool: string
    timestamp: number
  } | null
}

const DebugWidget: React.FC<DebugWidgetProps> = ({
  content,
  cursors,
  selectedShapeId,
  debugMode,
  showSelfCursor,
  onToggleSelfCursor,
  enableViewportCulling,
  onToggleViewportCulling,
  fps,
  enableFirestore = true,
  onToggleFirestore,
  enableRTDB = true,
  onToggleRTDB,
  enableGroupCaching = false,
  onToggleGroupCaching,
  lastEvent
}) => {
  const { stagePosition, stageScale } = useCanvasStore()

  // Calculate total shapes including nested items in groups
  const topLevelCount = content.length
  const totalCount = content.reduce((count, item) => {
    if (isGroupContent(item)) {
      return count + 1 + item.contentIds.length
    }
    return count + 1
  }, 0)

  if (!debugMode) return null

  return (
    <div className="text-xs">
      <Accordion type="multiple" defaultValue={["canvas-state", "last-event", "debug-controls"]} className="w-full">
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
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Last Event */}
        <AccordionItem value="last-event" className="border-b">
          <AccordionTrigger className="py-2 text-xs font-medium text-gray-700 hover:no-underline">
            Last Event
          </AccordionTrigger>
          <AccordionContent className="pb-2">
            {lastEvent ? (
              <div className="space-y-1 text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type:</span>
                  <span className="font-mono">{lastEvent.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tool:</span>
                  <span className="font-mono">{lastEvent.tool}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Screen:</span>
                  <span className="font-mono">({lastEvent.x}, {lastEvent.y})</span>
                </div>
                {lastEvent.canvasX !== undefined && lastEvent.canvasY !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Canvas:</span>
                    <span className="font-mono">({lastEvent.canvasX}, {lastEvent.canvasY})</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Target:</span>
                  <span className="font-mono text-xs break-all">{lastEvent.target}</span>
                </div>
                {lastEvent.contentTarget && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Content:</span>
                    <span className="font-mono text-xs break-all font-semibold text-blue-600">{lastEvent.contentTarget}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Time:</span>
                  <span className="font-mono text-xs">{new Date(lastEvent.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ) : (
              <div className="text-gray-400 italic">No events yet</div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Content Info */}
        <AccordionItem value="content-info" className="border-b">
          <AccordionTrigger className="py-2 text-xs font-medium text-gray-700 hover:no-underline">
            Content
          </AccordionTrigger>
          <AccordionContent className="pb-2">
            <div className="space-y-1 text-gray-600">
              <div>Top-level: {topLevelCount}</div>
              <div>Total (w/ nested): {totalCount}</div>
              <div>Selected: {selectedShapeId || 'None'}</div>
              <div className="text-xs max-h-32 overflow-y-auto mt-2">
                {content.map(shape => (
                  <div key={shape.id} className="flex justify-between py-0.5">
                    <span>
                      {shape.type}
                      {isGroupContent(shape) && (
                        <span className="text-gray-400 ml-1">({shape.contentIds.length})</span>
                      )}
                    </span>
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

              {onToggleFirestore && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="firestore-updates" className="text-xs">
                    Firestore Updates
                  </Label>
                  <Switch
                    id="firestore-updates"
                    checked={enableFirestore}
                    onCheckedChange={onToggleFirestore}
                    className="scale-75"
                  />
                </div>
              )}

              {onToggleRTDB && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="rtdb-updates" className="text-xs">
                    RTDB Updates
                  </Label>
                  <Switch
                    id="rtdb-updates"
                    checked={enableRTDB}
                    onCheckedChange={onToggleRTDB}
                    className="scale-75"
                  />
                </div>
              )}

              {onToggleGroupCaching && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="group-caching" className="text-xs">
                    Group Caching
                  </Label>
                  <Switch
                    id="group-caching"
                    checked={enableGroupCaching}
                    onCheckedChange={onToggleGroupCaching}
                    className="scale-75"
                  />
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  )
}

export default DebugWidget
