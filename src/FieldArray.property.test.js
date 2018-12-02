import React, { Fragment } from 'react'
import TestUtils from 'react-dom/test-utils'
import { render, fireEvent, cleanup } from 'react-testing-library'
import { Form, Field } from 'react-final-form'
import arrayMutators from 'final-form-arrays'
import fc from 'fast-check'
import FieldArray from './FieldArray'

const nope = () => {}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const waitForFormToRerender = () => sleep(0)
const INITIAL_NUMBER_OF_FIELDS = 2
const getDefaultFieldState = () => ({
  value: '',
  pristine: true,
  touched: false
})
const setup = async () => {
  const Input = ({ input, meta, ...restProps }) => {
    const dataAttrs = {
      'data-pristine': meta.pristine,
      'data-touched': meta.touched
    }
    return <input {...input} {...dataAttrs} {...restProps} />
  }

  const DOM = render(
    <Form onSubmit={nope} mutators={arrayMutators}>
      {({
        form: {
          mutators,
          mutators: { push, move, insert, pop, remove, shift }
        }
      }) => {
        return (
          <Fragment>
            <FieldArray name="fruits">
              {({ fields }) => {
                return fields.map((name, index) => (
                  <Fragment key={name}>
                    <label htmlFor={name}>Fruit {index + 1} name</label>
                    <Field id={name} name={name} component={Input} />
                  </Fragment>
                ))
              }}
            </FieldArray>
            <button
              onKeyPress={e => {
                move('fruits', e.which, e.location)
              }}
            >
              Move fruit
            </button>
            <button
              onKeyPress={e => {
                insert('fruits', e.which, e.key)
              }}
            >
              Insert fruit
            </button>
            <button onClick={() => pop('fruits')}>Remove the last fruit</button>
            <button
              onKeyPress={e => {
                mutators.push('fruits', e.key)
              }}
            >
              Push fruit
            </button>
            <button
              onKeyPress={e => {
                remove('fruits', e.which)
              }}
            >
              Remove fruit
            </button>
            <button onClick={() => shift('fruits')}>Shift fruit</button>
          </Fragment>
        )
      }}
    </Form>
  )

  const Model = []

  const buttonEl = DOM.getByText('Push fruit')
  ;[...Array(INITIAL_NUMBER_OF_FIELDS)].forEach(() => {
    TestUtils.Simulate.keyPress(buttonEl)
    Model.push(getDefaultFieldState())
  })
  await waitForFormToRerender()
  return { DOM, Model }
}
const selectAllInputs = DOM => DOM.container.querySelectorAll('input')

const correctNumberOfInputs = (Model, DOM) => {
  const inputElements = selectAllInputs(DOM)
  expect(inputElements.length).toBe(Model.length)
}

const correctValues = (Model, DOM) => {
  const inputElements = selectAllInputs(DOM)
  const realValues = [...inputElements.values()].map(element => element.value)
  const modelValues = Model.map(fieldState => fieldState.value)
  expect(realValues).toEqual(modelValues)
}

const correctMetadata = (Model, DOM) => {
  const inputElements = selectAllInputs(DOM)
  const realMetadata = [...inputElements].map(
    ({ dataset: { pristine, touched } }) => ({
      pristine,
      touched
    })
  )
  const modelMetadata = Model.map(
    ({ value, ...fieldMetadata }) => fieldMetadata
  ).map(fieldMetadata => {
    // data attributes in DOM are string
    // so transform these bools to strings
    // for comparison purposes
    let modifiedObject = {}
    Object.keys(fieldMetadata).forEach(property => {
      modifiedObject[property] = String(fieldMetadata[property])
    })
    return modifiedObject
  })
  expect(realMetadata).toEqual(modelMetadata)
}

const validateAttributes = (Model, DOM) => {
  correctNumberOfInputs(Model, DOM)
  correctValues(Model, DOM)
  correctMetadata(Model, DOM)
}

class ChangeValue {
  constructor(index, newValue) {
    this.index = index
    this.newValue = newValue
  }
  static generate = () =>
    fc
      .tuple(fc.nat(INITIAL_NUMBER_OF_FIELDS * 2), fc.string())
      .map(args => new ChangeValue(...args))
  toString = () => ` change value at ${this.index} to ${this.newValue}`
  check = Model => {
    if (this.index >= Model.length) return false
    return true
  }
  run = (Model, DOM) => {
    // abstract
    const DEFAULT_FIELD_STATE = getDefaultFieldState()
    const pristine = this.newValue === DEFAULT_FIELD_STATE.value
    Model[this.index] = {
      ...DEFAULT_FIELD_STATE,
      value: this.newValue,
      touched: true,
      pristine
    }
    // real
    const label = `Fruit ${this.index + 1} name`
    const inputEl = DOM.getByLabelText(label)
    fireEvent.focus(inputEl)
    fireEvent.change(inputEl, { target: { value: this.newValue } })
    fireEvent.blur(inputEl)
    // postconditions
    validateAttributes(Model, DOM)
  }
}

