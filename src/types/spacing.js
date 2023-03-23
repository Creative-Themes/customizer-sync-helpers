export const prepareSpacingValueFor = (value) => {
  if (
    [value['top'], value['right'], value['bottom'], value['left']].reduce(
      (isValueCompact, currentValue) =>
        !isValueCompact
          ? false
          : !(
              currentValue !== 'auto' &&
              currentValue.trim() !== '' &&
              currentValue.toString()[0] !== '0'
            ),
      true
    )
  ) {
    return 'CT_CSS_SKIP_RULE'
  }

  const result = [
    value['top'] === 'auto' ||
    value['top'].trim() === '' ||
    value['top'][0] === '0'
      ? 0
      : value['top'],

    value['right'] === 'auto' ||
    value['right'].trim() === '' ||
    value['right'][0] === '0'
      ? 0
      : value['right'],

    value['bottom'] === 'auto' ||
    value['bottom'].trim() === '' ||
    value['bottom'][0] === '0'
      ? 0
      : value['bottom'],

    value['left'] === 'auto' ||
    value['left'].trim() === '' ||
    value['left'][0] === '0'
      ? 0
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
