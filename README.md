💰 **Wanna get paid the big bucks writing React? [Take this quiz](https://triplebyte.com/a/V6j0KPS/rffarrays) and get offers from top tech companies!** 💰

---

# 🏁 React Final Form Arrays

[![NPM Version](https://img.shields.io/npm/v/react-final-form-arrays.svg?style=flat)](https://www.npmjs.com/package/react-final-form-arrays)
[![NPM Downloads](https://img.shields.io/npm/dm/react-final-form-arrays.svg?style=flat)](https://www.npmjs.com/package/react-final-form-arrays)
[![Build Status](https://travis-ci.org/final-form/react-final-form-arrays.svg?branch=master)](https://travis-ci.org/final-form/react-final-form-arrays)
[![codecov.io](https://codecov.io/gh/final-form/react-final-form-arrays/branch/master/graph/badge.svg)](https://codecov.io/gh/final-form/react-final-form-arrays)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

---

## Installation

```bash
npm install --save react-final-form-arrays react-final-form final-form final-form-arrays
```

or

```bash
yarn add react-final-form-arrays react-final-form final-form final-form-arrays
```

## Usage

🏁 React Final Form Arrays provides a way to render arrays in 🏁 React Final
Form.

```jsx
import { Form, Field } from 'react-final-form'
import arrayMutators from 'final-form-arrays'
import { FieldArray } from 'react-final-form-arrays'

const MyForm = () => (
  <Form
    onSubmit={onSubmit}
    mutators={{
      // potentially other mutators could be merged here
      ...arrayMutators
    }}
    validate={validate}
    render={({ handleSubmit, pristine, invalid }) => (
      <form onSubmit={handleSubmit}>
        <FieldArray name="customers">
          {({ fields }) => (
            <div>
              {fields.map((name, index) => (
                <div key={name}>
                  <div>
                    <label>First Name</label>
                    <Field name={`${name}.firstName`} component="input" />
                  </div>
                  <div>
                    <label>Last Name</label>
                    <Field name={`${name}.lastName`} component="input" />
                  </div>
                  <button type="button" onClick={() => fields.remove(index)}>
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fields.push({ firstName: '', lastName: '' })}
              >
                Add
              </button>
            </div>
          )}
        </FieldArray>
      </form>
    )}
  />
)
```

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Examples](#examples)
  - [Simple Example](#simple-example)
  - [React Beautiful DnD Example](#react-beautiful-dnd-example)
- [Rendering](#rendering)
- [API](#api)
  - [`FieldArray : React.ComponentType<FieldArrayProps>`](#fieldarray--reactcomponenttypefieldarrayprops)
  - [`useFieldArray`](#usefieldarray)
  - [`version: string`](#version-string)
- [Types](#types)
  - [`FieldArrayProps`](#fieldarrayprops)
    - [`children?: ((props: FieldArrayRenderProps) => React.Node) | React.Node`](#children-props-fieldarrayrenderprops--reactnode--reactnode)
    - [`component?: React.ComponentType<FieldArrayRenderProps>`](#component-reactcomponenttypefieldarrayrenderprops)
    - [`name: string`](#name-string)
    - [`render?: (props: FieldArrayRenderProps) => React.Node`](#render-props-fieldarrayrenderprops--reactnode)
    - [`defaultValue?: any`](#defaultvalue-any)
    - [`initialValue?: any`](#initialvalue-any)
    - [`isEqual?: (allPreviousValues: Array<any>, allNewValues: Array<any>) => boolean`](#isequal-allpreviousvalues-arrayany-allnewvalues-arrayany--boolean)
    - [`subscription?: FieldSubscription`](#subscription-fieldsubscription)
    - [`validate?: (value: ?any[], allValues: Object) => ?any`](#validate-value-any-allvalues-object--any)
  - [`FieldArrayRenderProps`](#fieldarrayrenderprops)
    - [`fields.forEach: (iterator: (name: string, index: number) => void) => void`](#fieldsforeach-iterator-name-string-index-number--void--void)
    - [`fields.insert: (index: number, value: any) => void`](#fieldsinsert-index-number-value-any--void)
    - [`fields.map: (iterator: (name: string, index: number) => any) => any[]`](#fieldsmap-iterator-name-string-index-number--any--any)
    - [`fields.move: (from: number, to: number) => void`](#fieldsmove-from-number-to-number--void)
    - [`fields.name: string`](#fieldsname-string)
    - [`fields.pop: () => any`](#fieldspop---any)
    - [`fields.push: (value: any) => void`](#fieldspush-value-any--void)
    - [`fields.remove: (index: number) => any`](#fieldsremove-index-number--any)
    - [`fields.shift: () => any`](#fieldsshift---any)
    - [`fields.swap: (indexA: number, indexB: number) => void`](#fieldsswap-indexa-number-indexb-number--void)
    - [`fields.update: (index: number, value: any) => void`](#fieldsupdate-index-number-value-any--void)
    - [`fields.unshift: (value: any) => void`](#fieldsunshift-value-any--void)
    - [`fields.value: any[]`](#fieldsvalue-any)
    - [`meta.active?: boolean`](#metaactive-boolean)
    - [`meta.data: Object`](#metadata-object)
    - [`meta.dirty?: boolean`](#metadirty-boolean)
    - [`meta.error?: any`](#metaerror-any)
    - [`meta.initial?: any`](#metainitial-any)
    - [`meta.invalid?: boolean`](#metainvalid-boolean)
    - [`meta.pristine?: boolean`](#metapristine-boolean)
    - [`meta.submitError?: any`](#metasubmiterror-any)
    - [`meta.submitFailed?: boolean`](#metasubmitfailed-boolean)
    - [`meta.submitSucceeded?: boolean`](#metasubmitsucceeded-boolean)
    - [`meta.touched?: boolean`](#metatouched-boolean)
    - [`meta.valid?: boolean`](#metavalid-boolean)
    - [`meta.visited?: boolean`](#metavisited-boolean)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Examples

### [Simple Example](https://codesandbox.io/s/kx8qv67nk5)

Demostrates how to use `<FieldArray/>` to render an array of inputs, as well as
use `push`, `pop`, and `remove` mutations.

### [React Beautiful DnD Example](https://codesandbox.io/s/678pj)

Demostrates how to integrate the simple example with [react-beautiful-dnd](https://github.com/atlassian/react-beautiful-dnd)

## Rendering

There are three ways to tell `<FieldArray/>` what to render:

| Method                          | How it is rendered                                        |
| ------------------------------- | --------------------------------------------------------- |
| `component` prop                | `return React.createElement(this.props.component, props)` |
| `render` prop                   | `return this.props.render(props)`                         |
| a render function as `children` | `return this.props.children(props)`                       |

## API

The following can be imported from `react-final-form-arrays`.

### `FieldArray : React.ComponentType<FieldArrayProps>`

A component that takes [`FieldArrayProps`](#fieldarrayprops) and renders an
array of fields

### `useFieldArray`

The `useFieldArray` hook takes two parameters, the first is the name of the field, and the second is an optional object that looks just like [`FieldArrayProps`](#fieldarrayprops), except without the name. It returns an object just like [`FieldArrayRenderProps`](#fieldarrayrenderprops).

`useFieldArray` is used interally inside `FieldArray`.

### `version: string`

The current used version of 🏁 React Final Form Arrays.

---

## Types

### `FieldArrayProps`

These are props that you pass to
[`<FieldArray/>`](#fieldarray--reactcomponenttypefieldarrayprops). You must
provide one of the ways to render: `component`, `render`, or `children`.

#### `children?: ((props: FieldArrayRenderProps) => React.Node) | React.Node`

A render function that is given
[`FieldArrayRenderProps`](#fieldarrayrenderprops), as well as any non-API props
passed into the `<FieldArray/>` component.

#### `component?: React.ComponentType<FieldArrayRenderProps>`

A component that is given [`FieldArrayRenderProps`](#fieldarrayrenderprops) as
props, as well as any non-API props passed into the `<FieldArray/>` component.

#### `name: string`

The name of your field array.

#### `render?: (props: FieldArrayRenderProps) => React.Node`

A render function that is given
[`FieldArrayRenderProps`](#fieldarrayrenderprops), as well as any non-API props
passed into the `<FieldArray/>` component.

#### `defaultValue?: any`

⚠️ You probably want `initialValue`! ⚠️

_**Before using this prop, read and understand the 🏁 Final Form documentation on [`initialValue`](https://github.com/final-form/final-form#initialvalue-any) and [`defaultValue`](https://github.com/final-form/final-form#defaultvalue-any)!**_

#### `initialValue?: any`

[See the 🏁 Final Form docs on `initialValue`](https://github.com/final-form/final-form#initialvalue-any)

#### `isEqual?: (allPreviousValues: Array<any>, allNewValues: Array<any>) => boolean`

A function that can be used to compare two arrays of values (before and after every change) and calculate pristine/dirty checks. Defaults to a function that will `===` check each element of the array.

#### `subscription?: FieldSubscription`

A
[`FieldSubscription`](https://github.com/final-form/final-form#fieldsubscription--string-boolean-)
that selects of all the items of
[`FieldState`](https://github.com/final-form/final-form#fieldstate) that you
wish to update for. If you don't pass a `subscription` prop, it defaults to
_all_ of [`FieldState`](https://github.com/final-form/final-form#fieldstate).

#### `validate?: (value: ?any[], allValues: Object) => ?any`

A function that takes the field value, and all the values of the form and
returns an error if the array value is invalid, or `undefined` if the value is
valid.

### `FieldArrayRenderProps`

These are the props that
[`<FieldArray/>`](#fieldarray--reactcomponenttypefieldarrayprops) provides to
your render function or component. This object is divided into a `fields` object
that mimics an iterable (e.g. it has `map()` and `forEach()` and `length`), and
`meta` data about the field array. Keep in mind that **the values in `meta` are
dependent on you having subscribed to them** with the
[`subscription` prop](#subscription-fieldsubscription)

#### `fields.forEach: (iterator: (name: string, index: number) => void) => void`

Iterates through all of the names of the fields in the field array in bracket
format, e.g. `foo[0]`, `foo[1]`, `foo[2]`.

#### `fields.insert: (index: number, value: any) => void`

A function to insert a value into any arbitrary index of the array.

#### `fields.map: (iterator: (name: string, index: number) => any) => any[]`

Iterates through all of the names of the fields in the field array in bracket
format, e.g. `foo[0]`, `foo[1]`, `foo[2]`, and collects the results of the
iterator function. You will use this in almost every implementation.

#### `fields.move: (from: number, to: number) => void`

A function to move a value from one index to another. Useful for drag-and-drop
reordering.

#### `fields.name: string`

The name of the field array.

#### `fields.pop: () => any`

A function to remove a value from the end of the array. The value will be
returned.

#### `fields.push: (value: any) => void`

A function to add a value to the end of the array.

#### `fields.remove: (index: number) => any`

A function to remove a value from an arbitrary index of the array.

#### `fields.shift: () => any`

A function to remove a value from the beginning of the array. The value will be
returned.

#### `fields.swap: (indexA: number, indexB: number) => void`

A function to swap two values in the array.

#### `fields.update: (index: number, value: any) => void`

Updates a value of the specified index of the array field.

#### `fields.unshift: (value: any) => void`

A function to add a value to the beginning of the array.

#### `fields.value: any[]`

The value of the array. Should be treated as readonly.

#### `meta.active?: boolean`

[See the 🏁 Final Form docs on `active`](https://github.com/final-form/final-form#active-boolean).

#### `meta.data: Object`

[See the 🏁 Final Form docs on `data`](https://github.com/final-form/final-form#data-object).

#### `meta.dirty?: boolean`

[See the 🏁 Final Form docs on `dirty`](https://github.com/final-form/final-form#dirty-boolean).

#### `meta.error?: any`

[See the 🏁 Final Form docs on `error`](https://github.com/final-form/final-form#error-any).

#### `meta.initial?: any`

[See the 🏁 Final Form docs on `initial`](https://github.com/final-form/final-form#initial-any).

#### `meta.invalid?: boolean`

[See the 🏁 Final Form docs on `invalid`](https://github.com/final-form/final-form#invalid-boolean).

#### `meta.pristine?: boolean`

[See the 🏁 Final Form docs on `pristine`](https://github.com/final-form/final-form#pristine-boolean).

#### `meta.submitError?: any`

[See the 🏁 Final Form docs on `submitError`](https://github.com/final-form/final-form#submiterror-any).

#### `meta.submitFailed?: boolean`

[See the 🏁 Final Form docs on `submitFailed`](https://github.com/final-form/final-form#submitfailed-boolean).

#### `meta.submitSucceeded?: boolean`

[See the 🏁 Final Form docs on `submitSucceeded`](https://github.com/final-form/final-form#submitsucceeded-boolean).

#### `meta.touched?: boolean`

[See the 🏁 Final Form docs on `touched`](https://github.com/final-form/final-form#touched-boolean).

#### `meta.valid?: boolean`

[See the 🏁 Final Form docs on `valid`](https://github.com/final-form/final-form#valid-boolean).

#### `meta.visited?: boolean`

[See the 🏁 Final Form docs on `visited`](https://github.com/final-form/final-form#visited-boolean).
