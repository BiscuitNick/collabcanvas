import { renderHook, act } from '@testing-library/react'
import { useCursorContext } from './useCursorContext'
import { CursorContext } from '../types'

describe('useCursorContext', () => {
  it('initializes with default cursor context', () => {
    const { result } = renderHook(() => useCursorContext())

    expect(result.current.cursorContext).toBe(CursorContext.DEFAULT)
  })

  it('updates cursor context for different interactions', () => {
    const { result } = renderHook(() => useCursorContext())

    act(() => {
      result.current.updateCursorForInteraction('pan')
    })

    expect(result.current.cursorContext).toBe(CursorContext.GRAB)

    act(() => {
      result.current.updateCursorForInteraction('select')
    })

    expect(result.current.cursorContext).toBe(CursorContext.POINTER)

    act(() => {
      result.current.updateCursorForInteraction('resize')
    })

    expect(result.current.cursorContext).toBe(CursorContext.RESIZE)

    act(() => {
      result.current.updateCursorForInteraction('text-edit')
    })

    expect(result.current.cursorContext).toBe(CursorContext.TEXT)

    act(() => {
      result.current.updateCursorForInteraction('default')
    })

    expect(result.current.cursorContext).toBe(CursorContext.DEFAULT)
  })

  it('sets cursor context directly', () => {
    const { result } = renderHook(() => useCursorContext())

    act(() => {
      result.current.setCursorContext(CursorContext.WAIT)
    })

    expect(result.current.cursorContext).toBe(CursorContext.WAIT)
  })
})
