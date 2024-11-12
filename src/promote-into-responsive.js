export const maybePromoteScalarValueIntoResponsive = (
  value,
  isResponsive = true
) => {
  /**
   * Responsive value must necessarily have the desktop key attached to it
   */
  if (value && Object.keys(value).indexOf('desktop') > -1) {
    if (!isResponsive) {
      return value.desktop
    }

    return value
  }

  if (!isResponsive) {
    return value
  }

  return {
    desktop: value,
    tablet: value,
    mobile: value,
  }
}
