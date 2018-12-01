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

    const commands = {
      addField: async () => {
        // abstract
        Model.push('')
        // real
        const buttonEl = DOM.getByText('Add fruit')
        fireEvent.click(buttonEl)
        await waitForFormToRerender()
      },
      changeValue: (index, newValue) => {
        // abstract
        Model[index] = newValue
        // real
        const label = `Fruit ${index + 1} name`
        const inputEl = DOM.getByLabelText(label)
        fireEvent.change(inputEl, { target: { value: newValue } })
      },
      move: async (from, to) => {
        // abstract
        const cache = Model[from]
        Model.splice(from, 1)
        Model.splice(to, 0, cache)
        // real
        const buttonEl = DOM.getByText('Move fruit')
        TestUtils.Simulate.keyPress(buttonEl, { which: from, location: to })
        await waitForFormToRerender()
      }
    }

    await commands.addField()
    commands.changeValue(0, 'apple')
    await commands.addField()
    commands.changeValue(1, 'banana')
    await commands.move(0, 1)
    commands.changeValue(0, 'orange')

    const inputElements = DOM.container.querySelectorAll('input')

    // number of elements should be the same
    expect(inputElements.length).toBe(Model.length)

    // values should be the same
    const realValues = [...inputElements.values()].map(element => element.value)
    console.log(realValues)
    realValues.forEach((realValue, index) => {
      const modelValue = Model[index]
      expect(realValue).toBe(modelValue)
    })

    DOM.unmount()
  })
})
