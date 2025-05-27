import * as React from 'react'

export const wrapWith =
  (mock: Function, fn: Function) =>
  (...args: any[]) => {
    mock(...args)
    return fn(...args)
  }

interface ToggleProps {
  children: (on: boolean) => React.ReactNode
}

/** A simple container component that allows boolean to be toggled with a button */
export function Toggle({ children }: ToggleProps) {
  const [on, setOn] = React.useState(false)
  return (
    <div>
      {children(on)}
      <button onClick={() => setOn(!on)}>Toggle</button>
    </div>
  )
}

interface ErrorBoundaryProps {
  spy: (error: Error) => void
  children: React.ReactNode
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  componentDidCatch(error: Error) {
    this.props.spy(error)
  }

  render() {
    return this.props.children
  }
}
