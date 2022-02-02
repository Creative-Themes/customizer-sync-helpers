import { prepareSpacingValueFor } from './types/spacing'
import { prepareBoxShadowValueFor } from './types/boxShadow'

import { maybePromoteScalarValueIntoResponsive } from './promote-into-responsive'
import * as shadyCss from 'shady-css-parser'

import { getStyleTagsWithAst, persistNewAsts } from './ast'

const isFunction = (functionToCheck) =>
  functionToCheck && {}.toString.call(functionToCheck) === '[object Function]'

const replaceVariableInStyleTag = (args = {}) => {
  args = {
    variableDescriptor: {},
    value: '',
    device: 'desktop',
    ...args,
  }

  let { variableDescriptor, value, device } = args

  const newSelector = variableDescriptor.selector || ':root'

  let variablePrefix = '--'

  if (variableDescriptor.variableType === 'property') {
    variablePrefix = ''
  }

  let variableName = `${variablePrefix}${
    isFunction(variableDescriptor.variable)
      ? variableDescriptor.variable()
      : variableDescriptor.variable
  }`

  persistNewAsts(
    getStyleTagsWithAst().map((styleDescriptor) => {
      let hasSuchSelector = styleDescriptor.ast.rules.find(
        ({ selector }) => selector === newSelector
      )

      const ruleToCopy = styleDescriptor.ast.rules.find(
        ({ type, rulelist }) => type === 'ruleset' && rulelist.rules.length > 0
      )

      let newAst = {
        ...styleDescriptor.ast,
      }

      if (hasSuchSelector) {
        newAst.rules = styleDescriptor.ast.rules.map((rule) => {
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
      }

      if (!hasSuchSelector) {
        newAst.rules = [
          ...newAst.rules,
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
        ]
      }

      return {
        ...styleDescriptor,
        ast: newAst,
      }
    })
  )
}

const replacingLogic = (args = {}) => {
  const {
    variableDescriptor,
    value,
    device = 'desktop',
    ...remainingArgs
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

  replaceVariableInStyleTag({
    variableDescriptor,
    value: `${actualValue}${variableDescriptor.unit || ''}${
      variableDescriptor.important ? ' !important' : ''
    }`,
    device,
  })
}

export const updateVariableInStyleTags = (args = {}) => {
  let { variableDescriptor, value } = {
    variableDescriptor: {},
    value: '',

    // TODO: multiple styles matching

    ...args,
  }

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
    })

    return
  }

  replacingLogic({
    variableDescriptor,
    value: value.desktop,
    device: 'desktop',
  })

  replacingLogic({
    variableDescriptor,
    value: value.tablet,
    device: 'tablet',
  })

  replacingLogic({
    variableDescriptor,
    value: value.mobile,
    device: 'mobile',
  })
}

export { clearAstCache } from './ast'
