import { prepareSpacingValueFor } from './types/spacing'
import { prepareBoxShadowValueFor } from './types/boxShadow'

export const isFunction = (functionToCheck) =>
  functionToCheck && {}.toString.call(functionToCheck) === '[object Function]'

const replaceVariableInAst = (args = {}) => {
  args = {
    variableDescriptor: {},
    value: '',
    ast: {},
    ...args,
  }

  let { variableDescriptor, value, ast } = args

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
  let hasSuchSelector = ast.rules.some(
    ({ selector }) => selector === newSelector
  )

  const ruleToCopy = {
    type: 'ruleset',
    selector: ':root',
    rulelist: {
      type: 'rulelist',
      rules: [
        {
          type: 'declaration',
          name: '--container-max-width',
          value: {
            type: 'expression',
            text: '1290px',
          },
        },
      ],
    },
  }

  let newAst = JSON.parse(JSON.stringify(ast))

  if (hasSuchSelector) {
    newAst.rules = newAst.rules.map((rule) => {
      let { selector } = rule

      if (selector !== newSelector) {
        return rule
      }

      if (
        value.indexOf('CT_CSS_SKIP_RULE') > -1 ||
        value.indexOf(variableName) > -1
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

    return newAst
  }

  if (!hasSuchSelector && value.indexOf('CT_CSS_SKIP_RULE') === -1) {
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

export const replacingLogic = (args = {}) => {
  args = {
    variableDescriptor: {},
    value: {},
    ast: {},
    device: 'desktop',

    ...args,
  }

  let actualValue = args.value

  if (
    (args.variableDescriptor.type || '').indexOf('color') > -1 &&
    args.value !== 'CT_CSS_SKIP_RULE'
  ) {
    actualValue =
      args.value[
        args.variableDescriptor.type === 'color'
          ? 'default'
          : args.variableDescriptor.type.split(':')[1]
      ].color
  }

  if ((args.variableDescriptor.type || '') === 'border') {
    actualValue =
      !args.value || args.value.style === 'none'
        ? 'none'
        : `${args.value.width}px ${args.value.style} ${args.value.color.color}`

    if (args.variableDescriptor.skip_none && actualValue === 'none') {
      actualValue = 'CT_CSS_SKIP_RULE'
    }
  }

  if ((args.variableDescriptor.type || '') === 'spacing') {
    actualValue = prepareSpacingValueFor(
      args.value,
      args.variableDescriptor,
      args.device
    )
  }

  if ((args.variableDescriptor.type || '') === 'box-shadow') {
    actualValue = prepareBoxShadowValueFor(args.value, args.variableDescriptor)
  }

  return replaceVariableInAst({
    variableDescriptor: args.variableDescriptor,
    value: `${actualValue}${args.variableDescriptor.unit || ''}${
      args.variableDescriptor.important ? ' !important' : ''
    }`,
    ast: args.ast,
  })
}
