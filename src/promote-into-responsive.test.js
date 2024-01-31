import { maybePromoteScalarValueIntoResponsive } from './promote-into-responsive'

describe('maybePromoteScalarValueIntoResponsive', () => {
  test('it should return the value if not responsive', () => {
    const value = {
      desktop: 'responsiveValue',
      tablet: 'tabletValue',
      mobile: 'mobileValue',
    }

    const result = maybePromoteScalarValueIntoResponsive(value)

    expect(result).toEqual(value)
  })

  test('it should return the desktop value if already responsive', () => {
    const value = {
      desktop: 'responsiveValue',
      tablet: 'tabletValue',
      mobile: 'mobileValue',
    }

    const result = maybePromoteScalarValueIntoResponsive(value, false)

    expect(result).toEqual(value.desktop)
  })

  test('it should return the scalar value for non-responsive input', () => {
    const scalarValue = 'nonResponsiveValue'

    const result = maybePromoteScalarValueIntoResponsive(scalarValue, false)

    expect(result).toEqual(scalarValue)
  })

  test('it should promote scalar value into responsive format for responsive input', () => {
    const scalarValue = 'responsiveValue'

    const result = maybePromoteScalarValueIntoResponsive(scalarValue)

    expect(result).toEqual({
      desktop: scalarValue,
      tablet: scalarValue,
      mobile: scalarValue,
    })
  })

  // Add more test cases as needed
})
