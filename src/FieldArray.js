// @flow
import * as React from 'react'
import warning from './warning'
import PropTypes from 'prop-types'
import { fieldSubscriptionItems } from 'final-form'
import type { ReactContext } from 'react-final-form'
import diffSubscription from './diffSubscription'
import type { FieldSubscription, FieldState } from 'final-form'
import type { Mutators } from 'final-form-arrays'
import type { FieldArrayProps as Props } from './types'
import renderComponent from './renderComponent'

const all: FieldSubscription = fieldSubscriptionItems.reduce((result, key) => {
  result[key] = true
  return result
}, {})

type State = {
  state: FieldState
}

export default class FieldArray extends React.PureComponent<Props, State> {
  context: ReactContext
  props: Props
  state: State
  mutators: Mutators
  unsubscribe: () => void

  constructor(props: Props, context: ReactContext) {
    super(props, context)
    let initialState
    warning(
      context.reactFinalForm,
      'FieldArray must be used inside of a ReactFinalForm component'
    )
    const { reactFinalForm } = this.context
    if (reactFinalForm) {
      // avoid error, warning will alert developer to their mistake
      this.subscribe(props, (state: FieldState) => {
        if (initialState) {
          this.notify(state)
        } else {
          initialState = state
        }
      })
    }
    this.state = { state: initialState || {} }
    this.bindMutators(props)
  }

  subscribe = (
    { name, subscription }: Props,
    listener: (state: FieldState) => void
  ) => {
    this.unsubscribe = this.context.reactFinalForm.registerField(
      name,
      listener,
      subscription ? { ...subscription, length: true } : all,
      this.validate
    )
  }

  bindMutators = ({ name }: Props) => {
    const { reactFinalForm } = this.context
    if (reactFinalForm) {
      const { mutators } = reactFinalForm
      warning(
        mutators && mutators.push && mutators.pop,
        'Array mutators not found. You need to provide the mutators from final-form-arrays to your form'
      )
      if (mutators) {
        this.mutators = Object.keys(mutators).reduce((result, key) => {
          result[key] = (...args) => mutators[key](name, ...args)
          return result
        }, {})
      }
    }
  }

  validate = (value: ?any, allValues: Object) =>
    this.props.validate && this.props.validate(value, allValues)

  notify = (state: FieldState) => this.setState({ state })

  forEach = (iterator: (name: string, index: number) => void): void => {
    const { name } = this.props
    const { length } = this.state.state
    for (let i = 0; i < length; i++) {
      iterator(`${name}[${i}]`, i)
    }
  }

  map = (iterator: (name: string, index: number) => any): any[] => {
    const { name } = this.props
    const { length } = this.state.state
    const results: any[] = []
    for (let i = 0; i < length; i++) {
      results.push(iterator(`${name}[${i}]`, i))
    }
    return results
  }

  componentWillReceiveProps(nextProps: Props) {
    const { name, subscription } = nextProps
    if (
      this.props.name !== name ||
      diffSubscription(
        this.props.subscription,
        subscription,
        fieldSubscriptionItems
      )
    ) {
      if (this.context.reactFinalForm) {
        // avoid error, warning will alert developer to their mistake
        this.unsubscribe()
        this.subscribe(nextProps, this.notify)
      }
    }
    if (this.props.name !== name) {
      this.bindMutators(nextProps)
    }
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  render() {
    const { name, ...rest } = this.props
    let { value, length, ...meta } = this.state.state
    return renderComponent(
      {
        fields: {
          name,
          forEach: this.forEach,
          length,
          map: this.map,
          ...this.mutators
        },
        meta,
        value,
        ...rest
      },
      `FieldArray(${name})`
    )
  }
}

FieldArray.contextTypes = {
  reactFinalForm: PropTypes.object
}
