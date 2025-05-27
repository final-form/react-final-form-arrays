import * as React from 'react'
import { RenderableProps } from './types'

// shared logic between components that use either render prop,
// children render function, or component prop
export default function renderComponent<T>(
  props: RenderableProps<T> & T,
  name: string
): React.ReactNode {
  const { render, children, component, ...rest } = props
  if (component) {
    // Type assertion needed due to complex generic constraints
    return React.createElement(component as React.ComponentType<any>, { ...rest, children, render }) // inject children back in
  }
  if (render) {
    return render(children === undefined ? rest as T : { ...rest, children } as T) // inject children back in
  }
  if (typeof children !== 'function') {
    throw new Error(
      `Must specify either a render prop, a render function as children, or a component prop to ${name}`
    )
  }
  return children(rest as T)
} 