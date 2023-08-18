export const prepareSpacingValueFor = (value, variableDescriptor) => {
  if (value === 'CT_CSS_SKIP_RULE') {
    return 'CT_CSS_SKIP_RULE'
  }

  // Custom
  if (value.state === 3) {
    if (!value.custom.trim()) {
      return 'CT_CSS_SKIP_RULE'
    }

    return value.custom.trim()
  }

  let emptyValue = 0

  if (variableDescriptor.emptyValue) {
    emptyValue = variableDescriptor.emptyValue
  }

  let result = value.values.map((side) => {
    if (side.value === '' || side.value === 'auto') {
      return {
        ...side,
        value: emptyValue,
      }
    }

    return side
  })

  let shouldSkip = true
  let unit = ''

  result.forEach((side) => {
    if (side.value !== emptyValue) {
      shouldSkip = false
    }

    if (side.unit !== '') {
      unit = side.unit
    }
  })

  if (unit) {
    result = result.map((side) => {
      if (side.unit === '') {
        return {
          ...side,
          unit,
        }
      }

      return side
    })
  }

  if (shouldSkip) {
    return 'CT_CSS_SKIP_RULE'
  }

  result = result.map((side) => {
    return `${side.value}${side.unit}`
  })

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
