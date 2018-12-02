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
const getFieldState = ({ value = '', touched = false } = {}) => {
  const pristine = value === ''
  return { value: value || '', pristine, touched }
}
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
          mutators: { push, move, insert, pop, remove, shift, swap, update }
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
              onClick={({ index, value }) => {
                console.log(index, value)
                insert('fruits', index, value)
              }}
            >
              Insert fruit
            </button>
            <button
              onClick={({ from, to }) => {
                move('fruits', from, to)
              }}
            >
              Move fruit
            </button>
            <button onClick={() => pop('fruits')}>Remove the last fruit</button>
            <button
              onClick={({ value }) => {
                mutators.push('fruits', value)
              }}
            >
              Push fruit
            </button>
            <button
              onClick={({ index }) => {
                remove('fruits', index)
              }}
            >
              Remove fruit
            </button>
            <button onClick={() => shift('fruits')}>Shift fruit</button>
            <button
              onClick={({ a, b }) => {
                swap('fruits', a, b)
              }}
            >
              Swap fruits
            </button>
            <button
              onClick={({ index, value }) => {
                update('fruits', index, value)
              }}
            >
              Update fruit
            </button>
          </Fragment>
        )
      }}
    </Form>
  )

  const Model = []

  const buttonEl = DOM.getByText('Push fruit')
  ;[...Array(INITIAL_NUMBER_OF_FIELDS)].forEach(() => {
    TestUtils.Simulate.click(buttonEl)
    Model.push(getFieldState())
  })
  await waitForFormToRerender()
  return { DOM, Model }
}
const selectAllInputs = DOM => DOM.container.querySelectorAll('input')

const realMatchesModel = (Model, DOM) => {
  const inputElements = selectAllInputs(DOM)
  const realMetadata = [...inputElements].map(
    ({ value, dataset: { pristine, touched } }) => ({
      value,
      pristine: pristine === 'true',
      touched: touched === 'true'
    })
  )
  expect(realMetadata).toEqual(Model)
}

const validateAttributes = (Model, DOM) => {
  realMatchesModel(Model, DOM)
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
    Model[this.index] = getFieldState({ value: this.newValue, touched: true })

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
    TestUtils.Simulate.click(buttonEl, {
      from: this.from,
      to: this.to
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
    Model.splice(indexOfTheNewElement, 0, getFieldState({ value: this.value }))

    // real
    const buttonEl = DOM.getByText('Insert fruit')
    TestUtils.Simulate.click(buttonEl, {
      index: this.index,
      value: this.value
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
    Model.push(getFieldState({ value: this.value }))

    // real
    const buttonEl = DOM.getByText('Push fruit')
    TestUtils.Simulate.click(buttonEl, {
      value: this.value
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
    TestUtils.Simulate.click(buttonEl, {
      index: this.index
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

class Swap {
  constructor(a, b) {
    this.a = a
    this.b = b
  }
  static generate = () =>
    fc
      .tuple(
        fc.nat(INITIAL_NUMBER_OF_FIELDS * 2),
        fc.nat(INITIAL_NUMBER_OF_FIELDS * 2)
      )
      .map(args => new Swap(...args))
  toString = () => ` swap(${this.a}, ${this.b})`
  check = Model => {
    if (this.a >= Model.length || this.b >= Model.length) return false
    return true
  }
  run = async (Model, DOM) => {
    // abstract
    const cache = Model[this.a]
    Model[this.a] = Model[this.b]
    Model[this.b] = cache
    // real
    const buttonEl = DOM.getByText('Swap fruits')
    TestUtils.Simulate.click(buttonEl, {
      a: this.a,
      b: this.b
    })
    await waitForFormToRerender()
    // postconditions
    validateAttributes(Model, DOM)
  }
}

class Update {
  constructor(index, newValue) {
    this.index = index
    this.newValue = newValue
  }
  static generate = () =>
    fc
      .tuple(fc.nat(INITIAL_NUMBER_OF_FIELDS * 2), fc.string())
      .map(args => new Update(...args))
  toString = () => ` update(${this.index}, ${this.newValue})`
  check = Model => {
    if (this.index >= Model.length) return false
    return true
  }
  run = async (Model, DOM) => {
    // abstract
    Model[this.index] = getFieldState({ value: this.newValue, touched: true })

    // real
    const buttonEl = DOM.getByText('Update fruit')
    TestUtils.Simulate.click(buttonEl, {
      index: this.index,
      value: this.newValue
    })
    await waitForFormToRerender()
    // postconditions
    validateAttributes(Model, DOM)
  }
}

const generateCommands = [
  ChangeValue.generate(),
  // Insert.generate()
  // Move.generate(),
  Pop.generate(),
  // Push.generate(),
  Remove.generate()
  // Shift.generate()
  // Swap.generate()
  // Update.generate()
  // Unshift.generate()
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
