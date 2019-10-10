import { prepareSpacingValueFor } from './spacing'
import { prepareBoxShadowValueFor } from './boxShadow'

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

  let existingCss = cssContainer.innerText

  const selector = variableDescriptor.selector || ':root'

  const selectorRegex = new RegExp(
    `${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s?{[\\s\\S]*?}`,
    'gm'
  )

  let matchedSelector = existingCss.match(selectorRegex)

  if (!matchedSelector) {
    existingCss = `${existingCss} ${selector} {   }`
    matchedSelector = existingCss.match(selectorRegex)
  }

  cssContainer.innerText = existingCss.replace(
    selectorRegex,
    matchedSelector[0].indexOf(`--${variableDescriptor.variable}:`) > -1
      ? matchedSelector[0].replace(
          new RegExp(`--${variableDescriptor.variable}:[\\s\\S]*?;`, 'gm'),
          value.indexOf('CT_CSS_SKIP_RULE') > -1 ||
          value.indexOf(variableDescriptor.variable) > -1
            ? ``
            : `--${variableDescriptor.variable}: ${value};`
        )
      : matchedSelector[0].replace(
          new RegExp(
            `${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s?{`,
            'gm'
          ),
          `${selector} {${
            value.indexOf('CT_CSS_SKIP_RULE') > -1 ||
            value.indexOf(variableDescriptor.variable) > -1
              ? ``
              : `--${variableDescriptor.variable}: ${value};`
          }`
        )
  )
}

const replacingLogic = (variableDescriptor, value, device = 'desktop') => {
  let actualValue =
    (variableDescriptor.type || '').indexOf('color') > -1
      ? value[
          variableDescriptor.type === 'color'
            ? 'default'
            : variableDescriptor.type.split(':')[1]
        ].color
      : variableDescriptor.extractValue && !variableDescriptor.responsive
        ? variableDescriptor.extractValue(value)
        : value

  if ((variableDescriptor.type || '') === 'border') {
    actualValue =
      value.style === 'none'
        ? 'none'
        : `${value.width}px ${value.style} ${value.color.color}`
  }

  if ((variableDescriptor.type || '') === 'spacing') {
    actualValue = prepareSpacingValueFor(value)
  }

  if ((variableDescriptor.type || '') === 'box-shadow') {
    actualValue = prepareBoxShadowValueFor(value)
  }

  replaceVariableInStyleTag(
    variableDescriptor,
    `${actualValue}${variableDescriptor.unit || ''}${
      variableDescriptor.important ? ' !important' : ''
    }`,
    device
  )

  variableDescriptor.whenDone && variableDescriptor.whenDone(actualValue, value)
}

export const handleSingleVariableFor = (variableDescriptor, value) => {
  if (!variableDescriptor.responsive) {
    replacingLogic(variableDescriptor, value)
    return
  }

  const fullValue = value

  value = variableDescriptor.extractValue
    ? variableDescriptor.extractValue(value)
    : value

  variableDescriptor.whenDone && variableDescriptor.whenDone(value, fullValue)

  value = maybePromoteScalarValueIntoResponsive(value)

  if (variableDescriptor.enabled) {
    if (!wp.customize(variableDescriptor.enabled)() === 'no') {
      value.mobile = '0' + (variableDescriptor.unit ? '' : 'px')
      value.tablet = '0' + (variableDescriptor.unit ? '' : 'px')
      value.desktop = '0' + (variableDescriptor.unit ? '' : 'px')
    }
  }

  replacingLogic(variableDescriptor, value.desktop, 'desktop')
  replacingLogic(variableDescriptor, value.tablet, 'tablet')
  replacingLogic(variableDescriptor, value.mobile, 'mobile')
}

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
