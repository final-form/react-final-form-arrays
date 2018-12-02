import React, { Fragment } from 'react'
import TestUtils from 'react-dom/test-utils'
import { render, fireEvent, cleanup } from 'react-testing-library'
import { Form, Field } from 'react-final-form'
import { FieldArray } from 'react-final-form-arrays'
import arrayMutators from 'final-form-arrays'
import fc from 'fast-check'

const nope = () => {}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const waitForFormToRerender = () => sleep(0)
const INITIAL_NUMBER_OF_FIELDS = 2
const setup = async () => {
  const DOM = render(
    <Form onSubmit={nope} mutators={arrayMutators}>
      {({
        form: {
          mutators: { push, move }
        }
      }) => {
        return (
          <Fragment>
            <FieldArray name="fruits">
              {({ fields }) => {
                return fields.map((name, index) => (
                  <Fragment key={name}>
                    <label htmlFor={name}>Fruit {index + 1} name</label>
                    <Field id={name} name={name} component="input" />
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
          </Fragment>
        )
      }}
    </Form>
  )

  const Model = []

  const buttonEl = DOM.getByText('Add fruit')
  ;[...Array(INITIAL_NUMBER_OF_FIELDS)].forEach(() => {
    fireEvent.click(buttonEl)
    Model.push('')
  })
  await waitForFormToRerender()
  return { DOM, Model }
}

describe('FieldArray', () => {
  it('should work', async () => {
    const selectAllInputs = DOM => DOM.container.querySelectorAll('input')

    const correctNumberOfInputs = (Model, DOM) => {
      const inputElements = selectAllInputs(DOM)
      expect(inputElements.length).toBe(Model.length)
    }

    const correctValues = (Model, DOM) => {
      const inputElements = selectAllInputs(DOM)
      const realValues = [...inputElements.values()].map(
        element => element.value
      )
      realValues.forEach((realValue, index) => {
        const modelValue = Model[index]
        expect(realValue).toBe(modelValue)
      })
    }

    const commands = {
      AddField: function addField() {
        return {
          toString: () => 'add field',
          check: () => true,
          run: async (Model, DOM) => {
            // abstract
            Model.push('')
            // real
            const buttonEl = DOM.getByText('Add fruit')
            fireEvent.click(buttonEl)
            await waitForFormToRerender()
            // postconditions
            correctNumberOfInputs(Model, DOM)
            correctValues(Model, DOM)
          }
        }
      },
      ChangeValue: function ChangeValue(index, newValue) {
        return {
          toString: () => `change value at ${index} to ${newValue}`,
          check: Model => {
            if (index >= Model.length) return false
            return true
          },
          run: (Model, DOM) => {
            // abstract
            Model[index] = newValue
            // real
            const label = `Fruit ${index + 1} name`
            const inputEl = DOM.getByLabelText(label)
            fireEvent.change(inputEl, { target: { value: newValue } })
            // postconditions
            correctNumberOfInputs(Model, DOM)
            correctValues(Model, DOM)
          }
        }
      },
      Move: function Move(from, to) {
        return {
          toString: () => `move ${from} to ${to}`,
          check: Model => {
            if (from >= Model.length || to >= Model.length) return false
            return true
          },
          run: async (Model, DOM) => {
            // abstract
            const cache = Model[from]
            Model.splice(from, 1)
            Model.splice(to, 0, cache)
            // real
            const buttonEl = DOM.getByText('Move fruit')
            TestUtils.Simulate.keyPress(buttonEl, { which: from, location: to })
            await waitForFormToRerender()
            // postconditions
            correctNumberOfInputs(Model, DOM)
            correctValues(Model, DOM)
          }
        }
      }
    }

    const genericModelRun = async (setup, commands, initialValue, then) => {
      const { model, real } = await setup()
      let state = initialValue
      for (const c of commands) {
        state = then(state, () => {
          if (c.check(model)) return c.run(model, real)
        })
      }
      return state
    }

    const asyncModelRun = (setup, commands) => {
      const then = (p, c) => p.then(c)
      return genericModelRun(setup, commands, Promise.resolve(), then)
    }

    await fc.assert(
      fc
        .asyncProperty(
          fc.commands([
            fc.constant(new commands.AddField()),
            fc
              .tuple(fc.nat(INITIAL_NUMBER_OF_FIELDS), fc.string())
              .map(args => new commands.ChangeValue(...args)),
            fc
              .tuple(
                fc.nat(INITIAL_NUMBER_OF_FIELDS),
                fc.nat(INITIAL_NUMBER_OF_FIELDS)
              )
              .map(args => new commands.Move(...args))
          ]),
          async commands => {
            const getInitialState = async () => {
              const { Model, DOM } = await setup()
              return {
                model: Model,
                real: DOM
              }
            }
            await asyncModelRun(getInitialState, commands)
          }
        )
        .afterEach(cleanup),
      {
        numRuns: 100,
        verbose: true
      }
    )
  })
})
