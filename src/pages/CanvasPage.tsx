import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import Layout from '../components/layout/Layout'
import Canvas from '../components/canvas/Canvas'
import CanvasControls from '../components/canvas/CanvasControls'

export const CanvasPage: React.FC = () => {
  const { loading } = useAuth()
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  // Calculate canvas size based on viewport
  useEffect(() => {
    const updateCanvasSize = () => {
      const padding = 40 // 20px padding on each side
      setCanvasSize({
        width: window.innerWidth - padding,
        height: window.innerHeight - 200 // Account for header and controls
      })
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <CanvasControls />
      <div className="flex-1 p-5">
        <Canvas
          width={canvasSize.width}
          height={canvasSize.height}
        />
      </div>
    </Layout>
  )
}
