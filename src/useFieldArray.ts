import { useMemo } from 'react';
import { useForm, useField, useFormState } from 'react-final-form'
import { ARRAY_ERROR } from 'final-form'
import { Mutators } from 'final-form-arrays'
import { FieldValidator, FieldSubscription } from 'final-form'
import { FieldArrayRenderProps, UseFieldArrayConfig } from './types'
import defaultIsEqual from './defaultIsEqual'
import useConstant from './useConstant'
import copyPropertyDescriptors from './copyPropertyDescriptors'

// Default subscription for FieldArray: `length`, `value`, and `error` are included
// so that array-level validation errors are surfaced without subscribing to everything.
// The old default (`all`) caused severe performance degradation with nested arrays (#119).
// Users who need additional meta (e.g. active, touched, dirty) should pass subscription explicitly.
const defaultSubscription: FieldSubscription = { length: true, value: true, error: true }

const isArrayField = (arrayName: string, fieldName: string): boolean =>
  fieldName === arrayName || fieldName.startsWith(`${arrayName}[`)

const useFieldArray = (
  name: string,
  {
    subscription = defaultSubscription,
    defaultValue,
    initialValue,
    isEqual = defaultIsEqual,
    validate: validateProp
  }: UseFieldArrayConfig = {}
): FieldArrayRenderProps => {
  const form = useForm('useFieldArray')

  const formMutators = form.mutators as unknown as Mutators
  const hasMutators = !!(formMutators && (formMutators as any).push && (formMutators as any).pop)
  if (!hasMutators) {
    throw new Error(
      'Array mutators not found. You need to provide the mutators from final-form-arrays to your form'
    )
  }
  const mutators = useMemo<Record<string, Function>>(() =>
    // curry the field name onto all mutator calls
    Object.keys(formMutators).reduce((result, key) => {
      result[key] = (...args: any[]) => (formMutators as any)[key](name, ...args)
      return result
    }, {} as Record<string, Function>
    ), [name, formMutators])

  const validate: FieldValidator | undefined = useConstant(() =>
    !validateProp
      ? undefined
      : (value: any, allValues: any, meta: any) => {
          const rawError = validateProp(value, allValues, meta)
          
          // If the validator returned a Promise, await it before processing
          if (rawError && typeof rawError.then === 'function') {
            return rawError.then((error: any) => {
              if (!error || Array.isArray(error)) {
                return error
              } else {
                const arrayError: any[] = []
                // gross, but we have to set a string key on the array
                ; (arrayError as any)[ARRAY_ERROR] = error
                return arrayError
              }
            })
          }
          
          // Synchronous validator - process immediately
          const error = rawError
          if (!error || Array.isArray(error)) {
            return error
          } else {
            const arrayError: any[] = []
            // gross, but we have to set a string key on the array
            ; (arrayError as any)[ARRAY_ERROR] = error
            return arrayError
          }
        }
  )

  const fieldState = useField(name, {
    subscription: { ...subscription, length: true },
    defaultValue,
    initialValue,
    isEqual,
    validate,
    format: v => v
  })

  const needsAggregateActive = !!subscription.active
  const needsAggregateTouched = !!subscription.touched
  const formState = useFormState({
    subscription: {
      active: needsAggregateActive,
      touched: needsAggregateTouched
    }
  })

  // FIX #167: Don't destructure/spread meta object because it has lazy getters
  // Extract length directly from meta when needed
  const { meta, input } = fieldState
  const length = meta.length

  // Create a new meta object that excludes length, preserving lazy getters
  const metaWithoutLength = copyPropertyDescriptors(
    meta,
    {} as any,
    [
      'length',
      ...(needsAggregateActive ? ['active'] : []),
      ...(needsAggregateTouched ? ['touched'] : [])
    ]
  )

  if (needsAggregateActive) {
    Object.defineProperty(metaWithoutLength, 'active', {
      enumerable: true,
      get: () =>
        typeof formState.active === 'string' && isArrayField(name, formState.active)
    })
  }

  if (needsAggregateTouched) {
    Object.defineProperty(metaWithoutLength, 'touched', {
      enumerable: true,
      get: () => {
        const touched = formState.touched
        return !!touched &&
          Object.keys(touched).some(
            (fieldName) => !!touched[fieldName] && isArrayField(name, fieldName)
          )
      }
    })
  }

  const forEach = (iterator: (name: string, index: number) => void): void => {
    // required || for Flow, but results in uncovered line in Jest/Istanbul
    // istanbul ignore next
    const len = length || 0
    for (let i = 0; i < len; i++) {
      iterator(`${name}[${i}]`, i)
    }
  }

  const map = <T,>(iterator: (name: string, index: number) => T): T[] => {
    // required || for Flow, but results in uncovered line in Jest/Istanbul
    // istanbul ignore next
    const len = length || 0
    const results: T[] = []
    for (let i = 0; i < len; i++) {
      results.push(iterator(`${name}[${i}]`, i))
    }
    return results
  }

  // Don't spread fieldState, extract only what we need
  const { meta: _meta, input: _input, ...restFieldState } = fieldState

  return {
    fields: {
      name,
      forEach,
      length: length || 0,
      map,
      ...(mutators as any),
      ...restFieldState,
      value: input.value
    } as any,
    meta: metaWithoutLength
  }
}

export default useFieldArray 