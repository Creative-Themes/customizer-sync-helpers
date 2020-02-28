export const prepareSpacingValueFor = value => {
  if (
    [value['top'], value['right'], value['bottom'], value['left']].reduce(
      (isValueCompact, currentValue) =>
        !isValueCompact
          ? false
          : !(
              currentValue !== 'auto' &&
              currentValue &&
              currentValue.toString().match(/\d/g)
            ),
      true
    )
  ) {
    return 'CT_CSS_SKIP_RULE'
  }

  const result = [
    value['top'] === 'auto' || !value['top'].toString().match(/\d/g)
      ? 0
      : value['top'],

    value['right'] === 'auto' || !value['right'].toString().match(/\d/g)
      ? 0
      : value['right'],

    value['bottom'] === 'auto' || !value['bottom'].toString().match(/\d/g)
      ? 0
      : value['bottom'],

    value['left'] === 'auto' || !value['left'].toString().match(/\d/g)
      ? 0
      : value['left']
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
