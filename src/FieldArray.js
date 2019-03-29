// @flow
import * as React from 'react'
import { polyfill } from 'react-lifecycles-compat'
import {
  fieldSubscriptionItems,
  version as ffVersion,
  ARRAY_ERROR
} from 'final-form'
import { version as rffVersion } from 'react-final-form'
import diffSubscription from './diffSubscription'
import type { FieldSubscription, FieldState, FieldValidator } from 'final-form'
import type { Mutators } from 'final-form-arrays'
import type { FieldArrayPropsWithForm as Props, FieldArrayProps } from './types'
import renderComponent from './renderComponent'
import type { ReactContext } from 'react-final-form'
import { withReactFinalForm } from 'react-final-form'
export const version = '2.0.1'

const versions = {
  'final-form': ffVersion,
  'react-final-form': rffVersion,
  'react-final-form-arrays': version
}

const all: FieldSubscription = fieldSubscriptionItems.reduce((result, key) => {
  result[key] = true
  return result
}, {})

type State = {
  state: ?FieldState
}

class FieldArray extends React.Component<Props, State> {
  props: Props
  state: State
  mutators: Mutators
  mounted: boolean
  unsubscribe: () => void

  static displayName = `ReactFinalFormFieldArray(${ffVersion})(${version})`

  constructor(props: Props) {
    super(props)
    let initialState
    // istanbul ignore next
    if (process.env.NODE_ENV !== 'production' && !props.reactFinalForm) {
      console.error(
        'Warning: FieldArray must be used inside of a ReactFinalForm component'
      )
    }
    const { reactFinalForm } = props
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
    this.state = { state: initialState }
    this.bindMutators(props)
    this.mounted = false
  }

  isEqual = (a: Array<any>, b: Array<any>) => {
    if (typeof this.props.isEqual === 'function') {
      return this.props.isEqual(a, b)
    }

    return true
  }

  subscribe = (
    { name, subscription }: Props,
    listener: (state: FieldState) => void
  ) => {
    this.unsubscribe = this.props.reactFinalForm.registerField(
      name,
      listener,
      subscription ? { ...subscription, length: true } : all,
      {
        getValidator: () => this.validate,
        isEqual: this.isEqual
      }
    )
  }

  validate: FieldValidator = (...args) => {
    const { validate } = this.props
    if (!validate) return undefined
    const error = validate(args[0], args[1])
    if (!error || Array.isArray(error)) {
      return error
    } else {
      const arrayError = []
      // gross, but we have to set a string key on the array
      ;((arrayError: any): Object)[ARRAY_ERROR] = error
      return arrayError
    }
  }

  bindMutators = ({ name }: Props) => {
    const { reactFinalForm } = this.props
    if (reactFinalForm) {
      const { mutators } = reactFinalForm
      const hasMutators = !!(mutators && mutators.push && mutators.pop)
      // istanbul ignore next
      if (process.env.NODE_ENV !== 'production' && !hasMutators) {
        console.error(
          'Warning: Array mutators not found. You need to provide the mutators from final-form-arrays to your form'
        )
      }
      if (hasMutators) {
        this.mutators = Object.keys(mutators).reduce((result, key) => {
          result[key] = (...args) => mutators[key](name, ...args)
          return result
        }, {})
      }
    }
  }

  notify = (state: FieldState) => {
    setTimeout(() => {
      if (this.mounted) {
        this.setState({ state })
      }
    })
  }

  forEach = (iterator: (name: string, index: number) => void): void => {
    const { name } = this.props
    // required || for Flow, but results in uncovered line in Jest/Istanbul
    // istanbul ignore next
    const length = this.state.state ? this.state.state.length || 0 : 0
    for (let i = 0; i < length; i++) {
      iterator(`${name}[${i}]`, i)
    }
  }

  map = (iterator: (name: string, index: number) => any): any[] => {
    const { name } = this.props
    // required || for Flow, but results in uncovered line in Jest/Istanbul
    // istanbul ignore next
    const length = this.state.state ? this.state.state.length || 0 : 0
    const results: any[] = []
    for (let i = 0; i < length; i++) {
      results.push(iterator(`${name}[${i}]`, i))
    }
    return results
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    const { name, subscription } = nextProps
    if (
      this.props.name !== name ||
      diffSubscription(
        this.props.subscription,
        subscription,
        fieldSubscriptionItems
      )
    ) {
      if (this.props.reactFinalForm) {
        // avoid error, warning will alert developer to their mistake
        this.unsubscribe()
        this.subscribe(nextProps, this.notify)
      }
    }
    if (this.props.name !== name) {
      this.bindMutators(nextProps)
    }
  }

  componentDidMount() {
    this.mounted = true
  }

  componentWillUnmount() {
    this.mounted = false
    this.unsubscribe()
  }

  render() {
    const { name, ...rest } = this.props
    let {
      length,
      active,
      dirty,
      dirtySinceLastSubmit,
      error,
      initial,
      invalid,
      pristine,
      submitError,
      submitFailed,
      submitSucceeded,
      touched,
      valid,
      visited,
      ...fieldStateFunctions
    } = this.state.state || {}
    const meta = {
      active,
      dirty,
      dirtySinceLastSubmit,
      error,
      initial,
      invalid,
      pristine,
      submitError,
      submitFailed,
      submitSucceeded,
      touched,
      valid,
      visited
    }
    const fieldState = {
      ...meta,
      ...fieldStateFunctions
    }
    return renderComponent(
      {
        fields: {
          name,
          forEach: this.forEach,
          length,
          map: this.map,
          ...this.mutators,
          ...fieldState
        },
        meta,
        ...rest,
        __versions: versions
      },
      `FieldArray(${name})`
    )
  }
}

polyfill(FieldArray)

const decorated: React.ComponentType<
  FieldArrayProps & ReactContext
> = withReactFinalForm(FieldArray)

export default decorated
