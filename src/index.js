import { prepareSpacingValueFor } from './spacing'
import { maybePromoteScalarValueIntoResponsive } from './promote-into-responsive'
import { prepareBoxShadowValueFor } from './boxShadow'
import * as shadyCss from 'shady-css-parser'

const deviceMapping = {
  desktop: 'ct-main-styles-inline-css',
  tablet: 'ct-main-styles-tablet-inline-css',
  mobile: 'ct-main-styles-mobile-inline-css',
}

const cssParsedIndex = {
  desktop: { ast: {} },
  tablet: { ast: {} },
  mobile: { ast: {} },
}

const isFunction = (functionToCheck) =>
  functionToCheck && {}.toString.call(functionToCheck) === '[object Function]'

const replaceVariableInStyleTag = (
  variableDescriptor,
  value,
  device = 'desktop'
) => {
  const newSelector = `${
    variableDescriptor[`${device}_selector_prefix`]
      ? `${variableDescriptor[`${device}_selector_prefix`]} `
      : ''
  }${variableDescriptor.selector || ':root'}`

  let variablePrefix = '--'

  if (variableDescriptor.variableType === 'property') {
    variablePrefix = ''
  }

  let variableName = `${variablePrefix}${
    isFunction(variableDescriptor.variable)
      ? variableDescriptor.variable()
      : variableDescriptor.variable
  }`

  let hasSuchSelector = cssParsedIndex[device].ast.rules.find(
    ({ selector }) => selector === newSelector
  )

  const ruleToCopy = cssParsedIndex[device].ast.rules.find(
    ({ type, rulelist }) => type === 'ruleset' && rulelist.rules.length > 0
  )

  const newAst = {
    ...cssParsedIndex[device].ast,

    rules: hasSuchSelector
      ? cssParsedIndex[device].ast.rules.map((rule) => {
          let { selector } = rule

          if (selector !== newSelector) {
            return rule
          }

          if (
            value.indexOf(
              'CT_CSS_SKIP_RULE' || value.indexOf(variableName) > -1
            ) > -1
          ) {
            return {
              ...rule,
              rulelist: {
                ...rule.rulelist,
                rules: rule.rulelist.rules.filter(
                  ({ name }) => name !== variableName
                ),
              },
            }
          }

          let hasSuchRule = rule.rulelist.rules.find(
            ({ name }) => name === variableName
          )

          return {
            ...rule,
            rulelist: {
              ...rule.rulelist,
              rules: hasSuchRule
                ? rule.rulelist.rules.map((rule) => {
                    if (rule.name === variableName) {
                      return {
                        ...rule,
                        value: {
                          ...rule.value,
                          text: value,
                        },
                      }
                    }

                    return rule
                  })
                : [
                    ...rule.rulelist.rules,
                    {
                      ...ruleToCopy.rulelist.rules[0],
                      name: variableName,
                      value: {
                        ...ruleToCopy.rulelist.rules[0].value,
                        text: value,
                      },
                    },
                  ],
            },
          }
        })
      : [
          ...cssParsedIndex[device].ast.rules,
          {
            ...ruleToCopy,
            selector: newSelector,
            rulelist: {
              ...ruleToCopy.rulelist,
              rules: [
                {
                  ...ruleToCopy.rulelist.rules[0],

                  name: variableName,
                  value: {
                    ...ruleToCopy.rulelist.rules[0].value,
                    text: value,
                  },
                },
              ],
            },
          },
        ],
  }

  const stringifier = new shadyCss.Stringifier()

  cssParsedIndex[device].ast = newAst

  document.querySelector(
    `style#${deviceMapping[device]}`
  ).innerText = stringifier.stringify(newAst)
}

const replacingLogic = (args = {}) => {
  const {
    variableDescriptor,
    value,
    device = 'desktop',
    customReplaceVariableInStyleTag = null,
  } = args

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
      !value || value.style === 'none'
        ? 'none'
        : `${value.width}px ${value.style} ${value.color.color}`

    if (variableDescriptor.skip_none && actualValue === 'none') {
      actualValue = 'CT_CSS_SKIP_RULE'
    }
  }

  if ((variableDescriptor.type || '') === 'spacing') {
    actualValue = prepareSpacingValueFor(value)
  }

  if ((variableDescriptor.type || '') === 'box-shadow') {
    actualValue = prepareBoxShadowValueFor(value, variableDescriptor)
  }

  if (customReplaceVariableInStyleTag) {
    customReplaceVariableInStyleTag({
      replaceVariableInStyleTag,
      variableDescriptor,
      value: `${actualValue}${variableDescriptor.unit || ''}${
        variableDescriptor.important ? ' !important' : ''
      }`,
      device,
    })
  } else {
    replaceVariableInStyleTag(
      variableDescriptor,
      `${actualValue}${variableDescriptor.unit || ''}${
        variableDescriptor.important ? ' !important' : ''
      }`,
      device
    )
  }
}

export const handleSingleVariableFor = (
  variableDescriptor,
  value,
  customReplaceVariableInStyleTag = null
) => {
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
    replacingLogic({
      variableDescriptor,
      value,
      customReplaceVariableInStyleTag,
    })

    return
  }

  if (variableDescriptor.enabled) {
    if (!wp.customize(variableDescriptor.enabled)() === 'no') {
      value.mobile = '0' + (variableDescriptor.unit ? '' : 'px')
      value.tablet = '0' + (variableDescriptor.unit ? '' : 'px')
      value.desktop = '0' + (variableDescriptor.unit ? '' : 'px')
    }
  }

  replacingLogic({
    variableDescriptor,
    value: value.desktop,
    device: 'desktop',
    customReplaceVariableInStyleTag,
  })

  replacingLogic({
    variableDescriptor,
    value: value.tablet,
    device: 'tablet',
    customReplaceVariableInStyleTag,
  })

  replacingLogic({
    variableDescriptor,
    value: value.mobile,
    device: 'mobile',
    customReplaceVariableInStyleTag,
  })
}

export const mountAstCache = () => {
  Object.keys(deviceMapping).map((device) => {
    const cssContainer = document.querySelector(
      `style#${deviceMapping[device]}`
    )

    if (!cssContainer) {
      return
    }

    const parser = new shadyCss.Parser()

    cssParsedIndex[device].ast = parser.parse(cssContainer.innerText)
  })
}

export const handleVariablesFor = (variables) => {
  mountAstCache()

  wp.customize.bind('change', (e) => {
    if (!variables[e.id]) {
      return
    }

    let allDescriptors = variables[e.id]

    if (isFunction(allDescriptors)) {
      allDescriptors = allDescriptors(e())
    }

    if (!Array.isArray(allDescriptors)) {
      allDescriptors = [allDescriptors]
    }

    allDescriptors.map((d) => handleSingleVariableFor(d, e()))
  })
}
