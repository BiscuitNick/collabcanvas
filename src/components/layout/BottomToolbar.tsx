import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import {
  Square,
  Circle,
  Hand,
  ImagePlus,
  Lightbulb,
  ChevronDown,
  Shapes,
  Trash2,
  Type,
  Bot,
  Grid3X3,
  Copy
} from 'lucide-react'
import ShapeCreationForm from './ShapeCreationForm'
import TextToolbar from './TextToolbar'
import { ShapeType, FontFamily, FontStyle, ContentType, ContentVersion } from '../../types'
import type { Content } from '../../types'
import { buildGrid } from '../../lib/utils'
import { useCanvasStore } from '../../store/canvasStore'
import { useAuth } from '../../hooks/useAuth'

interface BottomToolbarProps {
  onCreateShape: (type: 'rectangle' | 'circle' | 'image') => void
  onCreateShapeWithOptions: (options: {
    type: 'rectangle' | 'circle' | 'image'
    width?: number
    height?: number
    radius?: number
    fill: string
    stroke: string
    strokeWidth: number
  }) => void
  onCreateContent?: (contentData: Omit<Content, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  onCreateContentBatch?: (contentDataArray: Omit<Content, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>
  onUpdateContent?: (id: string, updates: Partial<Content>) => Promise<void>
  onUpdateContentBatch?: (updatesList: Array<{ id: string; updates: Partial<Content> }>) => Promise<void>
  onTextOptionsChange?: (options: {
    text: string
    fontSize: number
    fontFamily: FontFamily
    fontStyle: FontStyle
  }) => void
  onCreateText?: () => void
  onOpenAIAgent: () => void
  selectedTool: 'select' | 'rectangle' | 'circle' | 'text' | 'image' | 'ai' | 'pan' | 'agent' | 'grid' | null
  onToolSelect: (tool: 'select' | 'rectangle' | 'circle' | 'text' | 'image' | 'ai' | 'pan' | 'agent' | 'grid' | null) => void
  onResetCanvas: () => void
  onCopyContent?: (content: Content) => void
  onDeleteContent?: (id: string) => void
  canEdit?: boolean
  canvasViewport?: {
    position: { x: number; y: number }
    scale: number
    width: number
    height: number
  }
  onGridPositionClick?: (handler: (x: number, y: number) => void) => void
  onPanToContent?: (x: number, y: number) => void
  onPanAndZoomToContent?: (x: number, y: number, width: number, height: number) => void
}

type ToolType = 'pan' | 'shapes' | 'text' | 'ai' | 'agent' | 'grid' | 'reset'

const BottomToolbar: React.FC<BottomToolbarProps> = ({
  onCreateShapeWithOptions,
  onCreateContent,
  onCreateContentBatch,
  onTextOptionsChange,
  // onCreateText is not used yet but reserved for future use
  onOpenAIAgent,
  onToolSelect,
  onResetCanvas,
  onCopyContent,
  onDeleteContent,
  canEdit = true,
  canvasViewport,
  onGridPositionClick
}) => {

  // Get selected content from canvas store
  const { selectedContentId, content } = useCanvasStore()
  const selectedContent = content.find(c => c.id === selectedContentId)

  // Get current user for createdBy field
  const { user } = useAuth()

  // Local state for toolbar
  const [activeTool, setActiveTool] = useState<ToolType>('pan')
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [selectedShape, setSelectedShape] = useState<ShapeType>('rectangle')
  const [textInput, setTextInput] = useState('')

  // Grid tool state
  const [gridStartX, setGridStartX] = useState(0)
  const [gridStartY, setGridStartY] = useState(0)
  const [gridRows, setGridRows] = useState(5)
  const [gridCols, setGridCols] = useState(5)
  const [gridCellWidth, setGridCellWidth] = useState(100)
  const [gridCellHeight, setGridCellHeight] = useState(100)
  const [gridGap, setGridGap] = useState(10)
  const [gridColorMode, setGridColorMode] = useState<'random' | 'palette'>('random')
  const [gridCustomColors, setGridCustomColors] = useState<string[]>(['#FF6B6B', '#4ECDC4', '#45B7D1'])

  // Track previous tool to detect when switching TO grid tool
  const prevToolRef = useRef<ToolType | null>(null)

  // Set initial grid position to canvas viewport center ONLY when grid tool is first selected
  useEffect(() => {
    // Only set position when transitioning TO grid from another tool
    if (activeTool === 'grid' && prevToolRef.current !== 'grid' && canvasViewport) {
      // Calculate the center of the viewport in canvas coordinates
      // The viewport center in screen coordinates is (width/2, height/2)
      // Convert to canvas coordinates by accounting for stage position and scale
      const centerX = Math.round((-canvasViewport.position.x + canvasViewport.width / 2) / canvasViewport.scale)
      const centerY = Math.round((-canvasViewport.position.y + canvasViewport.height / 2) / canvasViewport.scale)

      setGridStartX(centerX)
      setGridStartY(centerY)
    }

    // Update the previous tool reference
    prevToolRef.current = activeTool
  }, [activeTool, canvasViewport])

  // Handle grid position update when canvas is clicked
  const handleGridPositionUpdate = useCallback((x: number, y: number) => {
    // Only update if grid tool is currently active
    if (activeTool !== 'grid') return

    setGridStartX(Math.round(x))
    setGridStartY(Math.round(y))
  }, [activeTool])

  // Expose grid position update handler to parent via callback prop
  useEffect(() => {
    if (onGridPositionClick) {
      onGridPositionClick(handleGridPositionUpdate)
    }
  }, [onGridPositionClick, handleGridPositionUpdate])

  // Handle grid generation
  const handleGenerateGrid = async () => {
    if (!onCreateContentBatch && !onCreateContent) return

    const colors = gridColorMode === 'random' ? 'random' : gridCustomColors
    const commands = buildGrid({
      startX: gridStartX,
      startY: gridStartY,
      rows: gridRows,
      cols: gridCols,
      cellWidth: gridCellWidth,
      cellHeight: gridCellHeight,
      gap: gridGap,
      colors
    })

    console.log('[GRID] Commands from buildGrid:', commands.length, 'gridStart:', gridStartX, gridStartY)

    // Convert commands to nested content items for the group
    const baseTimestamp = Date.now()
    const nestedItems = commands
      .filter(command => command.type === 'rectangle')
      .map((command, index) => {
        // Use same ID convention as top-level content: {type}-{timestamp}-{random}
        const timestamp = baseTimestamp + index
        const randomSuffix = Math.random().toString(36).substr(2, 9)
        const id = `rectangle-${timestamp}-${randomSuffix}`

        // Positions inside the group are relative to (0,0) which is the top-left
        // Since nested rects also use offsets to center, we adjust accordingly
        const relativeX = (command.x || 0) - gridStartX + (command.width || gridCellWidth) / 2
        const relativeY = (command.y || 0) - gridStartY + (command.height || gridCellHeight) / 2

        return {
          id,
          content: {
            id,
            type: ContentType.RECTANGLE,
            version: ContentVersion.V2,
            x: relativeX,
            y: relativeY,
            width: command.width || 100,
            height: command.height || 100,
            fill: command.fill || '#000000',
            stroke: command.stroke || '#000000',
            strokeWidth: command.strokeWidth || 1,
            rotation: 0,
            createdBy: 'system',
            createdAt: 0, // Will be set by Firestore
            updatedAt: 0  // Will be set by Firestore
          }
        }
      })

    // Calculate group dimensions based on grid
    const totalWidth = gridCols * gridCellWidth + (gridCols - 1) * gridGap
    const totalHeight = gridRows * gridCellHeight + (gridRows - 1) * gridGap

    console.log('[GRID] Group dimensions:', totalWidth, 'x', totalHeight)
    console.log('[GRID] Nested items:', nestedItems.length)
    console.log('[GRID] First nested item:', nestedItems[0])

    // Create a group containing all the grid items
    const groupData = {
      type: ContentType.GROUP,
      version: ContentVersion.V2,
      x: gridStartX + totalWidth / 2, // Center of the group
      y: gridStartY + totalHeight / 2, // Center of the group
      width: totalWidth,
      height: totalHeight,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      createdBy: user?.uid || 'anonymous',
      contentIds: nestedItems.map(item => item.id),
      contentData: Object.fromEntries(
        nestedItems.map(item => [item.id, item.content])
      )
    } as any

    // Create the group
    console.log(`🚀 [GRID] Creating group at (${groupData.x}, ${groupData.y}) with ${nestedItems.length} items`, groupData)
    await onCreateContent!(groupData)
    console.log('✅ [GRID] Group creation completed')
  }

  // Persist tool selection in localStorage
  useEffect(() => {
    const savedTool = localStorage.getItem('collabcanvas-active-tool') as ToolType
    if (savedTool) {
      setActiveTool(savedTool)
      // Map tool types when calling onToolSelect
      if (savedTool === 'shapes') {
        onToolSelect('rectangle')
      } else if (savedTool === 'grid') {
        onToolSelect('grid')
      } else {
        onToolSelect(savedTool as any)
      }
    }
  }, [onToolSelect])

  // Persist shape selection in localStorage
  useEffect(() => {
    const savedShape = localStorage.getItem('collabcanvas-selected-shape') as ShapeType
    if (savedShape) {
      setSelectedShape(savedShape)
    }
  }, [])

  const tools = [
    { id: 'pan' as ToolType, label: 'Hand Tool', icon: Hand, description: 'Pan around the canvas' },
    { id: 'shapes' as ToolType, label: 'Shapes Tool', icon: Shapes, description: 'Create shapes' },
    { id: 'text' as ToolType, label: 'Text Tool', icon: Type, description: 'Create text' },
    { id: 'grid' as ToolType, label: 'Grid Tool', icon: Grid3X3, description: 'Create grid' },
    { id: 'agent' as ToolType, label: 'Agent Tool', icon: Bot, description: 'AI agent' },
    { id: 'reset' as ToolType, label: 'Reset Canvas', icon: Trash2, description: 'Clear all content' }
  ]

  const shapes = [
    { type: 'rectangle' as ShapeType, label: 'Rectangle', icon: Square },
    { type: 'circle' as ShapeType, label: 'Circle', icon: Circle }
  ]

  const handleToolSelect = (tool: ToolType) => {
    // Special handling for reset tool - show dialog instead of selecting
    if (tool === 'reset') {
      setShowResetDialog(true)
      return
    }

    setActiveTool(tool)
    localStorage.setItem('collabcanvas-active-tool', tool)

    // Map internal tool types to external tool types
    if (tool === 'shapes') {
      // Filter out 'group' as it's not a creation tool
      const shapeType = selectedShape === 'group' ? 'rectangle' : selectedShape
      onToolSelect(shapeType as any)
    } else if (tool === 'text') {
      onToolSelect('text')
      // Text creation will be triggered by clicking on canvas
    } else if (tool === 'agent') {
      onToolSelect('agent')
      // Agent tool selected
    } else if (tool === 'ai') {
      onToolSelect('ai')
      onOpenAIAgent()
    } else if (tool === 'pan') {
      onToolSelect('pan')
    } else if (tool === 'grid') {
      onToolSelect('grid')
      // Grid tool selected
    } else {
      onToolSelect(tool as any)
    }
  }

  const handleShapeSelect = (shape: ShapeType) => {
    // Filter out 'group' as it's not a creation tool
    if (shape === 'group') return

    setSelectedShape(shape)
    localStorage.setItem('collabcanvas-selected-shape', shape)
    // Update the tool selection to the new shape type
    onToolSelect(shape as any)
  }

  const handleConfirmReset = () => {
    // Call the reset canvas function
    onResetCanvas()
    // Close the dialog
    setShowResetDialog(false)
    // Switch to pan tool
    handleToolSelect('pan')
  }

  const handleCancelReset = () => {
    setShowResetDialog(false)
  }



  const getCurrentTool = () => tools.find(tool => tool.id === activeTool)
  const getCurrentShape = () => shapes.find(shape => shape.type === selectedShape)

  const renderDynamicContent = () => {
    switch (activeTool) {
      case 'shapes': {
        const currentShape = getCurrentShape()
        return (
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  {currentShape && (() => {
                    const Icon = currentShape.icon
                    return <Icon className="h-4 w-4" />
                  })()}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white">
                {shapes.map((shape) => {
                  const Icon = shape.icon
                  return (
                    <DropdownMenuItem
                      key={shape.type}
                      onClick={() => handleShapeSelect(shape.type)}
                      className="flex items-center"
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {shape.label}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            <ShapeCreationForm
              selectedShape={selectedShape}
              onShapeCreate={onCreateShapeWithOptions}
            />
          </div>
        )
      }

      case 'text':
        return (
          <div className="flex items-center space-x-2">
            {onTextOptionsChange && <TextToolbar onTextOptionsChange={onTextOptionsChange} />}
          </div>
        )

      case 'agent':
        // Agent settings now managed in AgentChat widget
        return null

      case 'ai':
        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenAIAgent}
              className="h-8"
            >
              <ImagePlus className="h-4 w-4 mr-1" />
              <Lightbulb className="h-4 w-4 mr-1" />
              AI Assistant
            </Button>
          </div>
        )
      
      case 'pan':
        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedContent && onCopyContent?.(selectedContent)}
              disabled={!selectedContent}
              className="h-8 flex items-center gap-1.5 text-gray-700 disabled:text-gray-400 disabled:border-gray-200"
              title="Copy selected content"
            >
              <Copy className="h-4 w-4" />
              <span className="text-xs">Copy</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedContent && onDeleteContent?.(selectedContent.id)}
              disabled={!selectedContent}
              className="h-8 flex items-center gap-1.5 text-red-600 border-red-200 hover:bg-red-50 disabled:text-gray-400 disabled:border-gray-200"
              title="Delete selected content"
            >
              <Trash2 className="h-4 w-4" />
              <span className="text-xs">Delete</span>
            </Button>
          </div>
        )
      
      case 'grid':
        return (
          <Button
            variant="default"
            size="sm"
            onClick={handleGenerateGrid}
            className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Generate Grid
          </Button>
        )

      default:
        return null
    }
  }

  const handleTextInputChange = (value: string) => {
    setTextInput(value)
    localStorage.setItem('collabcanvas-text-input', value)
    // Notify parent of text change
    if (onTextOptionsChange) {
      const savedOptions = localStorage.getItem('collabcanvas-text-creation')
      const options = savedOptions ? JSON.parse(savedOptions) : {}
      onTextOptionsChange({
        text: value,
        fontSize: options.fontSize || 24,
        fontFamily: options.fontFamily || 'Arial',
        fontStyle: options.fontStyle || 'normal',
      })
    }
  }

  return (
    <>
      {/* Reset Confirmation Dialog */}
      {showResetDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '24px'
        }}>
          <div style={{
            background: '#2a2a2a',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '400px',
            width: '100%',
            border: '1px solid #3a3a3a'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#fff'
            }}>
              Reset Canvas
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#888',
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              Are you sure you want to reset the canvas? This will <strong style={{ color: '#fff' }}>delete all content</strong> and cannot be undone.
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleCancelReset}
                style={{
                  padding: '10px 20px',
                  background: '#3a3a3a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#4a4a4a'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#3a3a3a'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                style={{
                  padding: '10px 20px',
                  background: '#ff6b6b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ff5555'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ff6b6b'
                }}
              >
                Reset Canvas
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center">
        {/* View-Only Mode Notice */}
        {!canEdit && (
        <div className="mb-2 bg-amber-50 border border-amber-300 text-amber-800 rounded-lg shadow-lg px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">📖 View-Only Mode</span>
            <span className="text-xs">You can view updates but cannot edit this canvas</span>
          </div>
        </div>
      )}

