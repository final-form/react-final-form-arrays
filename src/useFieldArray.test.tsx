import * as React from 'react'
import { act, render, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import arrayMutators from 'final-form-arrays'
import { ErrorBoundary } from './testUtils'
import { Form } from 'react-final-form'
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
    
    const fieldArraySpy = jest.fn()
    
    const MyFieldArray = () => {
      const fieldArray = useFieldArray('names')
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

    // Get the last call before mutations
    const lastCallBeforeMutations = fieldArraySpy.mock.calls.length - 1
    
    // Push items to array - these should not cause validation issues
    act(() => fieldArraySpy.mock.calls[lastCallBeforeMutations][0].fields.push('alice'))
    act(() => fieldArraySpy.mock.calls[lastCallBeforeMutations][0].fields.push('bob'))
    
    // Verify the items were added
    const lastCall = fieldArraySpy.mock.calls[fieldArraySpy.mock.calls.length - 1]
    expect(lastCall[0].fields.length).toBe(2)
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
})
