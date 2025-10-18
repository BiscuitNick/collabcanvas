import React, { useState, useEffect } from 'react'
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
  Blocks,
  Grid3X3
} from 'lucide-react'
import ShapeCreationForm from './ShapeCreationForm'
import TextToolbar from './TextToolbar'
import { ShapeType, FontFamily, FontStyle, ContentType, ContentVersion } from '../../types'
import type { Content } from '../../types'
import { callAITest, type AIProvider, type GPT5Model } from '../../lib/aiApi'
import { buildGrid } from '../../lib/utils'
import { useCanvasStore } from '../../store/canvasStore'

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
  onUpdateContent?: (id: string, updates: Partial<Content>) => Promise<void>
  onTextOptionsChange?: (options: {
    text: string
    fontSize: number
    fontFamily: FontFamily
    fontStyle: FontStyle
  }) => void
  onCreateText?: () => void
  onOpenAIAgent: () => void
  selectedTool: 'select' | 'rectangle' | 'circle' | 'text' | 'image' | 'ai' | 'pan' | 'agent' | null
  onToolSelect: (tool: 'select' | 'rectangle' | 'circle' | 'text' | 'image' | 'ai' | 'pan' | 'agent' | null) => void
  onResetCanvas: () => void
}

type ToolType = 'pan' | 'shapes' | 'text' | 'ai' | 'agent' | 'grid'

