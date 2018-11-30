import * as React from 'react'
import { FieldSubscription, FieldState } from 'final-form'
export const version: string

export const FieldArray: React.ComponentType<FieldArrayProps>

export interface FieldArrayRenderProps {
  fields: {
    forEach: (iterator: (name: string, index: number) => void) => void
    insert: (index: number, value: any) => void
    map: (iterator: (name: string, index: number) => any) => any[]
    move: (from: number, to: number) => void
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

export interface FieldArrayProps
  extends RenderableProps<FieldArrayRenderProps> {
  name: string
  isEqual?: (a: any, b: any) => boolean
  subscription?: FieldSubscription
  validate?: (value: any, allValues: object) => any
}
