export const prepareSpacingValueFor = (value, variableDescriptor) => {
  if (typeof value === 'string' && value.indexOf('CT_CSS_SKIP_RULE') !== -1) {
    return 'CT_CSS_SKIP_RULE'
  }

  if (
    [value['top'], value['right'], value['bottom'], value['left']].reduce(
      (isValueCompact, currentValue) =>
        !isValueCompact
          ? false
          : !(currentValue !== 'auto' && currentValue.trim() !== ''),
      true
    )
  ) {
    return 'CT_CSS_SKIP_RULE'
  }

  let emptyValue = 0

  if (variableDescriptor.emptyValue) {
    emptyValue = variableDescriptor.emptyValue
  }

  if (emptyValue !== 0) {
    let unit = 0

    Object.values(value).forEach((singularValue) => {
      if (
        singularValue &&
        parseFloat(singularValue).toString() !== singularValue
      ) {
        unit = singularValue
          .toString()
          .replace(parseFloat(singularValue).toString(), '')
      }
    })

    emptyValue = `${emptyValue}${unit}`
  }

  const result = [
    value['top'] === 'auto' ||
    value['top'].trim() === '' ||
    value['top'].toString() === '0'
      ? emptyValue
      : value['top'],

    value['right'] === 'auto' ||
    value['right'].trim() === '' ||
    value['right'].toString() === '0'
      ? emptyValue
      : value['right'],

    value['bottom'] === 'auto' ||
    value['bottom'].trim() === '' ||
    value['bottom'].toString() === '0'
      ? emptyValue
      : value['bottom'],

    value['left'] === 'auto' ||
    value['left'].trim() === '' ||
    value['left'].toString() === '0'
      ? emptyValue
      : value['left'],
  ]

  if (
    result[0] === result[1] &&
    result[0] === result[2] &&
    result[0] === result[3]
  ) {
    return result[0]
  }

  if (result[0] === result[2] && result[1] === result[3]) {
    return `${result[0]} ${result[3]}`
  }

  return result.join(' ')
}
