import { useMemo, useRef } from 'react'
import { useForm, useField } from 'react-final-form'
import { fieldSubscriptionItems, ARRAY_ERROR } from 'final-form'
import { Mutators } from 'final-form-arrays'
import { FieldValidator, FieldSubscription } from 'final-form'
import { FieldArrayRenderProps, UseFieldArrayConfig } from './types'
import defaultIsEqual from './defaultIsEqual'
import useConstant from './useConstant'
import copyPropertyDescriptors from './copyPropertyDescriptors'

// Default subscription for FieldArray: `length`, `value`, and `error` are included
// so that array-level validation errors are surfaced without subscribing to everything.
// The old default (`all`) caused severe performance degradation with nested arrays (#119).
// Users who need additional meta (e.g. touched, dirty) should pass subscription explicitly.
const defaultSubscription: FieldSubscription = { length: true, value: true, error: true }

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

  // FIX #167: Don't destructure/spread meta object because it has lazy getters
  // Extract length directly from meta when needed
  const { meta, input } = fieldState
  const length = meta.length

  // Create a new meta object that excludes length, preserving lazy getters
  const metaWithoutLength = copyPropertyDescriptors(meta, {} as any, ['length'])

  // Stable keys for React reconciliation (fix #116: indexes-as-keys break components)
  // Each item gets a unique string ID that persists through its lifetime in the array,
  // regardless of index shifts caused by insert/remove/move operations.
  const keyCounter = useRef(0)
  const keysRef = useRef<string[]>([])

  // Sync keys array length with actual field array length. Wrapped mutators update
  // keysRef before the form value changes, so a length mismatch here means the
  // array was changed externally. We cannot know which indexes changed, so
  // regenerate all keys rather than reusing keys for the wrong items.
  const currentLength = length || 0
  if (keysRef.current.length !== currentLength) {
    keysRef.current = Array.from(
      { length: currentLength },
      () => `ff-key-${keyCounter.current++}`
    )
  }

  // Wrap mutators to keep keysRef in sync with array mutations
  const stableKeys = keysRef.current

  const push = (...args: any[]) => {
    keysRef.current = [...keysRef.current, `ff-key-${keyCounter.current++}`]
    return (mutators as any).push(...args)
  }

  const pop = (...args: any[]) => {
    keysRef.current = keysRef.current.slice(0, -1)
    return (mutators as any).pop(...args)
  }

  const unshift = (...args: any[]) => {
    keysRef.current = [`ff-key-${keyCounter.current++}`, ...keysRef.current]
    return (mutators as any).unshift(...args)
  }

  const insert = (index: number, value: any) => {
    const len = keysRef.current.length
    if (!Number.isInteger(index) || index < 0 || index > len) {
      return undefined
    }
    const newKeys = [...keysRef.current]
    newKeys.splice(index, 0, `ff-key-${keyCounter.current++}`)
    keysRef.current = newKeys
    return (mutators as any).insert(index, value)
  }

  const remove = (index: number) => {
    const len = keysRef.current.length
    if (!Number.isInteger(index) || index < 0 || index >= len) {
      return undefined
    }
    const newKeys = [...keysRef.current]
    newKeys.splice(index, 1)
    keysRef.current = newKeys
    return (mutators as any).remove(index)
  }

  const shift = (...args: any[]) => {
    keysRef.current = keysRef.current.slice(1)
    return (mutators as any).shift(...args)
  }

  const move = (from: number, to: number) => {
    const len = keysRef.current.length
    if (
      !Number.isInteger(from) ||
      !Number.isInteger(to) ||
      from < 0 ||
      to < 0 ||
      from >= len ||
      to >= len
    ) {
      return undefined
    }
    const newKeys = [...keysRef.current]
    const [moved] = newKeys.splice(from, 1)
    newKeys.splice(to, 0, moved)
    keysRef.current = newKeys
    return (mutators as any).move(from, to)
  }

  const swap = (indexA: number, indexB: number) => {
    const len = keysRef.current.length
    if (
      !Number.isInteger(indexA) ||
      !Number.isInteger(indexB) ||
      indexA < 0 ||
      indexB < 0 ||
      indexA >= len ||
      indexB >= len
    ) {
      return undefined
    }
    const newKeys = [...keysRef.current]
    ;[newKeys[indexA], newKeys[indexB]] = [newKeys[indexB], newKeys[indexA]]
    keysRef.current = newKeys
    return (mutators as any).swap(indexA, indexB)
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

  // Build the mutators object, overriding the key-aware wrappers
  const wrappedMutators = {
    ...(mutators as any),
    push,
    pop,
    unshift,
    insert,
    remove,
    shift,
    move,
    swap
  }

  return {
    fields: {
      name,
      forEach,
      length: currentLength,
      map,
      keys: [...stableKeys],
      ...wrappedMutators,
      ...restFieldState,
      value: input.value
    } as any,
    meta: metaWithoutLength
  }
}

export default useFieldArray
