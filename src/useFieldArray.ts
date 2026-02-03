import { useMemo } from 'react'
import { useForm, useField } from 'react-final-form'
import { fieldSubscriptionItems, ARRAY_ERROR } from 'final-form'
import { Mutators } from 'final-form-arrays'
import { FieldValidator, FieldSubscription } from 'final-form'
import { FieldArrayRenderProps, UseFieldArrayConfig } from './types'
import defaultIsEqual from './defaultIsEqual'
import useConstant from './useConstant'
import copyPropertyDescriptors from './copyPropertyDescriptors'

const all: FieldSubscription = fieldSubscriptionItems.reduce((result, key) => {
  result[key] = true
  return result
}, {} as FieldSubscription)

/**
 * handle synced errors
 */
const handleError = (error: string | readonly string[] | void) => {
  if (!error || Array.isArray(error)) {
    return error
  }
  const arrayError: string[] = []
  // gross, but we have to set a string key on the array
  ;(arrayError as unknown as Record<string, string>)[ARRAY_ERROR] =
    error as string

  return arrayError
}

const useFieldArray = (
  name: string,
  {
    subscription = all,
    defaultValue,
    initialValue,
    isEqual = defaultIsEqual,
    validate: validateProp
  }: UseFieldArrayConfig = {}
): FieldArrayRenderProps => {
  const form = useForm('useFieldArray')

  const formMutators = form.mutators as unknown as Mutators
  const hasMutators = !!(
    formMutators &&
    (formMutators as any).push &&
    (formMutators as any).pop
  )
  if (!hasMutators) {
    throw new Error(
      'Array mutators not found. You need to provide the mutators from final-form-arrays to your form'
    )
  }
  const mutators = useMemo<Record<string, Function>>(
    () =>
      // curry the field name onto all mutator calls
      Object.keys(formMutators).reduce(
        (result, key) => {
          result[key] = (...args: any[]) =>
            (formMutators as any)[key](name, ...args)
          return result
        },
        {} as Record<string, Function>
      ),
    [name, formMutators]
  )

  const validate: FieldValidator | undefined = useConstant(() =>
    !validateProp
      ? undefined
      : (value: any, allValues: any, meta: any) => {
          const validation = validateProp(value, allValues, meta)
          if (!validation) {
            return undefined
          }

          if (validation.then) {
            return validation.then((error: string | readonly string[] | void) =>
              handleError(error)
            )
          }
          return handleError(validation)
        }
  )

  const fieldState = useField(name, {
    subscription: { ...subscription, length: true },
    defaultValue,
    initialValue,
    isEqual,
    validate,
    format: (v) => v
  })

  // FIX #167: Don't destructure/spread meta object because it has lazy getters
  // Extract length directly from meta when needed
  const { meta, input } = fieldState
  const length = meta.length

  // Create a new meta object that excludes length, preserving lazy getters
  const metaWithoutLength = copyPropertyDescriptors(meta, {} as any, ['length'])

  const forEach = (iterator: (name: string, index: number) => void): void => {
    // required || for Flow, but results in uncovered line in Jest/Istanbul
    // istanbul ignore next
    const len = length || 0
    for (let i = 0; i < len; i++) {
      iterator(`${name}[${i}]`, i)
    }
  }

  const map = <T>(iterator: (name: string, index: number) => T): T[] => {
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
