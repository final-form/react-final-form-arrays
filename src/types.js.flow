// @flow
import * as React from 'react'
import type { FieldSubscription, FieldState } from 'final-form'

type Meta = $Shape<{
  active?: boolean,
  data?: Object,
  dirty?: boolean,
  dirtySinceLastSubmit?: boolean,
  error?: any,
  initial?: any,
  invalid?: boolean,
  length?: number,
  modified?: boolean,
  pristine?: boolean,
  submitError?: any,
  submitFailed?: boolean,
  submitSucceeded?: boolean,
  submitting?: boolean,
  touched?: boolean,
  valid?: boolean,
  visited?: boolean
}>

export type FieldArrayRenderProps = {
  fields: {
    forEach: (iterator: (name: string, index: number) => void) => void,
    insert: (index: number, value: any) => void,
    map: (iterator: (name: string, index: number) => any) => any[],
    move: (from: number, to: number) => void,
    name: string,
    pop: () => any,
    push: (value: any) => void,
    remove: (index: number) => any,
    shift: () => any,
    swap: (indexA: number, indexB: number) => void,
    unshift: (value: any) => void,
    value: any[]
  },
  meta: Meta
}

export type RenderableProps<T> = $Shape<{
  children: (props: T) => React.Node,
  component: React.ComponentType<*>,
  render: (props: T) => React.Node
}>

export type UseFieldArrayConfig = {
  subscription?: FieldSubscription,
  defaultValue?: any,
  initialValue?: any,
  isEqual?: (any[], any[]) => boolean,
  validate?: (value: ?(any[]), allValues: Object, meta: ?FieldState) => ?any
}

export type FieldArrayProps = { name: string } & UseFieldArrayConfig &
  RenderableProps<FieldArrayRenderProps>
