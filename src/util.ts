export function isUint32(num: number) {
  return Number.isSafeInteger(num) && num >= 0 && num < Math.pow(2, 32);
}

export function assertUint32(num: number) {
  if (!isUint32(num)) {
    throw new Error('Invalid number specified: uint32_t is required');
  }
}

export function isInt32(num: number) {
  return Number.isSafeInteger(num) && num >= -Math.pow(2, 31) && num < Math.pow(2, 31);
}

export function assertInt32(num: number) {
  if (!isInt32(num)) {
    throw new Error('Invalid number specified: int32_t is required');
  }
}

export function assertArray(arr: any[]) {
  if (!Array.isArray(arr)) {
    throw new Error('Invalid parameter specified. Array is required!');
  }
}

export function isValidRadix(radix: number) {
  return Number.isSafeInteger(radix) && radix >= 2 && radix <= 36;
}

export function assertValidRadix(radix: number) {
  if (!isValidRadix(radix)) {
    throw new Error('radix must have a value between 2 and 36');
  }
}
