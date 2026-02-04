import { version as ffVersion } from 'final-form'
import { version as rffVersion } from 'react-final-form'
import { FieldArrayProps } from './types'
import renderComponent from './renderComponent'
import useFieldArray from './useFieldArray'
// @ts-ignore
import { version } from '../package.json'

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

  // FIX #167: Don't spread meta object, use Object.defineProperties to preserve lazy getters
  const metaWithVersions = { __versions: versions } as any
  const metaDescriptors = Object.getOwnPropertyDescriptors(meta)
  for (const key in metaDescriptors) {
    Object.defineProperty(metaWithVersions, key, metaDescriptors[key])
  }

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