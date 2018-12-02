import React, { Fragment } from 'react'
import TestUtils from 'react-dom/test-utils'
import {
  render,
  fireEvent,
  cleanup,
  waitForElement
} from 'react-testing-library'
import fc from 'fast-check'
import { Form, Field } from 'react-final-form'
import arrayMutators from 'final-form-arrays'
import FieldArray from './FieldArray'

const onSubmitMock = values => {}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

describe('FieldArray', () => {
  it('should warn error if not used inside a form', () => {
    const spy = jest.spyOn(global.console, 'error').mockImplementation(() => {})
    TestUtils.renderIntoDocument(
      <FieldArray name="foo" render={() => <div />} />
    )
    expect(spy).toHaveBeenCalled()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(
      'Warning: FieldArray must be used inside of a ReactFinalForm component'
    )
    spy.mockRestore()
  })

  it('should warn if no render strategy is provided', () => {
    const spy = jest.spyOn(global.console, 'error').mockImplementation(() => {})
    TestUtils.renderIntoDocument(
      <Form
        onSubmit={onSubmitMock}
        mutators={arrayMutators}
        render={() => <FieldArray name="foo" />}
      />
    )
    expect(spy).toHaveBeenCalled()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(
      'Warning: Must specify either a render prop, a render function as children, or a component prop to FieldArray(foo)'
    )
    spy.mockRestore()
  })

  it('should warn if no array mutators provided', () => {
    const spy = jest.spyOn(global.console, 'error').mockImplementation(() => {})
    TestUtils.renderIntoDocument(
      <Form onSubmit={onSubmitMock}>
        {() => <FieldArray name="foo" render={() => <div />} />}
      </Form>
    )
    expect(spy).toHaveBeenCalled()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(
      'Warning: Array mutators not found. You need to provide the mutators from final-form-arrays to your form'
    )
    spy.mockRestore()
  })

  it('should render with a render component', () => {
    const MyComp = jest.fn(() => <div />)
    TestUtils.renderIntoDocument(
      <Form onSubmit={onSubmitMock} mutators={arrayMutators}>
        {() => <FieldArray name="foo" component={MyComp} />}
      </Form>
    )
    expect(MyComp).toHaveBeenCalled()
    expect(MyComp).toHaveBeenCalledTimes(1)
  })

  it('should resubscribe if name changes', async () => {
    const renderArray = jest.fn(() => <div />)
    class Container extends React.Component {
      state = { name: 'dogs' }

      render() {
        return (
          <Form
            onSubmit={onSubmitMock}
            mutators={arrayMutators}
            subscription={{}}
            initialValues={{ dogs: ['Odie'], cats: ['Garfield'] }}
          >
            {() => (
              <form>
                <FieldArray {...this.state} render={renderArray} />
                <button
                  type="button"
                  onClick={() => this.setState({ name: 'cats' })}
                >
                  Switch
                </button>
              </form>
            )}
          </Form>
        )
      }
    }
    expect(renderArray).not.toHaveBeenCalled()
    const dom = TestUtils.renderIntoDocument(<Container />)
    expect(renderArray).toHaveBeenCalled()
    expect(renderArray).toHaveBeenCalledTimes(1)
    expect(renderArray.mock.calls[0][0].fields.value).toEqual(['Odie'])

    const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
    TestUtils.Simulate.click(button)
    await sleep(10)

    expect(renderArray).toHaveBeenCalledTimes(4)
    expect(renderArray.mock.calls[3][0].fields.value).toEqual(['Garfield'])
  })

  it('should not resubscribe if name changes when not inside a <Form> (duh)', () => {
    // This test is mainly for code coverage
    const renderArray = jest.fn(() => <div />)
    class Container extends React.Component {
      state = { name: 'dogs' }

      render() {
        return (
          <form>
            <FieldArray {...this.state} render={renderArray} />
            <button
              type="button"
              onClick={() => this.setState({ name: 'cats' })}
            >
              Switch
            </button>
          </form>
        )
      }
    }
    expect(renderArray).not.toHaveBeenCalled()
    const dom = TestUtils.renderIntoDocument(<Container />)
    expect(renderArray).toHaveBeenCalled()
    expect(renderArray).toHaveBeenCalledTimes(1)
    expect(renderArray.mock.calls[0][0].value).toBeUndefined()

    const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
    TestUtils.Simulate.click(button)

    expect(renderArray).toHaveBeenCalledTimes(2)
    expect(renderArray.mock.calls[1][0].value).toBeUndefined()
  })

  it('should render via children render function', () => {
    const renderArray = jest.fn(() => <div />)
    const render = jest.fn(() => (
      <form>
        <FieldArray name="foo">{renderArray}</FieldArray>
      </form>
    ))
    expect(render).not.toHaveBeenCalled()
    TestUtils.renderIntoDocument(
      <Form onSubmit={onSubmitMock} render={render} />
    )
    expect(render).toHaveBeenCalled()
    expect(render).toHaveBeenCalledTimes(1)
    expect(renderArray).toHaveBeenCalled()
    expect(renderArray).toHaveBeenCalledTimes(1)
  })

  it('should always have length, even if not subscribed', () => {
    const renderArray = jest.fn(() => <div />)
    const render = jest.fn(() => (
      <form>
        <FieldArray name="foo" subscription={{ dirty: true }}>
          {renderArray}
        </FieldArray>
      </form>
    ))
    expect(render).not.toHaveBeenCalled()
    TestUtils.renderIntoDocument(
      <Form
        onSubmit={onSubmitMock}
        render={render}
        initialValues={{ foo: ['a', 'b'] }}
      />
    )
    expect(render).toHaveBeenCalled()
    expect(render).toHaveBeenCalledTimes(1)
    expect(renderArray).toHaveBeenCalled()
    expect(renderArray).toHaveBeenCalledTimes(1)
    expect(renderArray.mock.calls[0][0].meta.dirty).not.toBeUndefined()
    expect(renderArray.mock.calls[0][0].meta.dirty).toBe(false)
    expect(renderArray.mock.calls[0][0].fields.length).not.toBeUndefined()
    expect(renderArray.mock.calls[0][0].fields.length).toBe(2)
  })

  it('should unsubscribe on unmount', () => {
    // This is mainly here for code coverage. 🧐
    class Container extends React.Component {
      state = { shown: true }

      render() {
        return (
          <Form onSubmit={onSubmitMock} mutators={arrayMutators}>
            {() => (
              <form>
                {this.state.shown && (
                  <FieldArray name="foo" render={() => <div />} />
                )}
                <button
                  type="button"
                  onClick={() => this.setState({ shown: false })}
                >
                  Unmount
                </button>
              </form>
            )}
          </Form>
        )
      }
    }
    const dom = TestUtils.renderIntoDocument(<Container />)
    const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
    TestUtils.Simulate.click(button)
  })

  it('should allow field-level validation', async () => {
    const renderArray = jest.fn(() => <div />)
    const validate = jest.fn(value =>
      value.length > 2 ? 'Too long' : undefined
    )
    const render = jest.fn(() => (
      <form>
        <FieldArray name="foo" validate={validate}>
          {renderArray}
        </FieldArray>
      </form>
    ))
    expect(render).not.toHaveBeenCalled()
    TestUtils.renderIntoDocument(
      <Form
        onSubmit={onSubmitMock}
        mutators={arrayMutators}
        render={render}
        initialValues={{ foo: ['a', 'b'] }}
      />
    )
    expect(render).toHaveBeenCalled()
    expect(render).toHaveBeenCalledTimes(1)
    expect(renderArray).toHaveBeenCalled()
    expect(renderArray).toHaveBeenCalledTimes(1)
    expect(renderArray.mock.calls[0][0].meta.valid).toBe(true)
    expect(validate).toHaveBeenCalled()

    expect(typeof renderArray.mock.calls[0][0].fields.push).toBe('function')

    renderArray.mock.calls[0][0].fields.push('c')
    await sleep(2)

    expect(renderArray).toHaveBeenCalledTimes(3)
    expect(renderArray.mock.calls[2][0].meta.valid).toBe(false)
    expect(renderArray.mock.calls[2][0].meta.error).toBe('Too long')
  })

  it('should provide forEach', () => {
    const renderArray = jest.fn(() => <div />)
    const render = jest.fn(() => (
      <form>
        <FieldArray name="foo">{renderArray}</FieldArray>
      </form>
    ))
    expect(render).not.toHaveBeenCalled()
    TestUtils.renderIntoDocument(
      <Form
        onSubmit={onSubmitMock}
        mutators={arrayMutators}
        render={render}
        initialValues={{ foo: ['a', 'b', 'c'] }}
      />
    )
    expect(render).toHaveBeenCalled()
    expect(render).toHaveBeenCalledTimes(1)
    expect(renderArray).toHaveBeenCalled()
    expect(renderArray).toHaveBeenCalledTimes(1)

    expect(typeof renderArray.mock.calls[0][0].fields.forEach).toBe('function')
    const spy = jest.fn()
    const result = renderArray.mock.calls[0][0].fields.forEach(spy)
    expect(result).toBeUndefined()

    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[0]).toEqual(['foo[0]', 0])
    expect(spy.mock.calls[1]).toEqual(['foo[1]', 1])
    expect(spy.mock.calls[2]).toEqual(['foo[2]', 2])
  })

  it('should provide map', () => {
    const renderArray = jest.fn(() => <div />)
    const render = jest.fn(() => (
      <form>
        <FieldArray name="foo">{renderArray}</FieldArray>
      </form>
    ))
    expect(render).not.toHaveBeenCalled()
    TestUtils.renderIntoDocument(
      <Form
        onSubmit={onSubmitMock}
        mutators={arrayMutators}
        render={render}
        initialValues={{ foo: ['a', 'b', 'c'] }}
      />
    )
    expect(render).toHaveBeenCalled()
    expect(render).toHaveBeenCalledTimes(1)
    expect(renderArray).toHaveBeenCalled()
    expect(renderArray).toHaveBeenCalledTimes(1)

    expect(typeof renderArray.mock.calls[0][0].fields.map).toBe('function')
    const spy = jest.fn(name => name.toUpperCase())
    const result = renderArray.mock.calls[0][0].fields.map(spy)

    expect(spy).toHaveBeenCalledTimes(3)
    expect(spy.mock.calls[0]).toEqual(['foo[0]', 0])
    expect(spy.mock.calls[1]).toEqual(['foo[1]', 1])
    expect(spy.mock.calls[2]).toEqual(['foo[2]', 2])
    expect(result).toEqual(['FOO[0]', 'FOO[1]', 'FOO[2]'])
  })

  it('calculate dirty/pristine using provided isEqual predicate', async () => {
    const renderInput = jest.fn(({ input }) => <input {...input} />)
    const renderFields = jest.fn(({ fields }) =>
      fields.map(field => (
        <Field
          name={`${field}.bar`}
          key={`${field}.bar`}
          component={renderInput}
        />
      ))
    )
    const isEqual = jest.fn(
      (aArray, bArray) =>
        !aArray.some((a, index) => a.bar !== bArray[index].bar)
    )
    TestUtils.renderIntoDocument(
      <Form
        onSubmit={onSubmitMock}
        initialValues={{ foo: [{ bar: 'a' }, { bar: 'b' }] }}
      >
        {() => (
          <form>
            <FieldArray
              name="foo"
              subscription={{ dirty: true }}
              isEqual={isEqual}
            >
              {renderFields}
            </FieldArray>
          </form>
        )}
      </Form>
    )
    expect(renderInput).toHaveBeenCalled()
    expect(renderInput).toHaveBeenCalledTimes(2)
    expect(renderInput.mock.calls[0][0].input.value).toBe('a')
    expect(renderInput.mock.calls[1][0].input.value).toBe('b')

    expect(renderFields).toHaveBeenCalledTimes(1)
    expect(renderFields.mock.calls[0][0].meta.dirty).toBe(false)

    // change value
    renderInput.mock.calls[1][0].input.onChange('c')

    expect(renderInput).toHaveBeenCalledTimes(5)
    expect(renderInput.mock.calls[4][0].input.value).toBe('c')
    expect(renderInput.mock.calls[4][0].meta.dirty).toBe(true)

    await sleep(1)
    expect(renderFields).toHaveBeenCalledTimes(3)
    expect(renderFields.mock.calls[2][0].meta.dirty).toBe(true)
  })

  it('should allow Field components to be rendered', async () => {
    const renderInput = jest.fn(({ input }) => <input {...input} />)
    const dom = TestUtils.renderIntoDocument(
      <Form
        onSubmit={onSubmitMock}
        mutators={arrayMutators}
        subscription={{}}
        render={() => (
          <form>
            <FieldArray name="foo" subscription={{}}>
              {({ fields }) => (
                <div>
                  {fields.map(name => (
                    <Field name={name} key={name} render={renderInput} />
                  ))}
                  <button type="button" onClick={() => fields.push()}>
                    Add
                  </button>
                </div>
              )}
            </FieldArray>
          </form>
        )}
      />
    )
    expect(renderInput).not.toHaveBeenCalled()

    const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
    TestUtils.Simulate.click(button)

    await sleep(2)
    expect(renderInput).toHaveBeenCalled()
    expect(renderInput).toHaveBeenCalledTimes(1)
    expect(renderInput.mock.calls[0][0].input.name).toBe('foo[0]')
    expect(renderInput.mock.calls[0][0].input.value).toBe('')

    renderInput.mock.calls[0][0].input.onChange('dog')

    expect(renderInput).toHaveBeenCalledTimes(2)
    expect(renderInput.mock.calls[1][0].input.value).toBe('dog')

    TestUtils.Simulate.click(button)
    await sleep(2)

    // it must rerender foo[0] because the whole array is rerendered due to the change of length
    expect(renderInput).toHaveBeenCalledTimes(4)
    expect(renderInput.mock.calls[3][0].input.name).toBe('foo[1]')
    expect(renderInput.mock.calls[3][0].input.value).toBe('')
  })

  it('should allow Fields to be rendered for complex objects', async () => {
    const renderFirstNameInput = jest.fn(({ input }) => <input {...input} />)
    const renderLastNameInput = jest.fn(({ input }) => <input {...input} />)
    const dom = TestUtils.renderIntoDocument(
      <Form
        onSubmit={onSubmitMock}
        mutators={arrayMutators}
        subscription={{}}
        render={() => (
          <form>
            <FieldArray name="foo" subscription={{}}>
              {({ fields }) => (
                <div>
                  {fields.map(name => (
                    <div key={name}>
                      <Field
                        name={`${name}.firstName`}
                        render={renderFirstNameInput}
                      />
                      <Field
                        name={`${name}.lastName`}
                        render={renderLastNameInput}
                      />
                    </div>
                  ))}
                  <button type="button" onClick={() => fields.push({})}>
                    Add
                  </button>
                </div>
              )}
            </FieldArray>
          </form>
        )}
      />
    )
    expect(renderFirstNameInput).not.toHaveBeenCalled()
    expect(renderLastNameInput).not.toHaveBeenCalled()

    const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
    TestUtils.Simulate.click(button)
    await sleep(2)

    expect(renderFirstNameInput).toHaveBeenCalled()
    expect(renderFirstNameInput).toHaveBeenCalledTimes(1)
    expect(renderFirstNameInput.mock.calls[0][0].input.name).toBe(
      'foo[0].firstName'
    )
    expect(renderFirstNameInput.mock.calls[0][0].input.value).toBe('')

    expect(renderLastNameInput).toHaveBeenCalled()
    expect(renderLastNameInput).toHaveBeenCalledTimes(1)
    expect(renderLastNameInput.mock.calls[0][0].input.name).toBe(
      'foo[0].lastName'
    )
    expect(renderLastNameInput.mock.calls[0][0].input.value).toBe('')

    renderFirstNameInput.mock.calls[0][0].input.onChange('Erik')

    expect(renderFirstNameInput).toHaveBeenCalledTimes(2)
    expect(renderFirstNameInput.mock.calls[1][0].input.value).toBe('Erik')

    // no need to rerender last name
    expect(renderLastNameInput).toHaveBeenCalledTimes(1)

    TestUtils.Simulate.click(button)
    await sleep(2)

    // it must rerender foo[0] inputs because the whole array is rerendered due to the change of length
    expect(renderFirstNameInput).toHaveBeenCalledTimes(4)
    expect(renderFirstNameInput.mock.calls[3][0].input.name).toBe(
      'foo[1].firstName'
    )
    expect(renderFirstNameInput.mock.calls[3][0].input.value).toBe('')
    expect(renderLastNameInput).toHaveBeenCalledTimes(3)
    expect(renderLastNameInput.mock.calls[2][0].input.name).toBe(
      'foo[1].lastName'
    )
    expect(renderLastNameInput.mock.calls[2][0].input.value).toBe('')
  })

  it('should not warn if updating state after unmounting', async () => {
    // This is mainly here for code coverage. 🧐
    class Container extends React.Component {
      state = { shown: true }

      render() {
        return (
          <Form
            onSubmit={onSubmitMock}
            mutators={arrayMutators}
            initialValues={{ foo: [] }}
          >
            {() => (
              <form>
                {this.state.shown && (
                  <FieldArray
                    name="foo"
                    render={({ fields, meta }) => (
                      <div>
                        {fields.map((name, index) => (
                          <Field
                            key={index}
                            name={name + '.foo'}
                            component="input"
                          />
                        ))}
                        <b onClick={() => fields.push({ foo: '' })}>Add</b>
                        {meta.error && <span>{meta.error}</span>}
                      </div>
                    )}
                    validate={values => {
                      if (!values.length) {
                        return 'Required'
                      }
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => this.setState({ shown: false })}
                >
                  Unmount
                </button>
              </form>
            )}
          </Form>
        )
      }
    }

    const spy = jest.spyOn(console, 'error')
    const dom = TestUtils.renderIntoDocument(<Container />)
    const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')
    const addButton = TestUtils.findRenderedDOMComponentWithTag(dom, 'b')

    TestUtils.Simulate.click(addButton)
    TestUtils.Simulate.click(button)
    await sleep(2)
    expect(spy).not.toHaveBeenCalled()
  })

  it('should provide default isEqual method to calculate pristine correctly', () => {
    const arrayFieldRender = jest.fn(({ fields }) => (
      <Fragment>
        {fields.map((name, index) => (
          <Fragment key={name}>
            <Field name={`${name}.bar`} component="input" />
            <button onClick={() => fields.remove(index)}>Remove</button>
          </Fragment>
        ))}
      </Fragment>
    ))

    const formRender = jest.fn(() => (
      <FieldArray name="foo" render={arrayFieldRender} />
    ))
    const dom = TestUtils.renderIntoDocument(
      <Form
        initialValues={{ foo: [{ bar: 'example' }] }}
        onSubmit={onSubmitMock}
        mutators={arrayMutators}
        render={formRender}
      />
    )
    const input = TestUtils.findRenderedDOMComponentWithTag(dom, 'input')
    const button = TestUtils.findRenderedDOMComponentWithTag(dom, 'button')

    // initially pristine true
    expect(formRender.mock.calls[0][0]).toMatchObject({
      pristine: true
    })

    // changing value, pristine false
    TestUtils.Simulate.change(input, { target: { value: 'foo' } })
    expect(formRender.mock.calls[1][0]).toMatchObject({ pristine: false })

    // changing value back to default, pristine true
    TestUtils.Simulate.change(input, { target: { value: 'example' } })
    expect(formRender.mock.calls[2][0]).toMatchObject({ pristine: true })

    // removing field, pristine false
    TestUtils.Simulate.click(button)
    expect(formRender.mock.calls[3][0]).toMatchObject({ pristine: false })
  })
})

describe('FieldArray properties', () => {
  it.only('should work', async () => {
    function ChangeCommand(index, newValue) {
      return {
        check: model => {
          console.log('I run check', model, index)
          // return true;
          return model.values.length >= index
        },
        run: (model, real) => {
          // abstract phase
          model.values[index] = newValue

          // real phase
          const inputEl = real.getByTestId(`input${index}`)
          fireEvent.focus(inputEl)
          fireEvent.change(inputEl, { target: { value: newValue } })
          fireEvent.blur(inputEl)
        },
        toString: () => `change input value on index ${index} to ${newValue}`
      }
    }

    function AddFieldCommand() {
      return {
        check: () => true,
        run: async (model, real) => {
          model.push('')

          const addButton = real.getByText('add a new field')
          fireEvent.click(addButton)

          const numberOfElementsInModel = model.length
          await waitForElement(() =>
            real.getByTestId(`input${numberOfElementsInModel - 1}`)
          )

          const allInputElements = real.queryAllByTestId('input', {
            exact: false
          })
          const realValues = allInputElements.map(element => element.value)
          // console.log(realValues);

          real.debug()
          expect(allInputElements.length).toBe(numberOfElementsInModel)
        },
        toString: () => 'Add a new field'
      }
    }

    const allCommands = [
      fc.constant(new AddFieldCommand()),
      fc.nat(3).map(nat => {
        // console.log(nat)
        return new ChangeCommand(nat, 'abc')
      })
    ]

    const generateRealSystem = () =>
      render(
        <Form
          onSubmit={onSubmitMock}
          mutators={arrayMutators}
          initialValues={{ foo: [null] }}
          render={({
            form: {
              mutators: { push }
            }
          }) => (
            <React.Fragment>
              <FieldArray name="foo">
                {({ fields }) => (
                  <div>
                    {fields.map((name, i) => (
                      <Field
                        name={name}
                        key={name}
                        component="input"
                        data-testid={`input${i}`}
                      />
                    ))}
                  </div>
                )}
              </FieldArray>
              <button onClick={() => push('foo', '')}>add a new field</button>
            </React.Fragment>
          )}
        />
      )

    const realSystem = generateRealSystem()

    const generateState = () => ({
      model: [''],
      real: generateRealSystem()
    })

    // const fieldCommand = new AddFieldCommand()
    // await fieldCommand.run([], realSystem)

    // const result = fc.sample(allCommands[1])
    // console.log(result)

    await fc.assert(
      fc.asyncProperty(fc.commands(allCommands, 6), async commands => {
        await fc.asyncModelRun(generateState, commands)
        console.log('I am cleaning up')
        cleanup()
      }),
      { numRuns: 2 }
    )
  })
})

const generateInitialState = () => {
  // generate random values for random number of inputs
}

const initialState = generateInitialState()

let model = {
  state: initialState,
  operations: {
    handleChange: (state, index, newValue) => {
      const newState = { ...state }
      newState[index] = newValue
      return newState
    },
    handleMove: (state, from, to) => {
      if (from === to) return { ...state }
      const valueToMove = state[from]
      const stateWithoutElement = [
        ...state.slice(0, from),
        ...state.slice(from + 1)
      ]
      const newState = [
        ...stateWithoutElement.slice(0, to),
        valueToMove,
        ...stateWithoutElement.slice(to)
      ]
      return newState
    }
  }
}

let avaliableCommands = {
  change: {
    preconditions: state => {},
    valuesGenerator: () => {},
    postconditions: state => {}
  },
  move: {
    preconditions: state => {},
    valuesGenerator: () => {},
    postconditions: state => {}
  }
}

// sources
// https://propertesting.com/book_stateful_properties.html
// https://hypothesis.readthedocs.io/en/latest/stateful.html
