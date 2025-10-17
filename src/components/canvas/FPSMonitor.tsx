import React, { useState, useEffect, useRef } from 'react'

interface FPSMonitorProps {
  isEnabled: boolean
  onFPSUpdate?: (fps: number) => void
}

const FPSMonitor: React.FC<FPSMonitorProps> = ({ isEnabled, onFPSUpdate }) => {
  const [fps, setFps] = useState(0)
  const frameCountRef = useRef(0)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const fpsHistoryRef = useRef<number[]>([])
  const lastUpdateTimeRef = useRef(performance.now())

  useEffect(() => {
    if (!isEnabled) {
      setFps(0)
      return
    }

    const measureFPS = () => {
      const now = performance.now()
      frameCountRef.current++

      // Update FPS every 100ms
      if (now - lastUpdateTimeRef.current >= 100) {
        const elapsed = now - lastUpdateTimeRef.current
        const currentFps = (frameCountRef.current * 1000) / elapsed
        
        // Add to rolling history (last 2 seconds = 20 samples at 100ms intervals)
        fpsHistoryRef.current.push(currentFps)
        if (fpsHistoryRef.current.length > 20) {
          fpsHistoryRef.current.shift()
        }
        
        // Calculate rolling average
        const averageFps = fpsHistoryRef.current.reduce((sum, fps) => sum + fps, 0) / fpsHistoryRef.current.length
        
        // Round to 0.1 precision
        const roundedFps = Math.round(averageFps * 10) / 10
        setFps(roundedFps)
        onFPSUpdate?.(roundedFps)
        
        // Reset counters
        frameCountRef.current = 0
        lastUpdateTimeRef.current = now
      }

      animationFrameRef.current = requestAnimationFrame(measureFPS)
    }

    // Start measuring
    animationFrameRef.current = requestAnimationFrame(measureFPS)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isEnabled])

  if (!isEnabled) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg font-mono text-lg font-bold z-50 pointer-events-none">
      {fps.toFixed(1)} FPS
    </div>
  )
}

export default FPSMonitor
