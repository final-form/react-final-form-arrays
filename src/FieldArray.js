// @flow
import * as React from 'react'
import { polyfill } from 'react-lifecycles-compat'
import PropTypes from 'prop-types'
import {
  fieldSubscriptionItems,
  version as ffVersion,
  ARRAY_ERROR
} from 'final-form'
import { version as rffVersion } from 'react-final-form'
import type { ReactContext } from 'react-final-form'
import diffSubscription from './diffSubscription'
import type { FieldSubscription, FieldState, FieldValidator } from 'final-form'
import type { Mutators } from 'final-form-arrays'
import type { FieldArrayProps as Props } from './types'
import renderComponent from './renderComponent'
export const version = '1.0.6'

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
  context: ReactContext
  props: Props
  state: State
  mutators: Mutators
  mounted: boolean
  unsubscribe: () => void

  static displayName = `ReactFinalFormFieldArray(${ffVersion})(${version})`

  constructor(props: Props, context: ReactContext) {
    super(props, context)
    let initialState
    // istanbul ignore next
    if (process.env.NODE_ENV !== 'production' && !context.reactFinalForm) {
      console.error(
        'Warning: FieldArray must be used inside of a ReactFinalForm component'
      )
    }
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
    this.state = { state: initialState }
    this.bindMutators(props)
    this.mounted = false
  }

  subscribe = (
    { name, subscription }: Props,
    listener: (state: FieldState) => void
  ) => {
    this.unsubscribe = this.context.reactFinalForm.registerField(
      name,
      listener,
      subscription ? { ...subscription, length: true } : all,
      {
        getValidator: () => this.validate
      }
    )
  }

  validate: FieldValidator = (...args) => {
    const { validate } = this.props
    if (!validate) return undefined
    const error = validate(...args)
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
    const { reactFinalForm } = this.context
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
    } =
      this.state.state || {}
    const meta = {
      active,
      dirty,
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

FieldArray.contextTypes = {
  reactFinalForm: PropTypes.object
}

polyfill(FieldArray)

export default FieldArray
