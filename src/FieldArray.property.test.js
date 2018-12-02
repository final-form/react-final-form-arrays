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
  dirty: false,
  touched: false
})
const setup = async () => {
  const Input = ({ input, meta, ...restProps }) => {
    const dataAttrs = {
      'data-dirty': meta.dirty,
      'data-touched': meta.touched
    }
    return <input {...input} {...dataAttrs} {...restProps} />
  }

  const DOM = render(
    <Form onSubmit={nope} mutators={arrayMutators}>
      {({
        form: {
          mutators: { push, move, insert, pop }
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
              onClick={() => {
                push('fruits')
              }}
            >
              Add fruit
            </button>
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
          </Fragment>
        )
      }}
    </Form>
  )

  const Model = []

  const buttonEl = DOM.getByText('Add fruit')
  ;[...Array(INITIAL_NUMBER_OF_FIELDS)].forEach(() => {
    fireEvent.click(buttonEl)
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

class AddField {
  static generate = () => fc.constant(new commands.AddField())
  toString = () => 'add field'
  check = () => true
  run = async (Model, DOM) => {
    // abstract
    Model.push(getDefaultFieldState())
    // real
    const buttonEl = DOM.getByText('Add fruit')
    fireEvent.click(buttonEl)
    await waitForFormToRerender()
    // postconditions
    correctNumberOfInputs(Model, DOM)
    correctValues(Model, DOM)
  }
}

class ChangeValue {
  constructor(index, newValue) {
    this.index = index
    this.newValue = newValue
  }
  static generate = () =>
    fc
      .tuple(fc.nat(INITIAL_NUMBER_OF_FIELDS * 2), fc.string())
      .map(args => new commands.ChangeValue(...args))
  toString = () => `change value at ${this.index} to ${this.newValue}`
  check = Model => {
    if (this.index >= Model.length) return false
    return true
  }
  run = (Model, DOM) => {
    // abstract
    Model[this.index].value = this.newValue
    // real
    const label = `Fruit ${this.index + 1} name`
    const inputEl = DOM.getByLabelText(label)
    fireEvent.change(inputEl, { target: { value: this.newValue } })
    // postconditions
    correctNumberOfInputs(Model, DOM)
    correctValues(Model, DOM)
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
      .map(args => new commands.Move(...args))
  toString = () => `move ${this.from} to ${this.to}`
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
    correctNumberOfInputs(Model, DOM)
    correctValues(Model, DOM)
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
      .map(args => new commands.Insert(...args))
  toString = () => `insert ${this.value} at ${this.index}`
  check = () => true
  run = async (Model, DOM) => {
    // abstract
    const indexOfTheNewElement = Math.min(Model.length, this.index)
    Model.splice(indexOfTheNewElement, 0, {
      ...getDefaultFieldState(),
      value: this.value
    })
    // real
    const buttonEl = DOM.getByText('Insert fruit')
    TestUtils.Simulate.keyPress(buttonEl, {
      which: this.index,
      key: this.value
    })
    await waitForFormToRerender()
    // postconditions
    correctNumberOfInputs(Model, DOM)
    correctValues(Model, DOM)
  }
}

class Pop {
  static generate = () => fc.constant(new commands.Pop())
  toString = () => 'removing the last element'
  check = () => true
  run = async (Model, DOM) => {
    // abstract
    Model.pop()

    // real
    const buttonEl = DOM.getByText('Remove the last fruit')
    fireEvent.click(buttonEl)
    await waitForFormToRerender()

    // postconditions
    correctNumberOfInputs(Model, DOM)
    correctValues(Model, DOM)
  }
}

const commands = {
  AddField,
  ChangeValue,
  Move,
  Insert,
  Pop
}

const generateCommands = [
  commands.AddField.generate(),
  commands.ChangeValue.generate(),
  // commands.Move.generate(),
  commands.Insert.generate(),
  commands.Pop.generate()
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
        examples: [
          // https://github.com/final-form/final-form-arrays/issues/15#issuecomment-442126496
          // [[new commands.Move(1, 0), new commands.ChangeValue(0, 'apple')]]
          // form is not pristine after inserting
        ]
      }
    )
  })
})
