import { describe, it, expect } from 'vitest'
import {
  ShapeType,
  ShapeVersion,
  CursorContext,
  isRectangle,
  isCircle,
  type Rectangle,
  type Circle,
  type Shape
} from './index'

describe('Shape Types', () => {
  describe('ShapeType enum', () => {
    it('should have correct values', () => {
      expect(ShapeType.RECTANGLE).toBe('rectangle')
      expect(ShapeType.CIRCLE).toBe('circle')
    })
  })

  describe('ShapeVersion enum', () => {
    it('should have correct values', () => {
      expect(ShapeVersion.V1).toBe('v1')
      expect(ShapeVersion.V2).toBe('v2')
    })
  })


  describe('CursorContext enum', () => {
    it('should have correct values', () => {
      expect(CursorContext.DEFAULT).toBe('default')
      expect(CursorContext.GRAB).toBe('grab')
      expect(CursorContext.POINTER).toBe('pointer')
      expect(CursorContext.TEXT).toBe('text')
      expect(CursorContext.CROSSHAIR).toBe('crosshair')
    })
  })
})

describe('Shape Type Guards', () => {
  const mockRectangle: Rectangle = {
    id: 'rect-1',
    type: ShapeType.RECTANGLE,
    version: ShapeVersion.V2,
    x: 100,
    y: 100,
    width: 200,
    height: 150,
    rotation: 0,
    fill: '#ff0000',
    createdBy: 'user-1',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  const mockCircle: Circle = {
    id: 'circle-1',
    type: ShapeType.CIRCLE,
    version: ShapeVersion.V2,
    x: 200,
    y: 200,
    radius: 50,
    fill: '#00ff00',
    createdBy: 'user-1',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }


  describe('isRectangle', () => {
    it('should return true for rectangle shapes', () => {
      expect(isRectangle(mockRectangle)).toBe(true)
    })

    it('should return false for non-rectangle shapes', () => {
      expect(isRectangle(mockCircle)).toBe(false)
    })
  })

  describe('isCircle', () => {
    it('should return true for circle shapes', () => {
      expect(isCircle(mockCircle)).toBe(true)
    })

    it('should return false for non-circle shapes', () => {
      expect(isCircle(mockRectangle)).toBe(false)
    })
  })

})

describe('Shape Creation', () => {
  it('should create a valid rectangle shape', () => {
    const rectangle: Rectangle = {
      id: 'test-rect',
      type: ShapeType.RECTANGLE,
      version: ShapeVersion.V2,
      x: 0,
      y: 0,
      width: 100,
      height: 80,
      rotation: 0,
      fill: '#ff0000',
      createdBy: 'test-user',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    expect(rectangle.type).toBe(ShapeType.RECTANGLE)
    expect(rectangle.version).toBe(ShapeVersion.V2)
    expect(rectangle.width).toBe(100)
    expect(rectangle.height).toBe(80)
  })

  it('should create a valid circle shape', () => {
    const circle: Circle = {
      id: 'test-circle',
      type: ShapeType.CIRCLE,
      version: ShapeVersion.V2,
      x: 0,
      y: 0,
      radius: 50,
      fill: '#00ff00',
      createdBy: 'test-user',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    expect(circle.type).toBe(ShapeType.CIRCLE)
    expect(circle.version).toBe(ShapeVersion.V2)
    expect(circle.radius).toBe(50)
  })

})

describe('Shape Union Type', () => {
  it('should accept all shape types', () => {
    const shapes: Shape[] = [
      {
        id: 'rect-1',
        type: ShapeType.RECTANGLE,
        version: ShapeVersion.V2,
        x: 0,
        y: 0,
        width: 100,
        height: 80,
        rotation: 0,
        fill: '#ff0000',
        createdBy: 'user-1',
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'circle-1',
        type: ShapeType.CIRCLE,
        version: ShapeVersion.V2,
        x: 0,
        y: 0,
        radius: 50,
        fill: '#00ff00',
        createdBy: 'user-1',
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
    ]

    expect(shapes).toHaveLength(2)
    expect(shapes[0].type).toBe(ShapeType.RECTANGLE)
    expect(shapes[1].type).toBe(ShapeType.CIRCLE)
  })
})

