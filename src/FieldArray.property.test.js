import React, { Fragment } from 'react'
import TestUtils from 'react-dom/test-utils'
import { render, fireEvent } from 'react-testing-library'
import { Form, Field } from 'react-final-form'
import { FieldArray } from 'react-final-form-arrays'
import arrayMutators from 'final-form-arrays'

const nope = () => {}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const waitForFormToRerender = () => sleep(0)
const setup = () =>
  render(
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

describe('FieldArray', () => {
  it('should work', async () => {
    const DOM = setup()
    const Model = []

    const selectAllInputs = () => DOM.container.querySelectorAll('input')

    const correctNumberOfInputs = () => {
      const inputElements = selectAllInputs()
      expect(inputElements.length).toBe(Model.length)
    }

    const correctValues = () => {
      const inputElements = selectAllInputs()
      const realValues = [...inputElements.values()].map(
        element => element.value
      )
      realValues.forEach((realValue, index) => {
        const modelValue = Model[index]
        expect(realValue).toBe(modelValue)
      })
    }

    const commands = {
      addField: {
        preconditions: () => true,
        run: async () => {
          // abstract
          Model.push('')
          // real
          const buttonEl = DOM.getByText('Add fruit')
          fireEvent.click(buttonEl)
          await waitForFormToRerender()
        },
        postconditions: () => {
          correctNumberOfInputs()
          correctValues()
        }
      },
      changeValue: {
        preconditions: (index, newValue) => {
          if (index >= Model.length) return false
          return true
        },
        run: (index, newValue) => {
          // abstract
          Model[index] = newValue
          // real
          const label = `Fruit ${index + 1} name`
          const inputEl = DOM.getByLabelText(label)
          fireEvent.change(inputEl, { target: { value: newValue } })
        },
        postconditions: () => {
          correctNumberOfInputs()
          correctValues()
        }
      },
      move: {
        preconditions: (from, to) => {
          if (from >= Model.length || to >= Model.length) return false
          return true
        },
        run: async (from, to) => {
          // abstract
          const cache = Model[from]
          Model.splice(from, 1)
          Model.splice(to, 0, cache)
          // real
          const buttonEl = DOM.getByText('Move fruit')
          TestUtils.Simulate.keyPress(buttonEl, { which: from, location: to })
          await waitForFormToRerender()
        },
        postconditions: () => {
          correctNumberOfInputs()
          correctValues()
        }
      }
    }

    function execute(command) {
      return {
        with: async (...args) => {
          if (!command.preconditions(...args)) {
            throw Error('command cannot be executed');
          }
          await command.run(...args)
          command.postconditions(...args)
        }
      }
    }

    await execute(commands.addField).with()
    await execute(commands.changeValue).with(0, 'apple')
    await execute(commands.addField).with()
    await execute(commands.changeValue).with(1, 'banana')
    await execute(commands.move).with(0, 1)
    await execute(commands.changeValue).with(0, 'orange')

    DOM.unmount()
  })
})