class Move {
  constructor(from, to) {
    this.from = from
    this.to = to
  }
  static generate = () =>
    fc
      .tuple(
        fc.nat(INITIAL_NUMBER_OF_FIELDS * 2),
        fc.nat(INITIAL_NUMBER_OF_FIELDS * 2)
      )
      .map(args => new Move(...args))
  toString = () => ` move(${this.from}, ${this.to})`
  check = Model => {
    if (this.from >= Model.length || this.to >= Model.length) return false
    return true
  }
  run = async (Model, DOM) => {
    // abstract
    const cache = Model[this.from]
    Model.splice(this.from, 1)
    Model.splice(this.to, 0, cache)
    // real
    const buttonEl = DOM.getByText('Move fruit')
    TestUtils.Simulate.keyPress(buttonEl, {
      which: this.from,
      location: this.to
    })
    await waitForFormToRerender()
    // postconditions
    validateAttributes(Model, DOM)
  }
}

class Insert {
  constructor(index, value) {
    this.index = index
    this.value = value
  }
  static generate = () =>
    fc
      .tuple(fc.nat(INITIAL_NUMBER_OF_FIELDS * 2), fc.string())
      .map(args => new Insert(...args))
  toString = () => ` insert(${this.index}, ${this.value})`
  check = () => true
  run = async (Model, DOM) => {
    // abstract
    const indexOfTheNewElement = Math.min(Model.length, this.index)
    const DEFAULT_FIELD_STATE = getDefaultFieldState()
    Model.splice(indexOfTheNewElement, 0, {
      ...DEFAULT_FIELD_STATE,
      value: this.value,
      pristine: this.value === DEFAULT_FIELD_STATE.value
    })
    // real
    const buttonEl = DOM.getByText('Insert fruit')
    TestUtils.Simulate.keyPress(buttonEl, {
      which: this.index,
      key: this.value
    })
    await waitForFormToRerender()
    // postconditions
    validateAttributes(Model, DOM)
  }
}

class Pop {
  static generate = () => fc.constant(new Pop())
  toString = () => ' pop()'
  check = () => true
  run = async (Model, DOM) => {
    // abstract
    Model.pop()

    // real
    const buttonEl = DOM.getByText('Remove the last fruit')
    fireEvent.click(buttonEl)
    await waitForFormToRerender()

    // postconditions
    validateAttributes(Model, DOM)
  }
}

class Push {
  constructor(value) {
    this.value = value
  }
  static generate = () => fc.option(fc.string()).map(value => new Push(value))
  toString = () => ` push(${this.value})`
  check = () => true
  run = async (Model, DOM) => {
    // abstract
    Model.push({
      ...getDefaultFieldState(),
      value: this.value,
      pristine: this.value === getDefaultFieldState().value
    })

    // real
    const buttonEl = DOM.getByText('Push fruit')
    TestUtils.Simulate.keyPress(buttonEl, {
      key: this.value
    })
    await waitForFormToRerender()
    // postconditions
    validateAttributes(Model, DOM)
  }
}

class Remove {
  constructor(index) {
    this.index = index
  }
  static generate = () =>
    fc.nat(INITIAL_NUMBER_OF_FIELDS * 2).map(index => new Remove(index))
  toString = () => ` remove(${this.index})`
  check = Model => {
    if (Model.length >= this.index) return false
    return true
  }
  run = async (Model, DOM) => {
    // abstract
    Model.splice(this.index, 1)

    // real
    const buttonEl = DOM.getByText('Remove fruit')
    TestUtils.Simulate.keyPress(buttonEl, {
      which: this.index
    })
    await waitForFormToRerender()
    // postconditions
    validateAttributes(Model, DOM)
  }
}

class Shift {
  static generate = () => fc.constant(new Shift())
  toString = () => ` shift()`
  check = () => true
  run = async (Model, DOM) => {
    // abstract
    Model.shift()

    // real
    const buttonEl = DOM.getByText('Shift fruit')
    fireEvent.click(buttonEl)
    await waitForFormToRerender()
    // postconditions
    validateAttributes(Model, DOM)
  }
}

const generateCommands = [
  ChangeValue.generate(),
  // Move.generate(),
  // Insert.generate(),
  Pop.generate(),
  // Push.generate()
  Remove.generate()
  // Shift.generate()
]

const getInitialState = async () => {
  const { Model, DOM } = await setup()
  return {
    model: Model,
    real: DOM
  }
}

describe('FieldArray', () => {
  it('should work', async () => {
    await fc.assert(
      fc
        .asyncProperty(fc.commands(generateCommands), async commands => {
          await fc.asyncModelRun(getInitialState, commands)
        })
        .afterEach(cleanup),
      {
        numRuns: 100,
        verbose: true,
        // seed: 1842023377,
        // seed: 1842107356,
        // seed: 1881850827,
        // seed: 1882099238,
        examples: [
          // https://github.com/final-form/final-form-arrays/issues/15#issuecomment-442126496
          // [[new Move(1, 0), new ChangeValue(0, 'apple')]]
        ]
      }
    )
  })
})
