import { useMemo } from 'react';
import { useForm, useField } from 'react-final-form'
import { fieldSubscriptionItems, ARRAY_ERROR } from 'final-form'
import { Mutators } from 'final-form-arrays'
import { FieldValidator, FieldSubscription } from 'final-form'
import { FieldArrayRenderProps, UseFieldArrayConfig } from './types'
import defaultIsEqual from './defaultIsEqual'
import useConstant from './useConstant'

const all: FieldSubscription = fieldSubscriptionItems.reduce((result, key) => {
  result[key] = true
  return result
}, {} as FieldSubscription)

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

  const validate: FieldValidator = useConstant(
    () => (value: any, allValues: any, meta: any) => {
      if (!validateProp) return undefined
      const error = validateProp(value, allValues, meta)
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

  const {
    meta: { length, ...meta },
    input,
    ...fieldState
  } = useField(name, {
    subscription: { ...subscription, length: true },
    defaultValue,
    initialValue,
    isEqual,
    validate,
    format: v => v
  })

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

  return {
    fields: {
      name,
      forEach,
      length: length || 0,
      map,
      ...(mutators as any),
      ...fieldState,
      value: input.value
    } as any,
    meta
  }
}

export default useFieldArray 