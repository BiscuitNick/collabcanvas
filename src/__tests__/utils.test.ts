import { describe, it, expect } from 'vitest'
import { generateId, getRandomColor, getUserColor, clamp, getViewportCenter } from '../lib/utils'

describe('Utils', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      
      expect(id1).toBeDefined()
      expect(id2).toBeDefined()
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
      expect(typeof id2).toBe('string')
    })

    it('should return string type', () => {
      const id = generateId()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })
  })

  describe('getRandomColor', () => {
    it('should return valid hex color', () => {
      const color = getRandomColor()
      expect(color).toMatch(/^#[0-9A-F]{6}$/i)
    })

    it('should return color from predefined palette', () => {
      const validColors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
        '#F8C471', '#82E0AA'
      ]
      
      // Test multiple times to ensure it returns from palette
      for (let i = 0; i < 10; i++) {
        const color = getRandomColor()
        expect(validColors).toContain(color)
      }
    })
  })

  describe('getUserColor', () => {
    it('should return consistent color for same userId', () => {
      const userId = 'test-user-123'
      const color1 = getUserColor(userId)
      const color2 = getUserColor(userId)
      
      expect(color1).toBe(color2)
      expect(color1).toMatch(/^#[0-9A-F]{6}$/i)
    })

    it('should return different colors for different userIds', () => {
      const color1 = getUserColor('user1')
      const color2 = getUserColor('user2')
      
      expect(color1).not.toBe(color2)
      expect(color1).toMatch(/^#[0-9A-F]{6}$/i)
      expect(color2).toMatch(/^#[0-9A-F]{6}$/i)
    })

    it('should handle empty string', () => {
      const color = getUserColor('')
      expect(color).toMatch(/^#[0-9A-F]{6}$/i)
    })

    it('should handle special characters', () => {
      const color = getUserColor('user@example.com')
      expect(color).toMatch(/^#[0-9A-F]{6}$/i)
    })
  })

  describe('clamp', () => {
    it('should clamp value within bounds', () => {
      expect(clamp(5, 0, 10)).toBe(5)
      expect(clamp(-5, 0, 10)).toBe(0)
      expect(clamp(15, 0, 10)).toBe(10)
    })

    it('should handle edge cases', () => {
      expect(clamp(0, 0, 10)).toBe(0)
      expect(clamp(10, 0, 10)).toBe(10)
    })

    it('should work with negative bounds', () => {
      expect(clamp(-5, -10, 10)).toBe(-5)
      expect(clamp(-15, -10, 10)).toBe(-10)
      expect(clamp(15, -10, 10)).toBe(10)
    })
  })

  describe('getViewportCenter', () => {
    it('should calculate viewport center correctly', () => {
      const stagePosition = { x: -100, y: -50 }
      const stageScale = 1
      const viewportWidth = 800
      const viewportHeight = 600

      const center = getViewportCenter(stagePosition, stageScale, viewportWidth, viewportHeight)
      
      // Expected: ((-(-100) + 800/2) / 1, (-(-50) + 600/2) / 1)
      // = (100 + 400, 50 + 300) = (500, 350)
      expect(center.x).toBe(500)
      expect(center.y).toBe(350)
    })

    it('should account for zoom scale', () => {
      const stagePosition = { x: -100, y: -50 }
      const stageScale = 2
      const viewportWidth = 800
      const viewportHeight = 600

      const center = getViewportCenter(stagePosition, stageScale, viewportWidth, viewportHeight)
      
      // Expected: ((-(-100) + 800/2) / 2, (-(-50) + 600/2) / 2)
      // = (500 / 2, 350 / 2) = (250, 175)
      expect(center.x).toBe(250)
      expect(center.y).toBe(175)
    })

    it('should handle zero scale', () => {
      const stagePosition = { x: 0, y: 0 }
      const stageScale = 0.5
      const viewportWidth = 400
      const viewportHeight = 300

      const center = getViewportCenter(stagePosition, stageScale, viewportWidth, viewportHeight)
      
      // Expected: ((0 + 400/2) / 0.5, (0 + 300/2) / 0.5)
      // = (200 / 0.5, 150 / 0.5) = (400, 300)
      expect(center.x).toBe(400)
      expect(center.y).toBe(300)
    })
  })
})
