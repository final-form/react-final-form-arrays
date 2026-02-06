import * as React from 'react'
import { act, render, cleanup, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import arrayMutators from 'final-form-arrays'
import { ErrorBoundary } from './testUtils'
import { Form, useFormState } from 'react-final-form'
import useFieldArray from './useFieldArray'
import { ARRAY_ERROR } from 'final-form'

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
    expect(spy).toHaveBeenCalled()
    expect(spy).toHaveBeenCalledTimes(2) // React 18+ renders twice in dev
    expect(spy.mock.calls[0][0].fields.length).toBe(0)

    act(() => spy.mock.calls[0][0].fields.push('bob'))

    expect(spy).toHaveBeenCalledTimes(3) // 2 initial + 1 after push
    expect(spy.mock.calls[2][0].fields.length).toBe(1)
    expect(spy.mock.calls[2][0].fields.value).toEqual(['bob'])
  })

  it('should handle array errors', () => {
    const spy = jest.fn()
    const MyFieldArray = () => {
      spy(useFieldArray('names', { validate: (values) => ['required'] }))
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

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        meta: expect.objectContaining({
          error: ['required']
        })
      })
    )
  })

  it('should handle string error', () => {
    const spy = jest.fn()
    const spyState = jest.fn()
    const MyFieldArray = () => {
      spy(useFieldArray('names', { validate: (values) => 'failed' }))
      return null
    }
    const Debug = () => {
      spyState(useFormState().errors)
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
            <Debug />
          </form>
        )}
      </Form>
    )

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        meta: expect.objectContaining({
          error: 'failed'
        })
      })
    )
    const expected: any[] = []
    ;(expected as any)[ARRAY_ERROR] = 'failed'

    expect(spyState).toHaveBeenCalledWith({ names: expected })
  })
  it('should handle Promises errors', async () => {
    const spy = jest.fn()
    const MyFieldArray = () => {
      spy(
        useFieldArray('names', {
          validate: (values) => Promise.resolve(['await fail'])
        })
      )
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

    waitFor(() =>
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          meta: expect.objectContaining({
            error: ['await fail']
          })
        })
      )
    )
  })
})