const BottomToolbar: React.FC<BottomToolbarProps> = ({
  onCreateShapeWithOptions,
  onCreateContent,
  onUpdateContent,
  onTextOptionsChange,
  // onCreateText is not used yet but reserved for future use
  onOpenAIAgent,
  onToolSelect,
  onResetCanvas
}) => {

  // Get selected content from canvas store
  const { selectedContentId, content } = useCanvasStore()
  const selectedContent = content.find(c => c.id === selectedContentId)

  // Local state for toolbar
  const [activeTool, setActiveTool] = useState<ToolType>('pan')
  const [selectedShape, setSelectedShape] = useState<ShapeType>('rectangle')
  const [textInput, setTextInput] = useState('')
  const [agentInput, setAgentInput] = useState('')
  const [selectedAgentOption, setSelectedAgentOption] = useState<'blocks' | 'imageplus'>('blocks')
  const [agentLoading, setAgentLoading] = useState(false)
  const [agentError, setAgentError] = useState<string | null>(null)
  const [aiProvider, setAiProvider] = useState<AIProvider>(() => {
    const saved = localStorage.getItem('collabcanvas-ai-provider')
    return (saved as AIProvider) || 'openai'
  })
  const [aiModel, setAiModel] = useState<GPT5Model>(() => {
    const saved = localStorage.getItem('collabcanvas-ai-model')
    return (saved as GPT5Model) || 'gpt-4o-mini'
  })

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

  // Handle grid generation
  const handleGenerateGrid = async () => {
    if (!onCreateContent) return

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

    // Create each cell as content
    for (const command of commands) {
      if (command.type === 'rectangle') {
        await onCreateContent({
          type: ContentType.RECTANGLE,
          version: ContentVersion.V2,
          x: command.x || 0,
          y: command.y || 0,
          width: command.width || 100,
          height: command.height || 100,
          fill: command.fill || '#000000',
          stroke: command.stroke || '#000000',
          strokeWidth: command.strokeWidth || 1
        } as any)
      }
    }
  }

  // Persist tool selection in localStorage
  useEffect(() => {
    const savedTool = localStorage.getItem('collabcanvas-active-tool') as ToolType
    if (savedTool) {
      setActiveTool(savedTool)
      // Skip onToolSelect for grid tool
      if (savedTool === 'grid') {
        return
      }
      onToolSelect(savedTool === 'shapes' ? 'rectangle' : (savedTool as any))
    }
  }, [onToolSelect])

  // Persist shape selection in localStorage
  useEffect(() => {
    const savedShape = localStorage.getItem('collabcanvas-selected-shape') as ShapeType
    if (savedShape) {
      setSelectedShape(savedShape)
    }
  }, [])

  // Persist AI provider selection
  useEffect(() => {
    localStorage.setItem('collabcanvas-ai-provider', aiProvider)
  }, [aiProvider])

  // Persist AI model selection
  useEffect(() => {
    localStorage.setItem('collabcanvas-ai-model', aiModel)
  }, [aiModel])

  // Handle model compatibility when switching providers
  useEffect(() => {
    // If switching to OpenAI and Meta model is selected, switch to default
    if (aiProvider === 'openai' && aiModel === 'meta/meta-llama-3-8b-instruct') {
      setAiModel('gpt-4o-mini')
    }
  }, [aiProvider, aiModel])

  const tools = [
    { id: 'pan' as ToolType, label: 'Hand Tool', icon: Hand, description: 'Pan around the canvas' },
    { id: 'shapes' as ToolType, label: 'Shapes Tool', icon: Shapes, description: 'Create shapes' },
    { id: 'text' as ToolType, label: 'Text Tool', icon: Type, description: 'Create text' },
    { id: 'grid' as ToolType, label: 'Grid Tool', icon: Grid3X3, description: 'Create grid' },
    { id: 'agent' as ToolType, label: 'Agent Tool', icon: Bot, description: 'AI agent' }
  ]

  const shapes = [
    { type: 'rectangle' as ShapeType, label: 'Rectangle', icon: Square },
    { type: 'circle' as ShapeType, label: 'Circle', icon: Circle }
  ]

  const agentOptions = [
    { type: 'blocks' as const, label: 'Content', icon: Blocks },
    { type: 'imageplus' as const, label: 'Image', icon: ImagePlus }
  ]

  const handleToolSelect = (tool: ToolType) => {
    setActiveTool(tool)
    localStorage.setItem('collabcanvas-active-tool', tool)

    // Grid tool doesn't need to call onToolSelect
    if (tool === 'grid') {
      return
    }

    // Map internal tool types to external tool types
    if (tool === 'shapes') {
      onToolSelect(selectedShape)
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
    } else {
      onToolSelect(tool as any)
    }
  }

  const handleShapeSelect = (shape: ShapeType) => {
    setSelectedShape(shape)
    localStorage.setItem('collabcanvas-selected-shape', shape)
    // Update the tool selection to the new shape type
    onToolSelect(shape)
  }

  const handleAgentGo = async () => {
    if (!agentInput.trim() || agentLoading) return

    // Check if we're editing or creating
    const isEditing = !!selectedContent

    if (!isEditing && !onCreateContent) {
      console.error('[Agent Toolbar] onCreateContent not provided')
      setAgentError('Content creation not available')
      return
    }

    if (isEditing && !onUpdateContent) {
      console.error('[Agent Toolbar] onUpdateContent not provided')
      setAgentError('Content update not available')
      return
    }

    setAgentLoading(true)
    setAgentError(null)

    try {
      console.log('[Agent Toolbar] Sending request with:', {
        provider: aiProvider,
        model: aiModel,
        prompt: agentInput.trim(),
        isEditing,
        selectedContent
      })

      // Call AI backend with the user's prompt and optional selected content
      const response = await callAITest(agentInput.trim(), aiProvider, aiModel, selectedContent)

      console.log('[Agent Toolbar] Received response:', response)

      if (response.success && response.data?.commands) {
        console.log('[Agent Toolbar] Processing', response.data.commands.length, 'commands')

        // Execute each command from the AI
        for (const command of response.data.commands) {
          console.log('[Agent Toolbar] Processing command:', command)

          if (command.action === 'edit') {
            // Handle edit action - update existing content
            if (!selectedContent) {
              console.warn('[Agent Toolbar] Edit action but no content selected')
              continue
            }

            console.log('[Agent Toolbar] Editing content:', selectedContent.id)
            const updates: any = {}

            // Build updates object from command properties
            if (command.x !== undefined) updates.x = command.x
            if (command.y !== undefined) updates.y = command.y
            if (command.width !== undefined) updates.width = command.width
            if (command.height !== undefined) updates.height = command.height
            if (command.radius !== undefined) updates.radius = command.radius
            if (command.fill !== undefined) updates.fill = command.fill
            if (command.stroke !== undefined) updates.stroke = command.stroke
            if (command.strokeWidth !== undefined) updates.strokeWidth = command.strokeWidth
            if (command.rotation !== undefined) updates.rotation = command.rotation
            if (command.text !== undefined) updates.text = command.text
            if (command.fontSize !== undefined) updates.fontSize = command.fontSize
            if (command.fontFamily !== undefined) updates.fontFamily = command.fontFamily
            if (command.fontStyle !== undefined) updates.fontStyle = command.fontStyle

            await onUpdateContent!(selectedContent.id, updates as Partial<Content>)
            console.log('[Agent Toolbar] Content updated successfully')

          } else if (command.action === 'create') {
            if (command.type === 'rectangle') {
              // Validate required properties for rectangle
              if (
                typeof command.x === 'number' &&
                typeof command.y === 'number' &&
                typeof command.width === 'number' &&
                typeof command.height === 'number' &&
                typeof command.fill === 'string'
              ) {
                console.log('[Agent Toolbar] Creating rectangle:', command)
                console.log('[Agent Toolbar] onCreateContent exists?', !!onCreateContent)
                try {
                  await onCreateContent!({
                    type: ContentType.RECTANGLE,
                    version: ContentVersion.V2,
                    x: command.x,
                    y: command.y,
                    width: command.width,
                    height: command.height,
                    rotation: command.rotation || 0,
                    fill: command.fill,
                    stroke: command.stroke || '#000000',
                    strokeWidth: command.strokeWidth || 1
                  } as any)
                  console.log('[Agent Toolbar] onCreateContent call completed')
                } catch (err) {
                  console.error('[Agent Toolbar] Error calling onCreateContent:', err)
                }
              } else {
                console.warn('[Agent Toolbar] Invalid rectangle command properties:', command)
              }
            } else if (command.type === 'circle') {
              // Validate required properties for circle
              if (
                typeof command.x === 'number' &&
                typeof command.y === 'number' &&
                (typeof command.width === 'number' || typeof command.radius === 'number') &&
                typeof command.fill === 'string'
              ) {
                // Calculate radius from width/height or use radius directly
                const radius = command.radius || ((command.width || 0) / 2)
                console.log('[Agent Toolbar] Creating circle:', command)
                try {
                  await onCreateContent!({
                    type: ContentType.CIRCLE,
                    version: ContentVersion.V2,
                    x: command.x,
                    y: command.y,
                    radius: radius,
                    fill: command.fill,
                    stroke: command.stroke || '#000000',
                    strokeWidth: command.strokeWidth || 1
                  } as any)
                  console.log('[Agent Toolbar] Circle created successfully')
                } catch (err) {
                  console.error('[Agent Toolbar] Error creating circle:', err)
                }
              } else {
                console.warn('[Agent Toolbar] Invalid circle command properties:', command)
              }
            } else if (command.type === 'text') {
              // Validate required properties for text
              if (
                typeof command.x === 'number' &&
                typeof command.y === 'number' &&
                typeof command.text === 'string'
              ) {
                console.log('[Agent Toolbar] Creating text:', command)
                try {
                  const textContent: any = {
                    type: ContentType.TEXT,
                    version: ContentVersion.V2,
                    x: command.x,
                    y: command.y,
                    text: command.text,
                    fontSize: command.fontSize || 16,
                    fontFamily: (command.fontFamily as FontFamily) || FontFamily.ARIAL,
                    fontStyle: (command.fontStyle as FontStyle) || FontStyle.NORMAL,
                    fill: command.fill || '#000000'
                  }
                  // Only add width/height if they're defined
                  if (typeof command.width === 'number') textContent.width = command.width
                  if (typeof command.height === 'number') textContent.height = command.height

                  await onCreateContent!(textContent)
                  console.log('[Agent Toolbar] Text created successfully')
                } catch (err) {
                  console.error('[Agent Toolbar] Error creating text:', err)
                }
              } else {
                console.warn('[Agent Toolbar] Invalid text command properties:', command)
              }
            } else {
              console.warn('[Agent Toolbar] Unknown content type:', command.type)
            }
          } else {
            console.warn('[Agent Toolbar] Unknown command action:', command.action)
          }
        }

        // Clear input on success
        setAgentInput('')
        console.log('[Agent Toolbar] Successfully processed all commands')
      } else {
        console.warn('[Agent Toolbar] No valid commands in response:', response)
        setAgentError('No valid commands generated. Try a different prompt.')
      }
    } catch (error) {
      console.error('[Agent Toolbar] Error:', error)
      setAgentError('Failed to process request. Please try again.')
    } finally {
      setAgentLoading(false)
    }
  }


  const getCurrentTool = () => tools.find(tool => tool.id === activeTool)
  const getCurrentShape = () => shapes.find(shape => shape.type === selectedShape)
  const getCurrentAgentOption = () => agentOptions.find(option => option.type === selectedAgentOption)

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

      case 'agent': {
        const currentAgentOption = getCurrentAgentOption()
        return (
          <div className="flex items-center space-x-2">
            {/* Content Type Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  {currentAgentOption && (() => {
                    const Icon = currentAgentOption.icon
                    return <Icon className="h-4 w-4" />
                  })()}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white">
                {agentOptions.map((option) => {
                  const Icon = option.icon
                  const isDisabled = option.type === 'imageplus'
                  return (
                    <DropdownMenuItem
                      key={option.type}
                      onClick={() => !isDisabled && setSelectedAgentOption(option.type)}
                      disabled={isDisabled}
                      className={`flex items-center ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {option.label}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* AI Provider Dropdown */}
            <Select value={aiProvider} onValueChange={(value) => setAiProvider(value as AIProvider)} disabled={agentLoading}>
              <SelectTrigger className="h-8 w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="replicate">Replicate</SelectItem>
              </SelectContent>
            </Select>

            {/* Model Dropdown */}
            <Select value={aiModel} onValueChange={(value) => setAiModel(value as GPT5Model)} disabled={agentLoading}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-5">GPT-5</SelectItem>
                <SelectItem value="gpt-5-mini">GPT-5 Mini</SelectItem>
                <SelectItem value="gpt-5-nano">GPT-5 Nano</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                <SelectItem value="gpt-4.1-nano">GPT-4.1 Nano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )
      }

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
              variant="ghost"
              size="sm"
              onClick={onResetCanvas}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Clear all shapes and reset canvas"
            >
              <Trash2 className="h-4 w-4" />
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

  const handleAgentInputChange = (value: string) => {
    setAgentInput(value)
    localStorage.setItem('collabcanvas-agent-input', value)
    // Clear error when user starts typing
    if (agentError) {
      setAgentError(null)
    }
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center">
      {/* Agent Input Field - Appears above toolbar when agent tool is active */}
      {activeTool === 'agent' && (
        <div className="mb-2 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg px-4 py-2 space-y-2 w-fit">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={agentInput}
              onChange={(e) => handleAgentInputChange(e.target.value)}
              placeholder={selectedContent ? "Edit the selected content..." : "Enter prompt for agent..."}
              className="h-8 text-sm"
              style={{ width: '400px' }}
              disabled={agentLoading}
              onKeyPress={(e) => e.key === 'Enter' && handleAgentGo()}
            />
            <Button
              variant="default"
              size="sm"
              onClick={handleAgentGo}
              disabled={!agentInput.trim() || agentLoading}
              className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {agentLoading ? 'Processing...' : 'Go'}
            </Button>
          </div>
          {agentError && (
            <div className="text-xs text-red-600">
              {agentError}
            </div>
          )}
        </div>
      )}

      {/* Text Input Field - Appears above toolbar when text tool is active */}
      {activeTool === 'text' && (
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
          <div className="mb-2 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg px-4 py-2 space-y-2 w-fit">
            {/* First row: Position and dimensions */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <label className="text-xs text-gray-600">X:</label>
                <input
                  type="number"
                  value={gridStartX}
                  onChange={(e) => setGridStartX(parseInt(e.target.value) || 0)}
                  className="h-7 w-12 text-xs border border-gray-300 rounded px-1"
                />
              </div>
              <div className="flex items-center gap-1">
                <label className="text-xs text-gray-600">Y:</label>
                <input
                  type="number"
                  value={gridStartY}
                  onChange={(e) => setGridStartY(parseInt(e.target.value) || 0)}
                  className="h-7 w-12 text-xs border border-gray-300 rounded px-1"
                />
              </div>
              <div className="flex items-center gap-1">
                <label className="text-xs text-gray-600">Rows:</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={gridRows}
                  onChange={(e) => setGridRows(parseInt(e.target.value) || 5)}
                  className="h-7 w-12 text-xs border border-gray-300 rounded px-1"
                />
              </div>
              <div className="flex items-center gap-1">
                <label className="text-xs text-gray-600">Cols:</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={gridCols}
                  onChange={(e) => setGridCols(parseInt(e.target.value) || 5)}
                  className="h-7 w-12 text-xs border border-gray-300 rounded px-1"
                />
              </div>
            </div>

            {/* Second row: Cell size and gap */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <label className="text-xs text-gray-600">W:</label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  value={gridCellWidth}
                  onChange={(e) => setGridCellWidth(parseInt(e.target.value) || 100)}
                  className="h-7 w-14 text-xs border border-gray-300 rounded px-1"
                />
              </div>
              <div className="flex items-center gap-1">
                <label className="text-xs text-gray-600">H:</label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  value={gridCellHeight}
                  onChange={(e) => setGridCellHeight(parseInt(e.target.value) || 100)}
                  className="h-7 w-14 text-xs border border-gray-300 rounded px-1"
                />
              </div>
              <div className="flex items-center gap-1">
                <label className="text-xs text-gray-600">Gap:</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={gridGap}
                  onChange={(e) => setGridGap(parseInt(e.target.value) || 10)}
                  className="h-7 w-12 text-xs border border-gray-300 rounded px-1"
                />
              </div>
              <Select value={gridColorMode} onValueChange={(value: any) => setGridColorMode(value)}>
                <SelectTrigger className="h-7 w-24 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="random">Random</SelectItem>
                  <SelectItem value="palette">Palette</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Third row: Custom colors (only if palette mode) */}
            {gridColorMode === 'palette' && (
              <div className="flex items-center gap-1 flex-wrap">
                <label className="text-xs text-gray-600 w-full">Colors ({gridCustomColors.length}/5):</label>
                {gridCustomColors.map((color, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => handleColorChange(index, e.target.value)}
                      className="h-7 w-8 border border-gray-300 rounded cursor-pointer"
                    />
                    <button
                      onClick={() => handleRemoveColor(index)}
                      className="px-1 py-0 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      -
                    </button>
                  </div>
                ))}
                {gridCustomColors.length < 5 && (
                  <button
                    onClick={handleAddColor}
                    className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    + Add
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })()}

      {/* Main Toolbar */}
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
    </div>
  )
}

export default BottomToolbar