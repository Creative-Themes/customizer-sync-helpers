export const maybePromoteScalarValueIntoResponsive = value =>
  /**
   * Responsive value must necessarily have the desktop key attached to it
   */
  value.desktop
    ? value
    : {
        desktop: value,
        tablet: value,
        mobile: value
      }

const replaceVariableInStyleTag = (
  variableDescriptor,
  value,
  device = 'desktop'
) => {
  const deviceMapping = {
    desktop: 'ct-main-styles-inline-css',
    tablet: 'ct-main-styles-tablet-inline-css',
    mobile: 'ct-main-styles-mobile-inline-css'
  }

  const cssContainer = document.querySelector(`#${deviceMapping[device]}`)

  const existingCss = cssContainer.innerText

  const selector = variableDescriptor.selector || ':root'

  const selectorRegex = new RegExp(
    `${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s?{[\\s\\S]*?}`,
    'gm'
  )

  const matchedSelector = existingCss.match(selectorRegex)

  if (!matchedSelector) return

  cssContainer.innerText = existingCss.replace(
    selectorRegex,
    matchedSelector[0].indexOf(`--${variableDescriptor.variable}:`) > -1
      ? matchedSelector[0].replace(
          new RegExp(`--${variableDescriptor.variable}:[\\s\\S]*?;`, 'gm'),
          value === 'CT_CSS_SKIP_RULE'
            ? ``
            : `--${variableDescriptor.variable}: ${value};`
        )
      : matchedSelector[0].replace(
          new RegExp(
            `${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s?{`,
            'gm'
          ),
          `${selector} {${
            value === 'CT_CSS_SKIP_RULE'
              ? ``
              : `--${variableDescriptor.variable}: ${value};`
          }`
        )
  )
}

const handleSingleVariableFor = (variableDescriptor, value) =>
  [
    ...(variableDescriptor.selector
      ? document.querySelectorAll(variableDescriptor.selector)
      : [document.documentElement])
  ].map(el => {
    if (!variableDescriptor.responsive) {
      let actualValue =
        (variableDescriptor.type || '').indexOf('color') > -1
          ? value[
              variableDescriptor.type === 'color'
                ? 'default'
                : variableDescriptor.type.split(':')[1]
            ].color
          : variableDescriptor.extractValue
            ? variableDescriptor.extractValue(value)
            : value

      if ((variableDescriptor.type || '') === 'border') {
        actualValue =
          value.style === 'none'
            ? 'none'
            : `${value.width}px ${value.style} ${value.color.color}`
      }

      replaceVariableInStyleTag(
        variableDescriptor,
        `${actualValue}${variableDescriptor.unit || ''}`
      )

      variableDescriptor.whenDone && variableDescriptor.whenDone(actualValue)

      return
    }

    value = variableDescriptor.extractValue
      ? variableDescriptor.extractValue(value)
      : value

    variableDescriptor.whenDone && variableDescriptor.whenDone(value)

    value = maybePromoteScalarValueIntoResponsive(value)

    if (variableDescriptor.respect_visibility) {
      if (!wp.customize(variableDescriptor.respect_visibility)().mobile) {
        value.mobile = '0' + (variableDescriptor.unit ? '' : 'px')
      }

      if (!wp.customize(variableDescriptor.respect_visibility)().tablet) {
        value.tablet = '0' + (variableDescriptor.unit ? '' : 'px')
      }

      if (!wp.customize(variableDescriptor.respect_visibility)().desktop) {
        value.desktop = '0' + (variableDescriptor.unit ? '' : 'px')
      }
    }

    if (variableDescriptor.respect_stacking) {
      if (wp.customize(variableDescriptor.respect_stacking)().mobile) {
        value.mobile =
          parseInt(value.mobile, 10) * 2 + (variableDescriptor.unit ? '' : 'px')
      }

      if (wp.customize(variableDescriptor.respect_stacking)().tablet) {
        value.tablet =
          parseInt(value.tablet, 10) * 2 + (variableDescriptor.unit ? '' : 'px')
      }
    }

    if (variableDescriptor.enabled) {
      if (!wp.customize(variableDescriptor.enabled)() === 'no') {
        value.mobile = '0' + (variableDescriptor.unit ? '' : 'px')
        value.tablet = '0' + (variableDescriptor.unit ? '' : 'px')
        value.desktop = '0' + (variableDescriptor.unit ? '' : 'px')
      }
    }

    replaceVariableInStyleTag(
      variableDescriptor,
      `${value.desktop}${variableDescriptor.unit || ''}`,
      'desktop'
    )

    replaceVariableInStyleTag(
      variableDescriptor,
      `${value.tablet}${variableDescriptor.unit || ''}`,
      'tablet'
    )

    replaceVariableInStyleTag(
      variableDescriptor,
      `${value.mobile}${variableDescriptor.unit || ''}`,
      'mobile'
    )
  })

export const handleVariablesFor = variables =>
  wp.customize.bind(
    'change',
    e =>
      variables[e.id] &&
      (Array.isArray(variables[e.id])
        ? variables[e.id]
        : [variables[e.id]]
      ).map(d => handleSingleVariableFor(d, e()))
  )
