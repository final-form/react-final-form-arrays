import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { Form } from 'react-final-form'
import arrayMutators from 'final-form-arrays'
import { useFieldArray } from '.'
import { ARRAY_ERROR } from 'final-form'

describe('useFieldArray async validate regression #176', () => {
  it('should await async validate and not store Promise as ARRAY_ERROR', async () => {
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    
    const asyncValidate = jest.fn(async (value: any[]) => {
      await sleep(10)
      // Return undefined (no error) after async resolution
      return undefined
    })

    let formState: any

    const TestComponent = () => {
      const { fields } = useFieldArray('items', { 
        validate: asyncValidate 
      })
      return (
        <div>
          {fields.map((name, index) => (
            <div key={name}>Item {index}</div>
          ))}
        </div>
      )
    }

    render(
      <Form
        onSubmit={() => {}}
        mutators={arrayMutators}
        initialValues={{ items: ['a', 'b', 'c'] }}
        render={({ form }) => {
          formState = form.getState()
          return <TestComponent />
        }}
      />
    )
    
    // Initial render - validator should be called
    await waitFor(() => {
      expect(asyncValidate).toHaveBeenCalled()
    })

    // Wait for async validation to complete
    await waitFor(() => {
      // The error should NOT be a Promise
      const error = formState.errors?.items
      if (error) {
        expect(error).not.toBeInstanceOf(Promise)
      }
      
      // Check ARRAY_ERROR specifically
      if (Array.isArray(error)) {
        const arrayError = (error as any)[ARRAY_ERROR]
        expect(arrayError).not.toBeInstanceOf(Promise)
      }
    })

    // Final state check - no errors (3 items, validate returns undefined)
    expect(formState.errors?.items).toBeUndefined()
  })

  it('should handle sync validate without breaking', () => {
    const syncValidate = jest.fn((value: any[]) => {
      return value && value.length < 2 ? 'Need at least 2 items' : undefined
    })

    let formState: any

    const TestComponent = () => {
      const { fields } = useFieldArray('items', { 
        validate: syncValidate 
      })
      return (
        <div>
          {fields.map((name, index) => (
            <div key={name}>Item {index}</div>
          ))}
        </div>
      )
    }

    render(
      <Form
        onSubmit={() => {}}
        mutators={arrayMutators}
        initialValues={{ items: ['a', 'b', 'c'] }}
        render={({ form }) => {
          formState = form.getState()
          return <TestComponent />
        }}
      />
    )

    // Sync validator should be called
    expect(syncValidate).toHaveBeenCalled()

    // Sync errors should work normally
    expect(formState.errors?.items).toBeUndefined() // 3 items, so no error
  })

  it('should properly handle async validation errors', async () => {
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    
    const asyncValidateWithError = jest.fn(async (value: any[]) => {
      await sleep(10)
      return value && value.length < 5 ? 'Need at least 5 items' : undefined
    })

    let formState: any

    const TestComponent = () => {
      const { fields } = useFieldArray('items', { 
        validate: asyncValidateWithError 
      })
      return (
        <div>
          {fields.map((name, index) => (
            <div key={name}>Item {index}</div>
          ))}
        </div>
      )
    }

    render(
      <Form
        onSubmit={() => {}}
        mutators={arrayMutators}
        initialValues={{ items: ['a', 'b', 'c'] }}
        render={({ form }) => {
          formState = form.getState()
          return <TestComponent />
        }}
      />
    )

    // Wait for async validation
    await waitFor(() => {
      expect(asyncValidateWithError).toHaveBeenCalled()
    })

    // Error should be resolved, not a Promise
    await waitFor(() => {
      const error = formState.errors?.items
      if (Array.isArray(error)) {
        const arrayError = (error as any)[ARRAY_ERROR]
        expect(arrayError).toBe('Need at least 5 items')
        expect(arrayError).not.toBeInstanceOf(Promise)
      }
    })
  })
})
