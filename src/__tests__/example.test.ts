import { describe, it, expect } from 'vitest'

describe('Example Test Suite', () => {
  it('should pass basic assertion', () => {
    expect(true).toBe(true)
  })

  it('should perform basic math', () => {
    expect(2 + 2).toEqual(4)
  })

  it('should work with arrays', () => {
    const fruits = ['apple', 'banana', 'orange']
    expect(fruits).toHaveLength(3)
    expect(fruits).toContain('banana')
  })

  it('should work with objects', () => {
    const user = { name: 'John', age: 30 }
    expect(user).toHaveProperty('name', 'John')
    expect(user.age).toBeGreaterThan(18)
  })
})

describe('Environment Setup', () => {
  it('should have Firebase environment variables configured', () => {
    // This tests that environment variables are loaded
    expect(import.meta.env.VITE_FIREBASE_API_KEY).toBeDefined()
    expect(import.meta.env.VITE_FIREBASE_PROJECT_ID).toBeDefined()
    expect(typeof import.meta.env.VITE_FIREBASE_API_KEY).toBe('string')
  })
})
