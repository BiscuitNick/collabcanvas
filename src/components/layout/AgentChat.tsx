import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Loader2, Send, Sparkles, User } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: Date
}

interface AgentChatProps {
  onSubmit: (message: string) => Promise<void>
  isLoading: boolean
  error: string | null
  mode: 'content' | 'image'
  hasSelectedContent: boolean
  onModeChange: (mode: 'content' | 'image') => void
  // Model settings
  aiModel: string
  onAiModelChange: (model: string) => void
  imageModel: string
  onImageModelChange: (model: string) => void
}

export interface AgentChatRef {
  addAgentMessage: (content: string) => void
  addModeChangeMessage: (mode: 'content' | 'image', hasSelection: boolean) => void
}

export const AgentChat = forwardRef<AgentChatRef, AgentChatProps>(({
  onSubmit,
  isLoading,
  error,
  mode,
  hasSelectedContent,
  onModeChange,
  aiModel,
  onAiModelChange,
  imageModel,
  onImageModelChange
}, ref) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    // Add user message to chat
    setMessages(prev => [...prev, userMessage])
    const userInput = input.trim()
    setInput('')

    try {
      // Call the onSubmit handler
      await onSubmit(userInput)
    } catch (err) {
      console.error('Error submitting message:', err)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleUserMessageClick = (message: ChatMessage) => {
    if (message.role === 'user') {
      setInput(message.content)
    }
  }

  // Expose methods to add agent messages
  useImperativeHandle(ref, () => ({
    addAgentMessage: (content: string) => {
      const agentMessage: ChatMessage = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, agentMessage])
    },
    addModeChangeMessage: (newMode: 'content' | 'image', hasSelection: boolean) => {
      let message = ''
      if (newMode === 'image') {
        message = hasSelection ? '📸 Now in image edit mode' : '📸 Now in image creation mode'
      } else {
        message = hasSelection ? '✏️ Now in content edit mode' : '✨ Now in content creation mode'
      }

      const agentMessage: ChatMessage = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content: message,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, agentMessage])
    }
  }))

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">
            {mode === 'image' ? 'AI Image Agent' : 'AI Content Agent'}
          </h3>
        </div>
        <div className={`px-2 py-1 text-xs font-medium rounded ${
          mode === 'image'
            ? 'bg-purple-100 text-purple-700'
            : 'bg-blue-100 text-blue-700'
        }`}>
          {mode === 'image' ? 'Image Mode' : 'Content Mode'}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{ maxHeight: 'calc(50vh - 200px)' }}
      >
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>Start a conversation with the AI agent</p>
            <p className="text-xs mt-1">Ask it to create shapes, edit content, or generate designs</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'agent' && (
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700 transition-colors'
                  : 'bg-gray-100 text-gray-900'
              }`}
              onClick={() => handleUserMessageClick(message)}
            >
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
              <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {message.role === 'user' && (
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                <User className="w-3 h-3 text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Settings - Mode and Model Selection */}
      <div className="border-t border-gray-200 px-3 py-2 bg-gray-50">
        <div className="flex items-center gap-2">
          <Select value={mode} onValueChange={onModeChange}>
            <SelectTrigger className="h-7 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="content">Content</SelectItem>
              <SelectItem value="image">Image</SelectItem>
            </SelectContent>
          </Select>

          {mode === 'content' ? (
            <Select value={aiModel} onValueChange={onAiModelChange}>
              <SelectTrigger className="h-7 flex-1 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="gpt-5">GPT-5</SelectItem>
                <SelectItem value="gpt-5-mini">GPT-5 Mini</SelectItem>
                <SelectItem value="gpt-5-nano">GPT-5 Nano</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                <SelectItem value="gpt-4.1-nano">GPT-4.1 Nano</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Select value={imageModel} onValueChange={onImageModelChange}>
              <SelectTrigger className="h-7 flex-1 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="seedream-4">Seedream 4</SelectItem>
                <SelectItem value="nano-banana">Nano Banana</SelectItem>
                <SelectItem value="flux-kontext-pro">Flux Kontext Pro</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              mode === 'image'
                ? hasSelectedContent
                  ? "Edit the selected image..."
                  : "Create an image..."
                : hasSelectedContent
                  ? "Edit the selected content..."
                  : "Create shapes, text, or grids..."
            }
            className="flex-1 text-sm"
            disabled={isLoading}
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Click your previous messages to reuse them
        </p>
      </div>
    </div>
  )
})
