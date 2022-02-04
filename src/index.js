import { prepareSpacingValueFor } from './types/spacing'
import { prepareBoxShadowValueFor } from './types/boxShadow'

import { maybePromoteScalarValueIntoResponsive } from './promote-into-responsive'
import * as shadyCss from 'shady-css-parser'

import { getStyleTagsWithAst, persistNewAsts } from './ast'

const isFunction = (functionToCheck) =>
  functionToCheck && {}.toString.call(functionToCheck) === '[object Function]'

const replaceVariableInAst = (args = {}) => {
  args = {
    variableDescriptor: {},
    value: '',
    device: 'desktop',
    ast: {},
    ...args,
  }

  let { variableDescriptor, value, device, ast } = args

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

  let hasSuchSelector = ast.rules.find(
    ({ selector }) => selector === newSelector
  )

  const ruleToCopy = ast.rules.find(
    ({ type, rulelist }) => type === 'ruleset' && rulelist.rules.length > 0
  )

  let newAst = JSON.parse(JSON.stringify(ast))

  console.log('here', { newAst })

  if (hasSuchSelector) {
    newAst.rules = newAst.rules.map((rule) => {
      let { selector } = rule

      if (selector !== newSelector) {
        return rule
      }

      if (
        value.indexOf('CT_CSS_SKIP_RULE' || value.indexOf(variableName) > -1) >
        -1
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

      if (hasSuchRule) {
        return {
          ...rule,
          rulelist: {
            ...rule.rulelist,
            rules: rule.rulelist.rules.map((rule) => {
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
            }),
          },
        }
      }

      return {
        ...rule,
        rulelist: {
          ...rule.rulelist,
          rules: [
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

  return newAst
}

const replaceVariableInStyleTag = (args = {}) => {
  args = {
    variableDescriptor: {},
    value: '',
    device: 'desktop',
    ...args,
  }

  persistNewAsts(
    getStyleTagsWithAst().map((styleDescriptor) => {
      return {
        ...styleDescriptor,
        ast: replaceVariableInAst({
          ...args,
          ast: styleDescriptor.ast,
        }),
      }
    })
  )
}

const replacingLogic = (args = {}) => {
  const {
    variableDescriptor,
    value,
    device = 'desktop',
    ast,
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
  args = {
    variableDescriptor: {},
    value: '',
    fullValue: {},

    // TODO: multiple styles matching

    ...args,
  }

  let allDescriptors = Array.isArray(args.variableDescriptor)
    ? args.variableDescriptor
    : [args.variableDescriptor]

  persistNewAsts(
    getStyleTagsWithAst().map((styleDescriptor) => {
      return {
        ...styleDescriptor,
        ast: allDescriptors.reduce((currentAst, variableDescriptor) => {
          let value = variableDescriptor.fullValue ? args.fullValue : args.value

          value = variableDescriptor.extractValue
            ? variableDescriptor.extractValue(value)
            : value

          if (variableDescriptor.whenDone) {
            variableDescriptor.whenDone(value, args.value)
          }

          value = maybePromoteScalarValueIntoResponsive(
            value,
            !!variableDescriptor.responsive
          )

          if (!variableDescriptor.responsive) {
            return replacingLogic({
              variableDescriptor,
              value,
              device: 'desktop',
              ast: currentAst,
            })
          }

          return replacingLogic({
            variableDescriptor,
            value: value.desktop,
            device: 'desktop',
            ast: currentAst,
          })
        }, styleDescriptor.ast),
      }
    })
  )

  console.log('here', variableDescriptor)

  return

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
