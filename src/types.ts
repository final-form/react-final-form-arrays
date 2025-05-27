import * as React from 'react'
import { FieldSubscription, FieldState } from 'final-form'

interface Meta {
  active?: boolean
  data?: Record<string, unknown>
  dirty?: boolean
  dirtySinceLastSubmit?: boolean
  error?: any
  initial?: any
  invalid?: boolean
  length?: number
  modified?: boolean
  pristine?: boolean
  submitError?: any
  submitFailed?: boolean
  submitSucceeded?: boolean
  submitting?: boolean
  touched?: boolean
  valid?: boolean
  visited?: boolean
  [key: string]: any // Allow additional properties
}

export interface FieldArrayRenderProps {
  fields: {
    forEach: (iterator: (name: string, index: number) => void) => void
    insert: (index: number, value: any) => void
    map: <T>(iterator: (name: string, index: number) => T) => T[]
    move: (from: number, to: number) => void
    name: string
    pop: () => any
    push: (value: any) => void
    remove: (index: number) => any
    shift: () => any
    swap: (indexA: number, indexB: number) => void
    unshift: (value: any) => void
    value: any[]
    length: number
  }
  meta: Meta
}

export interface RenderableProps<T> {
  children?: (props: T) => React.ReactNode
  component?: React.ComponentType<T>
  render?: (props: T) => React.ReactNode
}

export interface UseFieldArrayConfig {
  subscription?: FieldSubscription
  defaultValue?: any
  initialValue?: any
  isEqual?: (a: any[], b: any[]) => boolean
  validate?: (value: any[] | undefined, allValues: Record<string, unknown>, meta: FieldState | undefined) => any | undefined
}

export type FieldArrayProps = { name: string } & UseFieldArrayConfig &
  RenderableProps<FieldArrayRenderProps> 