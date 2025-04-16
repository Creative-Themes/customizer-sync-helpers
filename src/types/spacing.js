const SPACING_STATE_LINKED = 1
const SPACING_STATE_INDEPENDENT = 2
const SPACING_STATE_CUSTOM = 3

const backportLegacySpacing = (legacy) => {
  if (legacy === 'auto' || legacy === '') {
    return {
      value: legacy,
      unit: '',
    }
  }

  const maybeNumber = parseFloat(legacy)

  if (isNaN(maybeNumber)) {
    return {
      value: '',
      unit: '',
    }
  }

  return {
    value: maybeNumber,
    unit: legacy.toString().replace(maybeNumber.toString(), ''),
  }
}

const transformSpacingValue = (value) => value

export const prepareSpacingValueFor = (value, variableDescriptor, device) => {
  if (value === 'CT_CSS_SKIP_RULE') {
    return 'CT_CSS_SKIP_RULE'
  }

  if (!value.values) {
    value = {
      values: [
        backportLegacySpacing(value.top),
        backportLegacySpacing(value.right),
        backportLegacySpacing(value.bottom),
        backportLegacySpacing(value.left),
      ],
      custom: '',
      state: value.linked ? SPACING_STATE_LINKED : SPACING_STATE_INDEPENDENT,
    }
  }

  const valueTransformerFn =
    variableDescriptor.transformSpacingValue || transformSpacingValue

  // Custom
  if (value.state === SPACING_STATE_CUSTOM) {
    if (!value.custom.trim()) {
      return 'CT_CSS_SKIP_RULE'
    }

    return valueTransformerFn(
      value.custom.trim(),
      [value.custom.trim()],
      device
    )
  }

  let emptyValue = 0

  if (Object.keys(variableDescriptor).includes('emptyValue')) {
    emptyValue = variableDescriptor.emptyValue
  }

  let result = value.values.map((side) => {
    if (side.value === '' || side.value === 'auto') {
      return {
        ...side,
        value: value.state === SPACING_STATE_LINKED ? emptyValue : 0,
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
    return valueTransformerFn(result[0], [result[0]], device)
  }

  if (result[0] === result[2] && result[1] === result[3]) {
    return valueTransformerFn(
      `${result[0]} ${result[3]}`,
      [result[0], result[3]],
      device
    )
  }

  return valueTransformerFn(result.join(' '), result, device)
}
