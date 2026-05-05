import * as React from 'react'
import { act, render, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import arrayMutators from 'final-form-arrays'
import { ErrorBoundary } from './testUtils'
import { Form, useField } from 'react-final-form'
import useFieldArray from './useFieldArray'

const onSubmitMock = (values: any) => {}

describe('FieldArray', () => {
  afterEach(cleanup)

  // Most of the functionality of useFieldArray is tested in FieldArray.test.js
  // This file is only for testing its use as a hook in other components

  it('should warn if not used inside a form', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    const errorSpy = jest.fn()
    const MyFieldComponent = () => {
      useFieldArray('name')
      return <div />
    }
    render(
      <ErrorBoundary spy={errorSpy}>
        <MyFieldComponent />
      </ErrorBoundary>
    )
    expect(errorSpy).toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy.mock.calls[0][0].message).toBe(
      'useFieldArray must be used inside of a <Form> component'
    )
    ;(console.error as any).mockRestore()
  })

  it('should track field array state', () => {
    const spy = jest.fn()
    const MyFieldArray = () => {
      spy(useFieldArray('names'))
      return null
    }
    render(
      <Form onSubmit={onSubmitMock} mutators={arrayMutators as any} subscription={{}}>
        {() => (
          <form>
            <MyFieldArray />
          </form>
        )}
      </Form>
    )
    expect(spy).toHaveBeenCalled()
    expect(spy).toHaveBeenCalledTimes(2) // React 18+ renders twice in dev
    expect(spy.mock.calls[0][0].fields.length).toBe(0)

    act(() => spy.mock.calls[0][0].fields.push('bob'))

    expect(spy).toHaveBeenCalledTimes(3) // 2 initial + 1 after push
    expect(spy.mock.calls[2][0].fields.length).toBe(1)
    expect(spy.mock.calls[2][0].fields.value).toEqual(['bob'])
  })

  it('should not call validator when no validate prop is provided', () => {
    // This test verifies the fix: when no validator is provided,
    // undefined is passed instead of a no-op function that always returns undefined.
    // This prevents final-form from tracking this field as having a validator,
    // which would trigger unnecessary form-wide validation.
    
    const useFieldSpy = jest.spyOn(require('react-final-form'), 'useField')
    
    const MyFieldArray = () => {
      const fieldArray = useFieldArray('names')
      return null
    }

    render(
      <Form
        onSubmit={onSubmitMock}
        mutators={arrayMutators as any}
        subscription={{}}
      >
        {() => (
          <form>
            <MyFieldArray />
          </form>
        )}
      </Form>
    )

    // Verify that useField was called with validate: undefined
    const useFieldCalls = useFieldSpy.mock.calls
    const relevantCall = useFieldCalls.find(call => call[0] === 'names')
    expect(relevantCall).toBeDefined()
    expect(relevantCall![1].validate).toBeUndefined()
    
    useFieldSpy.mockRestore()
  })

  it('should call validator when validate prop is provided', () => {
    const fieldValidate = jest.fn(() => undefined)
    const fieldArraySpy = jest.fn()
    
    const MyFieldArray = () => {
      const fieldArray = useFieldArray('names', { validate: fieldValidate })
      fieldArraySpy(fieldArray)
      return null
    }

    render(
      <Form
        onSubmit={onSubmitMock}
        mutators={arrayMutators as any}
        subscription={{}}
      >
        {() => (
          <form>
            <MyFieldArray />
          </form>
        )}
      </Form>
    )

    // Field validation should be called on initial render
    expect(fieldValidate).toHaveBeenCalled()
    const initialCalls = fieldValidate.mock.calls.length

    // Get the last call before mutations
    const lastCallBeforeMutations = fieldArraySpy.mock.calls.length - 1
    
    // Push an item to trigger validation again
    act(() => fieldArraySpy.mock.calls[lastCallBeforeMutations][0].fields.push('alice'))

    // Field validation should be called again after mutation
    expect(fieldValidate.mock.calls.length).toBeGreaterThan(initialCalls)
  })

  describe('fields.keys — stable keys for React reconciliation (fix #116)', () => {
    it('should provide stable keys when removing an item', () => {
      const spy = jest.fn()
      const MyFieldArray = () => {
        spy(useFieldArray('names'))
        return null
      }
      render(
        <Form onSubmit={onSubmitMock} mutators={arrayMutators as any} subscription={{}}>
          {() => (
            <form>
              <MyFieldArray />
            </form>
          )}
        </Form>
      )

      // Push 3 items
      act(() => spy.mock.calls[0][0].fields.push('alice'))
      act(() => spy.mock.calls[spy.mock.calls.length - 1][0].fields.push('bob'))
      act(() => spy.mock.calls[spy.mock.calls.length - 1][0].fields.push('carol'))

      const keysAfterPush = spy.mock.calls[spy.mock.calls.length - 1][0].fields.keys
      expect(keysAfterPush).toHaveLength(3)
      expect(keysAfterPush[0]).toMatch(/^ff-key-/)
      expect(keysAfterPush[1]).toMatch(/^ff-key-/)
      expect(keysAfterPush[2]).toMatch(/^ff-key-/)

      // Remove the middle item (index 1 = 'bob')
      act(() => spy.mock.calls[spy.mock.calls.length - 1][0].fields.remove(1))

      const keysAfterRemove = spy.mock.calls[spy.mock.calls.length - 1][0].fields.keys
      expect(keysAfterRemove).toHaveLength(2)
      // First and last items should keep their original keys
      expect(keysAfterRemove[0]).toBe(keysAfterPush[0])
      expect(keysAfterRemove[1]).toBe(keysAfterPush[2])
    })

    it('should generate unique keys on push', () => {
      const spy = jest.fn()
      const MyFieldArray = () => {
        spy(useFieldArray('names'))
        return null
      }
      render(
        <Form onSubmit={onSubmitMock} mutators={arrayMutators as any} subscription={{}}>
          {() => (
            <form>
              <MyFieldArray />
            </form>
          )}
        </Form>
      )

      act(() => spy.mock.calls[0][0].fields.push('a'))
      act(() => spy.mock.calls[spy.mock.calls.length - 1][0].fields.push('b'))
      act(() => spy.mock.calls[spy.mock.calls.length - 1][0].fields.push('c'))

      const keys = spy.mock.calls[spy.mock.calls.length - 1][0].fields.keys
      expect(keys).toHaveLength(3)
      // All keys should be unique
      const uniqueKeys = new Set(keys)
      expect(uniqueKeys.size).toBe(3)
    })

    it('should update keys correctly on swap', () => {
      const spy = jest.fn()
      const MyFieldArray = () => {
        spy(useFieldArray('names'))
        return null
      }
      render(
        <Form onSubmit={onSubmitMock} mutators={arrayMutators as any} subscription={{}}>
          {() => (
            <form>
              <MyFieldArray />
            </form>
          )}
        </Form>
      )

      act(() => spy.mock.calls[0][0].fields.push('alice'))
      act(() => spy.mock.calls[spy.mock.calls.length - 1][0].fields.push('bob'))

      const keysBeforeSwap = spy.mock.calls[spy.mock.calls.length - 1][0].fields.keys
      const key0 = keysBeforeSwap[0]
      const key1 = keysBeforeSwap[1]

      act(() => spy.mock.calls[spy.mock.calls.length - 1][0].fields.swap(0, 1))

      const keysAfterSwap = spy.mock.calls[spy.mock.calls.length - 1][0].fields.keys
      expect(keysAfterSwap[0]).toBe(key1)
      expect(keysAfterSwap[1]).toBe(key0)
    })

    it('should update keys correctly on move', () => {
      const spy = jest.fn()
      const MyFieldArray = () => {
        spy(useFieldArray('names'))
        return null
      }
      render(
        <Form onSubmit={onSubmitMock} mutators={arrayMutators as any} subscription={{}}>
          {() => (
            <form>
              <MyFieldArray />
            </form>
          )}
        </Form>
      )

      act(() => spy.mock.calls[0][0].fields.push('alice'))
      act(() => spy.mock.calls[spy.mock.calls.length - 1][0].fields.push('bob'))
      act(() => spy.mock.calls[spy.mock.calls.length - 1][0].fields.push('carol'))

      const keysBeforeMove = spy.mock.calls[spy.mock.calls.length - 1][0].fields.keys
      const [k0, k1, k2] = keysBeforeMove

      // Move item at index 0 to index 2
      act(() => spy.mock.calls[spy.mock.calls.length - 1][0].fields.move(0, 2))

      const keysAfterMove = spy.mock.calls[spy.mock.calls.length - 1][0].fields.keys
      expect(keysAfterMove[0]).toBe(k1)
      expect(keysAfterMove[1]).toBe(k2)
      expect(keysAfterMove[2]).toBe(k0)
    })

    it('should update keys correctly on pop and shift', () => {
      const spy = jest.fn()
      const MyFieldArray = () => {
        spy(useFieldArray('names'))
        return null
      }
      render(
        <Form onSubmit={onSubmitMock} mutators={arrayMutators as any} subscription={{}}>
          {() => (
            <form>
              <MyFieldArray />
            </form>
          )}
        </Form>
      )

      act(() => spy.mock.calls[0][0].fields.push('alice'))
      act(() => spy.mock.calls[spy.mock.calls.length - 1][0].fields.push('bob'))
      act(() => spy.mock.calls[spy.mock.calls.length - 1][0].fields.push('carol'))

      const keysAfterPush = spy.mock.calls[spy.mock.calls.length - 1][0].fields.keys
      const [k0, k1, k2] = keysAfterPush

      // Pop removes last item
      act(() => spy.mock.calls[spy.mock.calls.length - 1][0].fields.pop())
      const keysAfterPop = spy.mock.calls[spy.mock.calls.length - 1][0].fields.keys
      expect(keysAfterPop).toHaveLength(2)
      expect(keysAfterPop[0]).toBe(k0)
      expect(keysAfterPop[1]).toBe(k1)

      // Shift removes first item
      act(() => spy.mock.calls[spy.mock.calls.length - 1][0].fields.shift())
      const keysAfterShift = spy.mock.calls[spy.mock.calls.length - 1][0].fields.keys
      expect(keysAfterShift).toHaveLength(1)
      expect(keysAfterShift[0]).toBe(k1)
    })

    it('should add keys correctly on unshift and insert', () => {
      const spy = jest.fn()
      const MyFieldArray = () => {
        spy(useFieldArray('names'))
        return null
      }
      render(
        <Form onSubmit={onSubmitMock} mutators={arrayMutators as any} subscription={{}}>
          {() => (
            <form>
              <MyFieldArray />
            </form>
          )}
        </Form>
      )

      act(() => spy.mock.calls[0][0].fields.push('alice'))
      const keysAfterFirstPush = spy.mock.calls[spy.mock.calls.length - 1][0].fields.keys
      const originalKey = keysAfterFirstPush[0]

      // Unshift prepends a new item — existing item's key should be at index 1
      act(() => spy.mock.calls[spy.mock.calls.length - 1][0].fields.unshift('zero'))
      const keysAfterUnshift = spy.mock.calls[spy.mock.calls.length - 1][0].fields.keys
      expect(keysAfterUnshift).toHaveLength(2)
      expect(keysAfterUnshift[1]).toBe(originalKey) // alice moved to index 1

      // Insert at index 1 — existing keys should shift around it
      act(() => spy.mock.calls[spy.mock.calls.length - 1][0].fields.insert(1, 'inserted'))
      const keysAfterInsert = spy.mock.calls[spy.mock.calls.length - 1][0].fields.keys
      expect(keysAfterInsert).toHaveLength(3)
      expect(keysAfterInsert[2]).toBe(originalKey) // alice now at index 2
      expect(keysAfterInsert[1]).toMatch(/^ff-key-/) // new key for inserted item
      expect(keysAfterInsert[1]).not.toBe(originalKey) // different from alice's key
    })
  })
})
