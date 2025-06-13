import React, { Fragment } from 'react'
import { render, fireEvent, cleanup } from '@testing-library/react'
import { Form, Field } from 'react-final-form'
import arrayMutators from 'final-form-arrays'
import fc from 'fast-check'
import FieldArray from './FieldArray'

const noop = () => {}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const waitForFormToRerender = () => sleep(0)
const INITIAL_NUMBER_OF_FIELDS = 2

class ModelConstruct {
  constructor(initialValues) {
    this.state = {
      initialValues: initialValues || [],
      fields: (initialValues || []).map(value => ({
        value,
        touched: false,
        pristine: true
      }))
    }
  }

  getFieldsState() {
    return this.state.fields
  }

  getFieldsLength() {
    return this.state.fields.length
  }

  recalculatePristine() {
    ;(this.state.fields || []).forEach((fieldState, index) => {
      const initialValue = this.state.initialValues[index] || ''
      fieldState.pristine = fieldState.value === initialValue
    })
  }

  changeValue(index, newValue) {
    this.state.fields[index] = {
      value: newValue || '',
      touched: true
    }
    this.recalculatePristine()
  }

  insert(index, value) {
    const indexOfTheNewElement = Math.min(this.state.fields.length, index)
    this.state.fields.splice(indexOfTheNewElement, 0, {
      value: value || '',
      touched: false
    })
    this.recalculatePristine()
  }

  move(from, to) {
    const cache = this.state.fields[from]
    this.state.fields.splice(from, 1)
    this.state.fields.splice(to, 0, cache)
    this.recalculatePristine()
  }

  pop() {
    this.state.fields.pop()
    this.recalculatePristine()
  }

  push(value) {
    this.state.fields.push({ value: value || '', touched: false })
    this.recalculatePristine()
  }

  remove(index) {
    this.state.fields.splice(index, 1)
    this.recalculatePristine()
  }

  shift() {
    this.state.fields.shift()
    this.recalculatePristine()
  }

  swap(a, b) {
    const cache = this.state.fields[a]
    this.state.fields[a] = this.state.fields[b]
    this.state.fields[b] = cache
    this.recalculatePristine()
  }

  update(index, newValue) {
    const field = this.state.fields[index]
    this.state.fields[index] = { value: newValue || '', touched: field.touched }
    this.recalculatePristine()
  }

  unshift(value) {
    this.state.fields.unshift({ value: value || '', touched: false })
    this.recalculatePristine()
  }
}

