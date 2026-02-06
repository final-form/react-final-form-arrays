/**
 * Copies property descriptors from source to target, optionally excluding keys.
 * Preserves lazy getters that would be lost with object spread.
 */
export default function copyPropertyDescriptors<T extends object>(
  source: object,
  target: T,
  excludeKeys: string[] = []
): T {
  const descriptors = Object.getOwnPropertyDescriptors(source)
  for (const key of Object.keys(descriptors)) {
    if (!excludeKeys.includes(key)) {
      Object.defineProperty(target, key, descriptors[key])
    }
  }
  return target
}
