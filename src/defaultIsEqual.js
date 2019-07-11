// @flow
const defaultIsEqual = (aArray: any[], bArray: any[]) =>
  aArray === bArray ||
  (Array.isArray(aArray) &&
    Array.isArray(bArray) &&
    aArray.length === bArray.length &&
    !aArray.some((a, index) => a !== bArray[index]))

export default defaultIsEqual
