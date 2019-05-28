import * as React from 'react'
import { FieldSubscription, FieldState } from 'final-form'
import { UseFieldConfig } from 'react-final-form'
export const version: string

export interface FieldArrayRenderProps<T extends HTMLElement> {
  fields: {
    forEach: (iterator: (name: string, index: number) => void) => void
    insert: (index: number, value: any) => void
    map: (iterator: (name: string, index: number) => any) => any[]
    move: (from: number, to: number) => void
    update: (index: number, value: any) => void
    name: string
    pop: () => any
    push: (value: any) => void
    remove: (index: number) => any
    shift: () => any
    swap: (indexA: number, indexB: number) => void
    unshift: (value: any) => void
  } & FieldState
  meta: Partial<{
    // TODO: Make a diff of `FieldState` without all the functions
    active: boolean
    dirty: boolean
    dirtySinceLastSubmit: boolean
    error: boolean
    initial: boolean
    invalid: boolean
    pristine: boolean
    submitError: boolean
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

export interface UseFieldArrayConfig extends UseFieldConfig {
  isEqual?: (a: any[], b: any[]) => boolean
}

export interface FieldArrayProps<T extends HTMLElement>
  extends UseFieldArrayConfig,
    RenderableProps<FieldArrayRenderProps<T>> {
  name: string
  [otherProp: string]: any
}

export const FieldArray: React.FC<FieldArrayProps<any>>
export function useFieldArray<T extends HTMLElement>(
  name: string,
  config: UseFieldArrayConfig
): FieldArrayRenderProps<T>
