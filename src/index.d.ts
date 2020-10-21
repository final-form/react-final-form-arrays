import { FieldState } from 'final-form'
import { UseFieldConfig } from 'react-final-form'
export const version: string

export interface FieldArrayRenderProps<FieldValue, T extends HTMLElement> {
  fields: {
    forEach: (iterator: (name: string, index: number) => void) => void
    insert: (index: number, value: FieldValue) => void
    map: <R>(iterator: (name: string, index: number) => R) => R[]
    move: (from: number, to: number) => void
    update: (index: number, value: FieldValue) => void
    name: string
    pop: () => FieldValue
    push: (value: FieldValue) => void
    remove: (index: number) => FieldValue
    shift: () => FieldValue
    swap: (indexA: number, indexB: number) => void
    unshift: (value: FieldValue) => void
    value: FieldValue[]
  } & FieldState<FieldValue[]>
  meta: Partial<{
    // TODO: Make a diff of `FieldState` without all the functions
    active: boolean
    dirty: boolean
    dirtySinceLastSubmit: boolean
    error: any
    initial: any
    invalid: boolean
    pristine: boolean
    submitError: any
    submitFailed: boolean
    submitSucceeded: boolean
    touched: boolean
    valid: boolean
    visited: boolean
  }>
}

export interface RenderableProps<T> {
  children?: ((props: T) => React.ReactNode) | React.ReactNode
  component?: React.ComponentType<T> | string
  render?: (props: T) => React.ReactNode
}

export interface UseFieldArrayConfig<FieldValue>
  extends UseFieldConfig<FieldValue[]> {
  isEqual?: (a: any[], b: any[]) => boolean
}

export interface FieldArrayProps<FieldValue, T extends HTMLElement>
  extends UseFieldArrayConfig<FieldValue>,
    RenderableProps<FieldArrayRenderProps<FieldValue, T>> {
  name: string
  [otherProp: string]: any
}

export const FieldArray: <
  FieldValue = any,
  T extends HTMLElement = HTMLElement
>(
  props: FieldArrayProps<FieldValue, T>
) => React.ReactElement

export function useFieldArray<
  FieldValue = any,
  T extends HTMLElement = HTMLElement
>(
  name: string,
  config?: UseFieldArrayConfig<FieldValue>
): FieldArrayRenderProps<FieldValue, T>
