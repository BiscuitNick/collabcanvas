import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { 
  Square, 
  Circle, 
  Hand, 
  MousePointer2, 
  ImagePlus,
  Lightbulb,
  ChevronDown,
  Bug,
  Shapes,
  Trash2
} from 'lucide-react'
import ShapeCreationForm from './ShapeCreationForm'
import { ShapeType } from '../../types'

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
  onOpenAIAgent: () => void
  selectedTool: 'select' | 'rectangle' | 'circle' | 'image' | 'ai' | 'pan' | null
  onToolSelect: (tool: 'select' | 'rectangle' | 'circle' | 'image' | 'ai' | 'pan' | null) => void
  debugMode: boolean
  onToggleDebug: () => void
  onResetCanvas: () => void
}

type ToolType = 'pan' | 'select' | 'shapes' | 'ai'

const BottomToolbar: React.FC<BottomToolbarProps> = ({
  onCreateShapeWithOptions,
  onOpenAIAgent,
  onToolSelect,
  debugMode,
  onToggleDebug,
  onResetCanvas
}) => {
  
  // Local state for toolbar
  const [activeTool, setActiveTool] = useState<ToolType>('select')
  const [selectedShape, setSelectedShape] = useState<ShapeType>('rectangle')

  // Persist tool selection in localStorage
  useEffect(() => {
    const savedTool = localStorage.getItem('collabcanvas-active-tool') as ToolType
    if (savedTool) {
      setActiveTool(savedTool)
      onToolSelect(savedTool === 'shapes' ? 'rectangle' : savedTool)
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
    { id: 'select' as ToolType, label: 'Selection Tool', icon: MousePointer2, description: 'Select and move objects' },
    { id: 'shapes' as ToolType, label: 'Shapes Tool', icon: Shapes, description: 'Create shapes' },
    { id: 'ai' as ToolType, label: 'AI Tool', icon: ImagePlus, description: 'Open AI assistant' }
  ]

  const shapes = [
    { type: 'rectangle' as ShapeType, label: 'Rectangle', icon: Square },
    { type: 'circle' as ShapeType, label: 'Circle', icon: Circle }
  ]

  const handleToolSelect = (tool: ToolType) => {
    setActiveTool(tool)
    localStorage.setItem('collabcanvas-active-tool', tool)
    
    // Map internal tool types to external tool types
    if (tool === 'shapes') {
      onToolSelect(selectedShape)
    } else if (tool === 'ai') {
      onToolSelect('ai')
      onOpenAIAgent()
    } else if (tool === 'pan') {
      onToolSelect('pan')
    } else {
      onToolSelect(tool)
    }
  }

  const handleShapeSelect = (shape: ShapeType) => {
    setSelectedShape(shape)
    localStorage.setItem('collabcanvas-selected-shape', shape)
    // Update the tool selection to the new shape type
    onToolSelect(shape)
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
      case 'select':
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
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleDebug}
              className={`h-8 w-8 p-0 ${debugMode ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Bug className="h-4 w-4" />
            </Button>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg px-4 py-2 flex items-center space-x-4">
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
  )
}

export default BottomToolbar