      {/* Text Input Field - Appears above toolbar when text tool is active */}
      {canEdit && activeTool === 'text' && (
        <div className="mb-2 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg px-4 py-2">
          <Input
            type="text"
            value={textInput}
            onChange={(e) => handleTextInputChange(e.target.value)}
            placeholder="Enter text..."
            className="h-8 w-64 text-sm"
          />
        </div>
      )}

      {/* Grid Input Field - Appears above toolbar when grid tool is active */}
      {activeTool === 'grid' && (() => {
        const handleAddColor = () => {
          if (gridCustomColors.length < 5) {
            setGridCustomColors([...gridCustomColors, '#000000'])
          }
        }

        const handleRemoveColor = (index: number) => {
          setGridCustomColors(gridCustomColors.filter((_, i) => i !== index))
        }

        const handleColorChange = (index: number, color: string) => {
          const newColors = [...gridCustomColors]
          newColors[index] = color
          setGridCustomColors(newColors)
        }

        return (
          <div className="mb-2 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg px-3 py-2.5 space-y-2">
            {/* Row 1: Position and Grid */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 w-12">Position</span>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    value={gridStartX}
                    onChange={(e) => setGridStartX(parseInt(e.target.value) || 0)}
                    className="h-7 w-20 text-xs"
                    placeholder="X"
                  />
                  <Input
                    type="number"
                    value={gridStartY}
                    onChange={(e) => setGridStartY(parseInt(e.target.value) || 0)}
                    className="h-7 w-20 text-xs"
                    placeholder="Y"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 w-12">Grid</span>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min="1"
                    max="64"
                    value={gridRows}
                    onChange={(e) => setGridRows(Math.min(64, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="h-7 w-16 text-xs"
                    placeholder="Rows"
                  />
                  <span className="text-xs text-gray-400">×</span>
                  <Input
                    type="number"
                    min="1"
                    max="64"
                    value={gridCols}
                    onChange={(e) => setGridCols(Math.min(64, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="h-7 w-16 text-xs"
                    placeholder="Cols"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Cell Size and Gap */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 w-12">Cell</span>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min="10"
                    max="1000"
                    value={gridCellWidth}
                    onChange={(e) => setGridCellWidth(Math.min(1000, Math.max(10, parseInt(e.target.value) || 10)))}
                    className="h-7 w-20 text-xs"
                    placeholder="Width"
                  />
                  <span className="text-xs text-gray-400">×</span>
                  <Input
                    type="number"
                    min="10"
                    max="1000"
                    value={gridCellHeight}
                    onChange={(e) => setGridCellHeight(Math.min(1000, Math.max(10, parseInt(e.target.value) || 10)))}
                    className="h-7 w-20 text-xs"
                    placeholder="Height"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 w-12">Gap</span>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={gridGap}
                  onChange={(e) => setGridGap(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="h-7 w-20 text-xs"
                  placeholder="Gap"
                />
              </div>
            </div>

            {/* Row 3: Color Mode and Palette */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 w-12">Color</span>
                <Select value={gridColorMode} onValueChange={(value: any) => setGridColorMode(value)}>
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="random">Random</SelectItem>
                    <SelectItem value="palette">Palette</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {gridColorMode === 'palette' && (
                <div className="flex items-center gap-1.5">
                  {gridCustomColors.map((color, index) => (
                    <div key={index} className="relative group">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => handleColorChange(index, e.target.value)}
                        className="h-7 w-7 border border-gray-300 rounded cursor-pointer"
                        title={color}
                      />
                      <button
                        onClick={() => handleRemoveColor(index)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {gridCustomColors.length < 5 && (
                    <Button
                      onClick={handleAddColor}
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0 text-xs"
                      title="Add color"
                    >
                      +
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* Main Toolbar - Only show for users with edit permission */}
      {canEdit && (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg px-4 py-2 flex items-center space-x-4">
          {/* Left Tool Selection Dropdown */}
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  {getCurrentTool() && (() => {
                    const Icon = getCurrentTool()!.icon
                    return <Icon className="h-4 w-4" />
                  })()}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white">
                {tools.map((tool) => {
                  const Icon = tool.icon
                  return (
                    <DropdownMenuItem
                      key={tool.id}
                      onClick={() => handleToolSelect(tool.id)}
                      className="flex items-center"
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {tool.label}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right Dynamic Content */}
          <div className="flex items-center">
            {renderDynamicContent()}
          </div>
        </div>
      )}
      </div>
    </>
  )
}

export default BottomToolbar