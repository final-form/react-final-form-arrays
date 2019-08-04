import React from 'react'
import { render, fireEvent, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'
import arrayMutators from 'final-form-arrays'
import { ErrorBoundary, Toggle, wrapWith } from './testUtils'
import { Form, Field } from 'react-final-form'
import { FieldArray, version } from '.'

const onSubmitMock = values => {}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

describe('FieldArray', () => {
  afterEach(cleanup)

  it('should export version', () => {
    expect(version).toBeDefined()
  })

  it('should warn if not used inside a form', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    const errorSpy = jest.fn()
    render(
      <ErrorBoundary spy={errorSpy}>
        <FieldArray name="names" component="input" />
      </ErrorBoundary>
    )
    expect(errorSpy).toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy.mock.calls[0][0].message).toBe(
      'useFieldArray must be used inside of a <Form> component'
    )
    console.error.mockRestore()
  })

  it('should warn if no render strategy is provided', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    const errorSpy = jest.fn()
    render(
      <ErrorBoundary spy={errorSpy}>
        <Form
          onSubmit={onSubmitMock}
          mutators={arrayMutators}
          render={() => <FieldArray name="foo" />}
        />
      </ErrorBoundary>
    )
    expect(errorSpy).toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy.mock.calls[0][0].message).toBe(
      'Must specify either a render prop, a render function as children, or a component prop to FieldArray(foo)'
    )
    console.error.mockRestore()
  })

  it('should warn if no array mutators provided', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    const errorSpy = jest.fn()
    render(
      <ErrorBoundary spy={errorSpy}>
        <Form onSubmit={onSubmitMock}>
          {() => <FieldArray name="foo" render={() => <div />} />}
        </Form>
      </ErrorBoundary>
    )
    expect(errorSpy).toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy.mock.calls[0][0].message).toBe(
      'Array mutators not found. You need to provide the mutators from final-form-arrays to your form'
    )
    console.error.mockRestore()
  })

  it('should render with a render component', () => {
    const MyComp = jest.fn(() => <div data-testid="MyDiv" />)
    const { getByTestId } = render(
      <Form onSubmit={onSubmitMock} mutators={arrayMutators} subscription={{}}>
        {() => <FieldArray name="foo" component={MyComp} />}
      </Form>
    )
    expect(MyComp).toHaveBeenCalled()
    expect(MyComp).toHaveBeenCalledTimes(1)
    expect(getByTestId('MyDiv')).toBeDefined()
  })

  it('should resubscribe if name changes', () => {
    const renderArray = jest.fn(() => <div />)
    const { getByText } = render(
      <Toggle>
        {isCats => (
          <Form
            onSubmit={onSubmitMock}
            mutators={arrayMutators}
            subscription={{}}
            initialValues={{ dogs: ['Odie'], cats: ['Garfield'] }}
          >
            {() => (
              <form>
                <FieldArray
                  name={isCats ? 'cats' : 'dogs'}
                  render={renderArray}
                />
              </form>
            )}
          </Form>
        )}
      </Toggle>
    )
    expect(renderArray).toHaveBeenCalled()
    expect(renderArray).toHaveBeenCalledTimes(1)
    expect(renderArray.mock.calls[0][0].fields.name).toEqual('dogs')
    expect(renderArray.mock.calls[0][0].fields.value).toEqual(['Odie'])

    fireEvent.click(getByText('Toggle'))

    // once for name change, and again when reregistered
    expect(renderArray).toHaveBeenCalledTimes(3)

    // strange intermediate state where name has changed but value has not
    expect(renderArray.mock.calls[1][0].fields.name).toEqual('cats')
    expect(renderArray.mock.calls[1][0].fields.value).toEqual(['Odie'])

    // all aligned now
    expect(renderArray.mock.calls[2][0].fields.value).toEqual(['Garfield'])
  })

  /*
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
  */

  it('should render via children render function', () => {
    const { getByTestId } = render(
      <Form onSubmit={onSubmitMock} mutators={arrayMutators} subscription={{}}>
        {() => (
          <FieldArray name="foo">
            {({ fields }) => <div data-testid="myDiv">{fields.name}</div>}
          </FieldArray>
        )}
      </Form>
    )
    expect(getByTestId('myDiv')).toBeDefined()
    expect(getByTestId('myDiv')).toHaveTextContent('foo')
  })

  it('should always have length, even if not subscribed', () => {
    const renderArray = jest.fn(() => <div />)
    render(
      <Form
        onSubmit={onSubmitMock}
        mutators={arrayMutators}
        subscription={{}}
        initialValues={{ foo: ['a', 'b'] }}
      >
        {() => (
          <form>
            <FieldArray name="foo" subscription={{ dirty: true }}>
              {renderArray}
            </FieldArray>
          </form>
        )}
      </Form>
    )
    expect(renderArray).toHaveBeenCalled()
    expect(renderArray).toHaveBeenCalledTimes(1)
    expect(renderArray.mock.calls[0][0].meta.dirty).not.toBeUndefined()
    expect(renderArray.mock.calls[0][0].meta.dirty).toBe(false)
    expect(renderArray.mock.calls[0][0].fields.length).toBeDefined()
    expect(renderArray.mock.calls[0][0].fields.length).toBe(2)
  })

  it('should unsubscribe on unmount', () => {
    // This is mainly here for code coverage. 🧐
    const { queryByTestId, getByText } = render(
      <Toggle>
        {isHidden => (
          <Form
            onSubmit={onSubmitMock}
            mutators={arrayMutators}
            subscription={{}}
            initialValues={{ names: ['erikras'] }}
          >
            {() => (
              <form>
                {!isHidden && (
                  <FieldArray name="names">
                    {({ fields }) => (
                      <div data-testid="myDiv">{fields.name}</div>
                    )}
                  </FieldArray>
                )}
              </form>
            )}
          </Form>
        )}
      </Toggle>
    )
    expect(queryByTestId('myDiv')).not.toBe(null)
    fireEvent.click(getByText('Toggle'))
    expect(queryByTestId('myDiv')).toBe(null)
  })

  it('should allow field-level validation', () => {
    const renderArray = jest.fn(() => <div />)
    const validate = jest.fn(value =>
      value.length > 2 ? 'Too long' : undefined
    )
    render(
      <Form
        onSubmit={onSubmitMock}
        mutators={arrayMutators}
        subscription={{}}
        initialValues={{ foo: ['a', 'b'] }}
      >
        {() => (
          <form>
            <FieldArray name="foo" validate={validate}>
              {renderArray}
            </FieldArray>
          </form>
        )}
      </Form>
    )
    expect(renderArray).toHaveBeenCalled()
    expect(renderArray).toHaveBeenCalledTimes(1)
    expect(renderArray.mock.calls[0][0].meta.valid).toBe(true)
    expect(renderArray.mock.calls[0][0].meta.error).toBeUndefined()
    expect(validate).toHaveBeenCalled()
    expect(validate).toHaveBeenCalledTimes(1)

    expect(typeof renderArray.mock.calls[0][0].fields.push).toBe('function')

    renderArray.mock.calls[0][0].fields.push('c')
    expect(validate).toHaveBeenCalledTimes(2)

    expect(renderArray).toHaveBeenCalledTimes(2)
    expect(renderArray.mock.calls[1][0].meta.valid).toBe(false)
    expect(renderArray.mock.calls[1][0].meta.error).toBe('Too long')
  })

  it('should provide forEach', () => {
    const renderArray = jest.fn(() => <div />)
    render(
      <Form
        onSubmit={onSubmitMock}
        mutators={arrayMutators}
        subscription={{}}
        initialValues={{ foo: ['a', 'b', 'c'] }}
      >
        {() => (
          <form>
            <FieldArray name="foo">{renderArray}</FieldArray>
          </form>
        )}
      </Form>
    )
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
    render(
      <Form
        onSubmit={onSubmitMock}
        mutators={arrayMutators}
        subscription={{}}
        initialValues={{ foo: ['a', 'b', 'c'] }}
      >
        {() => (
          <form>
            <FieldArray name="foo">{renderArray}</FieldArray>
          </form>
        )}
      </Form>
    )
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

  it('calculate dirty/pristine using provided isEqual predicate', () => {
    const isEqual = jest.fn(
      (aArray, bArray) =>
        !aArray.some((a, index) => a.bar !== bArray[index].bar)
    )
    const { getByTestId } = render(
      <Form
        onSubmit={onSubmitMock}
        mutators={arrayMutators}
        subscription={{}}
        initialValues={{ foo: [{ bar: 'a' }, { bar: 'b' }] }}
      >
        {() => (
          <form>
            <FieldArray
              name="foo"
              isEqual={isEqual}
              subscription={{ dirty: true }}
            >
              {({ fields, meta }) => (
                <div>
                  <div data-testid="arrayDirty">
                    {meta.dirty ? 'Dirty' : 'Pristine'}
                  </div>
                  {fields.map(field => (
                    <Field name={`${field}.bar`} key={`${field}.bar`}>
                      {({ input, meta: { dirty } }) => (
                        <div>
                          <input
                            {...input}
                            data-testid={`${field}.bar.input`}
                          />
                          <div data-testid={`${field}.bar.dirty`}>
                            {dirty ? 'Dirty' : 'Pristine'}
                          </div>
                        </div>
                      )}
                    </Field>
                  ))}
                </div>
              )}
            </FieldArray>
          </form>
        )}
      </Form>
    )
    expect(isEqual).toHaveBeenCalled()
    expect(getByTestId('arrayDirty')).toHaveTextContent('Pristine')
    expect(getByTestId('foo[0].bar.input').value).toBe('a')
    expect(getByTestId('foo[1].bar.input').value).toBe('b')
    expect(getByTestId('foo[0].bar.dirty')).toHaveTextContent('Pristine')
    expect(getByTestId('foo[1].bar.dirty')).toHaveTextContent('Pristine')

    // change value
    fireEvent.change(getByTestId('foo[1].bar.input'), {
      target: { value: 'c' }
    })

    expect(getByTestId('arrayDirty')).toHaveTextContent('Dirty')
    expect(getByTestId('foo[0].bar.input').value).toBe('a')
    expect(getByTestId('foo[0].bar.dirty')).toHaveTextContent('Pristine')
    expect(getByTestId('foo[1].bar.input').value).toBe('c')
    expect(getByTestId('foo[1].bar.dirty')).toHaveTextContent('Dirty')

    // change value back to pristine
    fireEvent.change(getByTestId('foo[1].bar.input'), {
      target: { value: 'b' }
    })

    expect(getByTestId('arrayDirty')).toHaveTextContent('Pristine')
    expect(getByTestId('foo[0].bar.input').value).toBe('a')
    expect(getByTestId('foo[1].bar.input').value).toBe('b')
    expect(getByTestId('foo[0].bar.dirty')).toHaveTextContent('Pristine')
    expect(getByTestId('foo[1].bar.dirty')).toHaveTextContent('Pristine')
  })

  it('should render a new field when a new value is pushed', () => {
    const { getByText, queryByTestId } = render(
      <Form onSubmit={onSubmitMock} mutators={arrayMutators} subscription={{}}>
        {() => (
          <form>
            <FieldArray name="names">
              {({ fields }) => (
                <div>
                  {fields.map(field => (
                    <Field
                      name={field}
                      key={field}
                      component="input"
                      data-testid={field}
                    />
                  ))}
                  <button type="button" onClick={() => fields.push()}>
                    Add
                  </button>
                </div>
              )}
            </FieldArray>
          </form>
        )}
      </Form>
    )
    expect(queryByTestId('names[0]')).toBe(null)
    expect(queryByTestId('names[1]')).toBe(null)

    // push
    fireEvent.click(getByText('Add'))

    expect(queryByTestId('names[0]')).not.toBe(null)
    expect(queryByTestId('names[1]')).toBe(null)

    // push
    fireEvent.click(getByText('Add'))

    expect(queryByTestId('names[0]')).not.toBe(null)
    expect(queryByTestId('names[1]')).not.toBe(null)
  })

  it('should not re-render Field when subscription is empty object', () => {
    const nameFieldRender = jest.fn()
    const surnameFieldRender = jest.fn()

    const { getByTestId } = render(
      <Form
        onSubmit={onSubmitMock}
        mutators={arrayMutators}
        subscription={{}}
        initialValues={{
          names: [{ id: 1, name: 'John', surname: 'Doe' }]
        }}
      >
        {({ handleSubmit }) => (
          <form onSubmit={handleSubmit} data-testid="form">
            <FieldArray name="names" subscription={{}}>
              {({ fields }) =>
                fields.map(field => {
                  return (
                    <div key={`${field}.id`}>
                      <Field name={`${field}.name`}>
                        {wrapWith(nameFieldRender, ({ input }) => (
                          <input data-testid={`${field}.name`} {...input} />
                        ))}
                      </Field>
                      <Field name={`${field}.surname`}>
                        {wrapWith(surnameFieldRender, ({ input }) => (
                          <input data-testid={`${field}.surname`} {...input} />
                        ))}
                      </Field>
                    </div>
                  )
                })
              }
            </FieldArray>
          </form>
        )}
      </Form>
    )

    fireEvent.change(getByTestId('names[0].name'), {
      target: { value: 'Sue' }
    })
    expect(getByTestId('names[0].name').value).toBe('Sue')

    fireEvent.change(getByTestId('names[0].name'), {
      target: { value: 'Paul' }
    })
    expect(getByTestId('names[0].name').value).toBe('Paul')

    expect(nameFieldRender).toHaveBeenCalledTimes(3)
    expect(surnameFieldRender).toHaveBeenCalledTimes(1)
  })

  it('should allow Fields to be rendered for complex objects', () => {
    const onSubmit = jest.fn()
    const { getByTestId, getByText, queryByTestId } = render(
      <Form onSubmit={onSubmit} mutators={arrayMutators} subscription={{}}>
        {({ handleSubmit }) => (
          <form onSubmit={handleSubmit} data-testid="form">
            <FieldArray name="clients">
              {({ fields }) => (
                <div>
                  {fields.map(field => (
                    <div>
                      <Field
                        name={`${field}.firstName`}
                        key={`${field}.firstName`}
                        component="input"
                        data-testid={`${field}.firstName`}
                      />
                      <Field
                        name={`${field}.lastName`}
                        key={`${field}.lastName`}
                        component="input"
                        data-testid={`${field}.lastName`}
                      />
                    </div>
                  ))}
                  <button type="button" onClick={() => fields.push()}>
                    Add
                  </button>
                </div>
              )}
            </FieldArray>
          </form>
        )}
      </Form>
    )
    expect(queryByTestId('clients[0].firstName')).toBe(null)
    expect(queryByTestId('clients[0].lastName')).toBe(null)
    expect(queryByTestId('clients[1].firstName')).toBe(null)
    expect(queryByTestId('clients[1].lastName')).toBe(null)

    // add a client
    fireEvent.click(getByText('Add'))

    expect(queryByTestId('clients[0].firstName')).not.toBe(null)
    expect(queryByTestId('clients[0].lastName')).not.toBe(null)
    expect(queryByTestId('clients[1].firstName')).toBe(null)
    expect(queryByTestId('clients[1].lastName')).toBe(null)

    // enter info for first client
    fireEvent.change(getByTestId('clients[0].firstName'), {
      target: { value: 'Ringo' }
    })
    fireEvent.change(getByTestId('clients[0].lastName'), {
      target: { value: 'Starr' }
    })

    // add another client
    fireEvent.click(getByText('Add'))

    expect(queryByTestId('clients[0].firstName')).not.toBe(null)
    expect(queryByTestId('clients[0].lastName')).not.toBe(null)
    expect(queryByTestId('clients[1].firstName')).not.toBe(null)
    expect(queryByTestId('clients[1].lastName')).not.toBe(null)

    // enter info for second client
    fireEvent.change(getByTestId('clients[1].firstName'), {
      target: { value: 'George' }
    })
    fireEvent.change(getByTestId('clients[1].lastName'), {
      target: { value: 'Harrison' }
    })

    expect(onSubmit).not.toHaveBeenCalled()

    // submit
    fireEvent.submit(getByTestId('form'))

    expect(onSubmit).toHaveBeenCalled()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0]).toEqual({
      clients: [
        { firstName: 'Ringo', lastName: 'Starr' },
        { firstName: 'George', lastName: 'Harrison' }
      ]
    })
  })

  it('should pass along children if rendering with render prop', () => {
    const { getByTestId, queryByTestId } = render(
      <Form
        onSubmit={onSubmitMock}
        mutators={arrayMutators}
        subscription={{}}
        initialValues={{ names: ['erikras'] }}
      >
        {() => (
          <form>
            <FieldArray
              name="names"
              render={({ fields, children }) => (
                <div>
                  {children}
                  {fields.map(field => (
                    <Field
                      name={field}
                      key={field}
                      component="input"
                      data-testid={field}
                    />
                  ))}
                  <button type="button" onClick={() => fields.push()}>
                    Add
                  </button>
                </div>
              )}
            >
              <div data-testid="child">Some child element</div>
            </FieldArray>
          </form>
        )}
      </Form>
    )
    expect(queryByTestId('names[0]')).not.toBe(null)
    expect(getByTestId('names[0]').value).toBe('erikras')

    expect(queryByTestId('child')).not.toBe(null)
  })

  it('should provide default isEqual that does shallow compare of items', () => {
    const { getByTestId } = render(
      <Form
        onSubmit={onSubmitMock}
        mutators={arrayMutators}
        subscription={{ dirty: true }}
        initialValues={{ names: ['Paul'] }}
      >
        {({ dirty }) => (
          <form>
            <div data-testid="formDirty">{dirty ? 'Dirty' : 'Pristine'}</div>
            <FieldArray name="names" subscription={{ dirty: true }}>
              {({ fields, meta }) => (
                <div>
                  <div data-testid="arrayDirty">
                    {meta.dirty ? 'Dirty' : 'Pristine'}
                  </div>
                  {fields.map(field => (
                    <Field name={field} key={field}>
                      {({ input, meta: { dirty } }) => (
                        <div>
                          <input {...input} data-testid={`${field}.input`} />
                          <div data-testid={`${field}.dirty`}>
                            {dirty ? 'Dirty' : 'Pristine'}
                          </div>
                        </div>
                      )}
                    </Field>
                  ))}
                </div>
              )}
            </FieldArray>
          </form>
        )}
      </Form>
    )
    expect(getByTestId('formDirty')).toHaveTextContent('Pristine')
    expect(getByTestId('arrayDirty')).toHaveTextContent('Pristine')
    expect(getByTestId('names[0].dirty')).toHaveTextContent('Pristine')

    // change value
    fireEvent.change(getByTestId('names[0].input'), {
      target: { value: 'George' }
    })

    expect(getByTestId('formDirty')).toHaveTextContent('Dirty')
    expect(getByTestId('arrayDirty')).toHaveTextContent('Dirty')
    expect(getByTestId('names[0].dirty')).toHaveTextContent('Dirty')

    // change value back
    fireEvent.change(getByTestId('names[0].input'), {
      target: { value: 'Paul' }
    })

    expect(getByTestId('formDirty')).toHaveTextContent('Pristine')
    expect(getByTestId('arrayDirty')).toHaveTextContent('Pristine')
    expect(getByTestId('names[0].dirty')).toHaveTextContent('Pristine')
  })

  it('should allow resetting the form in onSubmit', async () => {
    // https://github.com/final-form/final-form/issues/26#issuecomment-497272119
    const onSubmit = jest.fn((values, form) => {
      expect(values).toEqual({ names: ['erikras'] })
      return Promise.resolve().then(() => {
        setTimeout(form.reset)
      })
    })
    const { getByTestId, getByText } = render(
      <Form
        onSubmit={onSubmit}
        mutators={arrayMutators}
        subscription={{ values: true }}
      >
        {({ handleSubmit, values }) => (
          <form onSubmit={handleSubmit} data-testid="form">
            <pre data-testid="values">{JSON.stringify(values)}</pre>
            <FieldArray
              name="names"
              render={({ fields }) => (
                <div>
                  {fields.map(field => (
                    <Field
                      name={field}
                      key={field}
                      component="input"
                      data-testid={field}
                    />
                  ))}
                  <button type="button" onClick={() => fields.push('erikras')}>
                    Add
                  </button>
                </div>
              )}
            />
          </form>
        )}
      </Form>
    )
    expect(getByTestId('values')).toHaveTextContent('')
    expect(onSubmit).not.toHaveBeenCalled()
    fireEvent.click(getByText('Add'))
    expect(getByTestId('values')).toHaveTextContent('{"names":["erikras"]}')
    fireEvent.submit(getByTestId('form'))
    await sleep(3)
    expect(onSubmit).toHaveBeenCalled()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(getByTestId('values')).toHaveTextContent('')
  })

  it('should provide value', () => {
    const renderArray = jest.fn(() => <div />)
    render(
      <Form
        onSubmit={onSubmitMock}
        mutators={arrayMutators}
        subscription={{}}
        initialValues={{ foo: ['a', 'b', 'c'] }}
      >
        {() => (
          <form>
            <FieldArray name="foo">{renderArray}</FieldArray>
          </form>
        )}
      </Form>
    )
    expect(renderArray).toHaveBeenCalled()
    expect(renderArray).toHaveBeenCalledTimes(1)

    expect(renderArray.mock.calls[0][0].fields.value).toEqual(['a', 'b', 'c'])
  })

  // it('should respect record-level validation', () => {
  //   // https://github.com/final-form/react-final-form-arrays/pull/84
  //   const { getByTestId, getByText } = render(
  //     <Form
  //       onSubmit={onSubmitMock}
  //       mutators={arrayMutators}
  //       subscription={{}}
  //       validate={values => {
  //         const errors = {}
  //         console.info('values.names', values.names)
  //         debugger
  //         if (values.names && values.names.length > 1) {
  //           errors.names = 'Too many'
  //         }
  //         return errors
  //       }}
  //     >
  //       {({ handleSubmit }) => (
  //         <form onSubmit={handleSubmit} data-testid="form">
  //           <FieldArray
  //             name="names"
  //             render={({ fields, meta }) => (
  //               <div>
  //                 {fields.map(field => (
  //                   <Field
  //                     name={field}
  //                     key={field}
  //                     component="input"
  //                     data-testid={field}
  //                   />
  //                 ))}
  //                 <span data-testid="error">{meta.error}</span>
  //                 <button type="button" onClick={() => fields.push('erikras')}>
  //                   Add Erik
  //                 </button>
  //                 <button
  //                   type="button"
  //                   onClick={() => fields.push('jaredpalmer')}
  //                 >
  //                   Add Jared
  //                 </button>
  //               </div>
  //             )}
  //           />
  //         </form>
  //       )}
  //     </Form>
  //   )
  //   expect(getByTestId('error')).toHaveTextContent('')
  //   fireEvent.click(getByText('Add Erik'))
  //   expect(getByTestId('error')).toHaveTextContent('')
  //   fireEvent.click(getByText('Add Jared'))
  //   expect(getByTestId('error')).toHaveTextContent('Too many')
  // })
})
