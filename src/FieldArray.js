// @flow
import { version as ffVersion } from 'final-form'
import { version as rffVersion } from 'react-final-form'
import type { FieldArrayProps } from './types'
import renderComponent from './renderComponent'
import useFieldArray from './useFieldArray'
export const version = '3.0.0'

const versions = {
  'final-form': ffVersion,
  'react-final-form': rffVersion,
  'react-final-form-arrays': version
}

const FieldArray = ({
  name,
  subscription,
  isEqual,
  validate,
  ...rest
}: FieldArrayProps) => {
  const { fields, meta } = useFieldArray(name, {
    subscription,
    isEqual,
    validate
  })

  return renderComponent(
    {
      fields,
      meta: {
        ...meta,
        __versions: versions
      },
      ...rest
    },
    `FieldArray(${name})`
  )
}

export default FieldArray
