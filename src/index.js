import { prepareSpacingValueFor } from './spacing'
import { maybePromoteScalarValueIntoResponsive } from './promote-into-responsive'
import { prepareBoxShadowValueFor } from './boxShadow'

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

  let selectorRegex = null
  let matchedSelector = existingCss.match(selectorRegex)

  if (existingCss.trim().indexOf(selectorRegex) === 0) {
    selectorRegex = new RegExp(
      `${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s?{[\\s\\S]*?}`,
      'gm'
    )

    matchedSelector = existingCss.match(selectorRegex)
  } else {
    selectorRegex = new RegExp(
      `\\}\\s*?${selector.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      )}\\s?{[\\s\\S]*?}`,
      'gm'
    )

    matchedSelector = existingCss.match(selectorRegex)
  }

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
}

export const handleSingleVariableFor = (variableDescriptor, value) => {
  const fullValue = value

  value = variableDescriptor.extractValue
    ? variableDescriptor.extractValue(value)
    : value

  variableDescriptor.whenDone && variableDescriptor.whenDone(value, fullValue)

  value = maybePromoteScalarValueIntoResponsive(
    value,
    !!variableDescriptor.responsive
  )

  if (!variableDescriptor.responsive) {
    replacingLogic(variableDescriptor, value)
    return
  }

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
