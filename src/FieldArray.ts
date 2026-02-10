import { version as ffVersion } from 'final-form'
import { version as rffVersion } from 'react-final-form'
import { FieldArrayProps } from './types'
import renderComponent from './renderComponent'
import useFieldArray from './useFieldArray'
import copyPropertyDescriptors from './copyPropertyDescriptors'
import { version } from './version'

export { version }

const versions = {
  'final-form': ffVersion,
  'react-final-form': rffVersion,
  'react-final-form-arrays': version
}

const FieldArray = ({
  name,
  subscription,
  defaultValue,
  initialValue,
  isEqual,
  validate,
  ...rest
}: FieldArrayProps) => {
  const { fields, meta } = useFieldArray(name, {
    subscription,
    defaultValue,
    initialValue,
    isEqual,
    validate
  })

  // FIX #167: Don't spread meta object, use copyPropertyDescriptors to preserve lazy getters
  const metaWithVersions = copyPropertyDescriptors(meta, { __versions: versions } as any)

  return renderComponent(
    {
      fields,
      meta: metaWithVersions,
      ...rest
    },
    `FieldArray(${name})`
  )
}

export default FieldArray
