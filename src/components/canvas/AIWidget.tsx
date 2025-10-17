import React, { useState, useEffect } from 'react'
import { callAITest, type AIResponse, type CanvasCommand, type AIProvider, type GPT5Model } from '../../lib/aiApi'
import type { Rectangle } from '../../types'
import { ContentType, ContentVersion } from '../../types'

interface AIWidgetProps {
  stageScale: number
  stagePosition: { x: number; y: number }
  createShape: (shape: Omit<Rectangle, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
}

const AIWidget: React.FC<AIWidgetProps> = ({
  stageScale,
  stagePosition,
  createShape
}) => {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null)
  const [aiProvider, setAiProvider] = useState<AIProvider>(() => {
    const saved = localStorage.getItem('aiProvider')
    return (saved as AIProvider) || 'openai'
  })
  const [model, setModel] = useState<GPT5Model>(() => {
    const saved = localStorage.getItem('aiModel')
    return (saved as GPT5Model) || 'gpt-5-mini'
  })

  // Save selections to localStorage when they change
  useEffect(() => {
    localStorage.setItem('aiProvider', aiProvider)
  }, [aiProvider])

  useEffect(() => {
    localStorage.setItem('aiModel', model)
  }, [model])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || loading) return

    setLoading(true)
    setError(null)
    setLastResponse(null)

    try {
      const response = await callAITest(prompt.trim(), aiProvider, model)
      setLastResponse(response)
      

      if (response.success && response.data?.commands) {
        await executeCommands(response.data.commands)
      } else {
        setError('No valid commands generated. Please try a different prompt.')
      }
    } catch (err) {
      console.error('AI request failed:', err)
      setError('Failed to generate canvas commands. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const executeCommands = async (commands: CanvasCommand[]) => {
    try {
      for (const command of commands) {
        if (command.action === 'create' && command.type === 'rectangle') {
          // Validate required properties for rectangle creation
          if (
            typeof command.x === 'number' &&
            typeof command.y === 'number' &&
            typeof command.width === 'number' &&
            typeof command.height === 'number' &&
            typeof command.fill === 'string'
          ) {
            // Convert canvas coordinates to viewport coordinates
            const viewportX = command.x * stageScale + stagePosition.x
            const viewportY = command.y * stageScale + stagePosition.y
            const viewportWidth = command.width * stageScale
            const viewportHeight = command.height * stageScale

            // Convert back to canvas coordinates (this ensures proper positioning)
            const canvasX = (viewportX - stagePosition.x) / stageScale
            const canvasY = (viewportY - stagePosition.y) / stageScale
            const canvasWidth = viewportWidth / stageScale
            const canvasHeight = viewportHeight / stageScale

            await createShape({
              type: ContentType.RECTANGLE,
              version: ContentVersion.V2,
              x: canvasX,
              y: canvasY,
              width: canvasWidth,
              height: canvasHeight,
              rotation: command.rotation || 0,
              fill: command.fill,
              createdBy: 'ai' // Mark as created by AI
            })
          } else {
            console.warn('Invalid rectangle command, skipping:', command)
            continue
          }
        } else if (command.action === 'create' && command.type === 'text') {
          // Skip text shapes (these are usually fallback responses with JSON content)
          console.warn('Skipping text shape command (likely fallback response):', command.text?.substring(0, 50))
          continue
        } else {
          console.warn('Unsupported command, skipping:', command.action, command.type)
          continue
        }
      }
    } catch (err) {
      console.error('Error executing commands:', err)
      setError('Failed to create shapes on canvas. Please try again.')
    }
  }

  const handleClear = () => {
    setPrompt('')
    setError(null)
    setLastResponse(null)
  }


  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">🤖 AI Canvas Assistant</h3>
        <p className="text-xs text-gray-600 mb-3">
          Describe what you want to create and the AI will generate it on the canvas.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* AI Provider Toggle */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            AI Provider:
          </label>
          <div className="flex space-x-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="aiProvider"
                value="openai"
                checked={aiProvider === 'openai'}
                onChange={(e) => setAiProvider(e.target.value as AIProvider)}
                className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                disabled={loading}
              />
              <span className="ml-1 text-xs text-gray-700">OpenAI</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="aiProvider"
                value="replicate"
                checked={aiProvider === 'replicate'}
                onChange={(e) => setAiProvider(e.target.value as AIProvider)}
                className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300"
                disabled={loading}
              />
              <span className="ml-1 text-xs text-gray-700">Replicate</span>
            </label>
          </div>
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Model:
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as GPT5Model)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          >
            <option value="gpt-5">GPT-5</option>
            <option value="gpt-5-mini">GPT-5 Mini</option>
            <option value="gpt-5-nano">GPT-5 Nano</option>
          </select>
        </div>

        <div>
          <label htmlFor="ai-prompt" className="block text-xs font-medium text-gray-700 mb-1">
            Describe your shape:
          </label>
          <textarea
            id="ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Create a red rectangle 100px x 200px at position 30, 30..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
            disabled={loading}
          />
        </div>

        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Create Shape'}
          </button>
          
          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            className="px-3 py-2 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </form>


      {/* Loading State */}
      {loading && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-blue-700">Generating canvas commands...</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <svg className="h-4 w-4 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Success Response */}
      {lastResponse && lastResponse.success && !error && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center mb-2">
            <svg className="h-4 w-4 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium text-green-800">Success!</span>
          </div>
          <p className="text-sm text-green-700">{lastResponse.data?.message}</p>
          {lastResponse.data?.commands && lastResponse.data.commands.length > 0 && (
            <div className="mt-2 text-xs text-green-600">
              Created {lastResponse.data.commands.length} shape(s)
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AIWidget