const setup = async ({ initialValues }) => {
  const Input = ({ input, meta, ...restProps }) => {
    const dataAttrs = {
      'data-pristine': meta.pristine,
      'data-touched': meta.touched
    }
    return <input {...input} {...dataAttrs} {...restProps} />
  }

  const DOM = render(
    <Form
      onSubmit={noop}
      initialValues={initialValues}
      mutators={arrayMutators}
    >
      {() => {
        return (
          <FieldArray name="fruits">
            {({ fields }) => (
              <Fragment>
                {fields.map((name, index) => (
                  <Fragment key={name}>
                    <label htmlFor={name}>Fruit {index + 1} name</label>
                    <Field id={name} name={name} component={Input} />
                  </Fragment>
                ))}
                <button
                  onClick={({ index, value }) => {
                    fields.insert(index, value)
                  }}
                >
                  Insert fruit
                </button>
                <button
                  onClick={({ from, to }) => {
                    fields.move(from, to)
                  }}
                >
                  Move fruit
                </button>
                <button onClick={() => fields.pop()}>
                  Remove the last fruit
                </button>
                <button
                  onClick={({ value }) => {
                    fields.push(value)
                  }}
                >
                  Push fruit
                </button>
                <button
                  onClick={({ index }) => {
                    fields.remove(index)
                  }}
                >
                  Remove fruit
                </button>
                <button onClick={() => fields.shift()}>Shift fruit</button>
                <button
                  onClick={({ a, b }) => {
                    fields.swap(a, b)
                  }}
                >
                  Swap fruits
                </button>
                <button
                  onClick={({ index, value }) => {
                    fields.update(index, value)
                  }}
                >
                  Update fruit
                </button>
                <button
                  onClick={({ value }) => {
                    fields.unshift(value)
                  }}
                >
                  Unshift fruit
                </button>
              </Fragment>
            )}
          </FieldArray>
        )
      }}
    </Form>
  )

  const Model = new ModelConstruct(initialValues.fruits)
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
  expect(realMetadata).toEqual(Model.getFieldsState())
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
  toString = () => ` change value at ${this.index} to '${this.newValue}'`
  check = Model => {
    if (this.index >= Model.getFieldsLength()) return false
    return true
  }
  run = (Model, DOM) => {
    // abstract
    Model.changeValue(this.index, this.newValue)

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
    const length = Model.getFieldsLength()
    if (this.from >= length || this.to >= length) return false
    return true
  }
  run = async (Model, DOM) => {
    // abstract
    Model.move(this.from, this.to)

    // real
    fireEvent.click(DOM.getByText('Move fruit'), {
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
  toString = () => ` insert(${this.index}, '${this.value}')`
  check = () => true
  run = async (Model, DOM) => {
    // abstract
    Model.insert(this.index, this.value)

    // real
    fireEvent.click(DOM.getByText('Insert fruit'), {
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
  toString = () => ` push('${this.value}')`
  check = () => true
  run = async (Model, DOM) => {
    // abstract
    Model.push(this.value)

    // real
    fireEvent.click(DOM.getByText('Push fruit'), {
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
    Model.remove(this.index)

    // real
    fireEvent.click(DOM.getByText('Remove fruit'), {
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
    const length = Model.getFieldsLength()
    if (this.a >= length || this.b >= length) return false
    return true
  }
  run = async (Model, DOM) => {
    // abstract
    Model.swap(this.a, this.b)

    // real
    fireEvent.click(DOM.getByText('Swap fruits'), {
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
  toString = () => ` update(${this.index}, '${this.newValue}')`
  check = Model => {
    if (this.index >= Model.getFieldsLength()) return false
    return true
  }
  run = async (Model, DOM) => {
    // abstract
    Model.update(this.index, this.newValue)

    // real
    fireEvent.click(DOM.getByText('Update fruit'), {
      index: this.index,
      value: this.newValue
    })
    await waitForFormToRerender()
    // postconditions
    validateAttributes(Model, DOM)
  }
}

class Unshift {
  constructor(value) {
    this.value = value
  }
  static generate = () =>
    fc.option(fc.string()).map(value => new Unshift(value))
  toString = () => ` unshift('${this.value}')`
  check = () => true
  run = async (Model, DOM) => {
    // abstract
    Model.unshift(this.value)

    // real
    fireEvent.click(DOM.getByText('Unshift fruit'), {
      value: this.value
    })
    await waitForFormToRerender()
    // postconditions
    validateAttributes(Model, DOM)
  }
}

const generateCommands = [
  ChangeValue.generate(),
  Insert.generate(),
  Move.generate(),
  Pop.generate(),
  Push.generate(),
  Remove.generate(),
  Shift.generate(),
  Swap.generate(),
  Update.generate(),
  Unshift.generate()
]

const getInitialState = initialValues => async () => {
  const { Model, DOM } = await setup({ initialValues })
  return {
    model: Model,
    real: DOM
  }
}

const initialValues = fc.record({ fruits: fc.option(fc.array(fc.string())) })

describe('FieldArray', () => {
  it('should work', async () => {
    await fc.assert(
      fc
        .asyncProperty(
          fc.commands(generateCommands),
          initialValues,
          async (commands, initialValues) => {
            const stateBuilder = getInitialState(initialValues)
            await fc.asyncModelRun(stateBuilder, commands)
          }
        )
        .afterEach(cleanup)
    )
  })
})
