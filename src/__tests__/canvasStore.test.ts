import { describe, it, expect, beforeEach } from 'vitest'
import { useCanvasStore } from '../store/canvasStore'

describe('Canvas Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useCanvasStore.setState({
      stagePosition: { x: 0, y: 0 },
      stageScale: 1,
      shapes: [],
      isPanning: false,
      isZooming: false,
      selectedShapeId: null,
    })
  })

  it('should initialize with blank canvas state', () => {
    const state = useCanvasStore.getState()
    expect(state.stagePosition).toEqual({ x: 0, y: 0 })
    expect(state.stageScale).toBe(1)
    expect(state.shapes).toEqual([])
    expect(state.isPanning).toBe(false)
    expect(state.isZooming).toBe(false)
    expect(state.selectedShapeId).toBe(null)
  })

  it('should update stage position', () => {
    useCanvasStore.getState().updatePosition(100, 200)
    const state = useCanvasStore.getState()
    expect(state.stagePosition).toEqual({ x: 100, y: 200 })
  })

  it('should update stage scale', () => {
    useCanvasStore.getState().updateScale(1.5)
    const state = useCanvasStore.getState()
    expect(state.stageScale).toBe(1.5)
  })

  it('should clamp scale within bounds', () => {
    // Too small
    useCanvasStore.getState().updateScale(0.05)
    expect(useCanvasStore.getState().stageScale).toBe(0.1)

    // Too large
    useCanvasStore.getState().updateScale(5)
    expect(useCanvasStore.getState().stageScale).toBe(3)
  })

  it('should add shapes to array', () => {
    const shape = {
      id: '1',
      x: 100,
      y: 100,
      width: 100,
      height: 80,
      rotation: 0,
      fill: '#FF0000',
      createdBy: 'user1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    
    useCanvasStore.getState().addShape(shape)
    const state = useCanvasStore.getState()
    expect(state.shapes).toHaveLength(1)
    expect(state.shapes[0]).toEqual(shape)
  })

  it('should update shapes', () => {
    const shape = {
      id: '1',
      x: 100,
      y: 100,
      width: 100,
      height: 80,
      rotation: 0,
      fill: '#FF0000',
      createdBy: 'user1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    
    useCanvasStore.getState().addShape(shape)
    useCanvasStore.getState().updateShape('1', { x: 200, y: 300 })
    
    const state = useCanvasStore.getState()
    expect(state.shapes[0].x).toBe(200)
    expect(state.shapes[0].y).toBe(300)
    expect(state.shapes[0].width).toBe(100) // Other properties unchanged
  })

  it('should manage interaction states', () => {
    const { setPanning, setZooming } = useCanvasStore.getState()
    
    setPanning(true)
    expect(useCanvasStore.getState().isPanning).toBe(true)
    expect(useCanvasStore.getState().isZooming).toBe(false)
    
    setZooming(true)
    expect(useCanvasStore.getState().isPanning).toBe(true)
    expect(useCanvasStore.getState().isZooming).toBe(true)
    
    setPanning(false)
    expect(useCanvasStore.getState().isPanning).toBe(false)
    expect(useCanvasStore.getState().isZooming).toBe(true)
  })

  it('should select and deselect shapes', () => {
    const { selectShape } = useCanvasStore.getState()
    
    selectShape('shape1')
    expect(useCanvasStore.getState().selectedShapeId).toBe('shape1')
    
    selectShape(null)
    expect(useCanvasStore.getState().selectedShapeId).toBe(null)
  })

  it('should reset view to initial state', () => {
    const { updatePosition, updateScale, selectShape, resetView } = useCanvasStore.getState()
    
    // Modify state
    updatePosition(100, 200)
    updateScale(2)
    selectShape('shape1')
    
    // Reset
    resetView()
    
    const state = useCanvasStore.getState()
    expect(state.stagePosition).toEqual({ x: 0, y: 0 })
    expect(state.stageScale).toBe(1)
    expect(state.selectedShapeId).toBe(null)
  })

  it('should handle multiple shape operations', () => {
    const { addShape, updateShape, selectShape } = useCanvasStore.getState()
    
    const shape1 = {
      id: '1',
      x: 100,
      y: 100,
      width: 100,
      height: 80,
      rotation: 0,
      fill: '#FF0000',
      createdBy: 'user1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    
    const shape2 = {
      id: '2',
      x: 200,
      y: 200,
      width: 150,
      height: 100,
      rotation: 0,
      fill: '#00FF00',
      createdBy: 'user2',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    
    addShape(shape1)
    addShape(shape2)
    
    let state = useCanvasStore.getState()
    expect(state.shapes).toHaveLength(2)
    
    updateShape('1', { x: 300 })
    selectShape('2')
    
    state = useCanvasStore.getState()
    expect(state.shapes[0].x).toBe(300)
    expect(state.selectedShapeId).toBe('2')
  })
})
