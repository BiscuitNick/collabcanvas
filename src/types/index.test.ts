import { describe, it, expect } from 'vitest'
import {
  ShapeType,
  ShapeVersion,
  FontFamily,
  FontStyle,
  TextAlign,
  VerticalAlign,
  CursorContext,
  isRectangle,
  isCircle,
  isText,
  type Rectangle,
  type Circle,
  type Text,
  type Shape
} from './index'

describe('Shape Types', () => {
  describe('ShapeType enum', () => {
    it('should have correct values', () => {
      expect(ShapeType.RECTANGLE).toBe('rectangle')
      expect(ShapeType.CIRCLE).toBe('circle')
      expect(ShapeType.TEXT).toBe('text')
    })
  })

  describe('ShapeVersion enum', () => {
    it('should have correct values', () => {
      expect(ShapeVersion.V1).toBe('v1')
      expect(ShapeVersion.V2).toBe('v2')
    })
  })

  describe('FontFamily enum', () => {
    it('should have 5 most popular fonts', () => {
      expect(FontFamily.ARIAL).toBe('Arial')
      expect(FontFamily.HELVETICA).toBe('Helvetica')
      expect(FontFamily.TIMES_NEW_ROMAN).toBe('Times New Roman')
      expect(FontFamily.GEORGIA).toBe('Georgia')
      expect(FontFamily.VERDANA).toBe('Verdana')
    })
  })

  describe('FontStyle enum', () => {
    it('should have correct values', () => {
      expect(FontStyle.NORMAL).toBe('normal')
      expect(FontStyle.BOLD).toBe('bold')
      expect(FontStyle.ITALIC).toBe('italic')
      expect(FontStyle.BOLD_ITALIC).toBe('bold italic')
    })
  })

  describe('TextAlign enum', () => {
    it('should have correct values', () => {
      expect(TextAlign.LEFT).toBe('left')
      expect(TextAlign.CENTER).toBe('center')
      expect(TextAlign.RIGHT).toBe('right')
      expect(TextAlign.JUSTIFY).toBe('justify')
    })
  })

  describe('VerticalAlign enum', () => {
    it('should have correct values', () => {
      expect(VerticalAlign.TOP).toBe('top')
      expect(VerticalAlign.MIDDLE).toBe('middle')
      expect(VerticalAlign.BOTTOM).toBe('bottom')
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

  const mockText: Text = {
    id: 'text-1',
    type: ShapeType.TEXT,
    version: ShapeVersion.V2,
    x: 300,
    y: 300,
    text: 'Hello World',
    fontSize: 16,
    fontFamily: FontFamily.ARIAL,
    fontStyle: FontStyle.NORMAL,
    fill: '#0000ff',
    width: 200,
    height: 50,
    textAlign: TextAlign.LEFT,
    verticalAlign: VerticalAlign.TOP,
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
      expect(isRectangle(mockText)).toBe(false)
    })
  })

  describe('isCircle', () => {
    it('should return true for circle shapes', () => {
      expect(isCircle(mockCircle)).toBe(true)
    })

    it('should return false for non-circle shapes', () => {
      expect(isCircle(mockRectangle)).toBe(false)
      expect(isCircle(mockText)).toBe(false)
    })
  })

  describe('isText', () => {
    it('should return true for text shapes', () => {
      expect(isText(mockText)).toBe(true)
    })

    it('should return false for non-text shapes', () => {
      expect(isText(mockRectangle)).toBe(false)
      expect(isText(mockCircle)).toBe(false)
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

  it('should create a valid text shape', () => {
    const text: Text = {
      id: 'test-text',
      type: ShapeType.TEXT,
      version: ShapeVersion.V2,
      x: 0,
      y: 0,
      text: 'Test Text',
      fontSize: 16,
      fontFamily: FontFamily.ARIAL,
      fontStyle: FontStyle.NORMAL,
      fill: '#000000',
      width: 100,
      height: 30,
      textAlign: TextAlign.LEFT,
      verticalAlign: VerticalAlign.TOP,
      createdBy: 'test-user',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    expect(text.type).toBe(ShapeType.TEXT)
    expect(text.version).toBe(ShapeVersion.V2)
    expect(text.text).toBe('Test Text')
    expect(text.fontFamily).toBe(FontFamily.ARIAL)
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
      {
        id: 'text-1',
        type: ShapeType.TEXT,
        version: ShapeVersion.V2,
        x: 0,
        y: 0,
        text: 'Hello',
        fontSize: 16,
        fontFamily: FontFamily.ARIAL,
        fontStyle: FontStyle.NORMAL,
        fill: '#000000',
        width: 100,
        height: 30,
        textAlign: TextAlign.LEFT,
        verticalAlign: VerticalAlign.TOP,
        createdBy: 'user-1',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ]

    expect(shapes).toHaveLength(3)
    expect(shapes[0].type).toBe(ShapeType.RECTANGLE)
    expect(shapes[1].type).toBe(ShapeType.CIRCLE)
    expect(shapes[2].type).toBe(ShapeType.TEXT)
  })
})
