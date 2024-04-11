import { prepareSpacingValueFor } from './types/spacing'
import { prepareBoxShadowValueFor } from './types/boxShadow'

export const isFunction = (functionToCheck) =>
  functionToCheck && {}.toString.call(functionToCheck) === '[object Function]'

// https://stackoverflow.com/a/64489535/3220977
const groupBy = (x, f) =>
  x.reduce((a, b, i) => ((a[f(b, i, x)] ||= []).push(b), a), {})

const variableDescriptorToDeclaration = ({ variableDescriptor, value }) => {
  return {
    type: 'declaration',
    name: variableDescriptor.variableName,
    value: {
      type: 'expression',
      text: value,
    },
  }
}

export const replaceVariableDescriptorsInAst = (args = {}) => {
  args = {
    variableDescriptorsWithValue: [],
    ast: {},

    ...args,
  }

  if (args.variableDescriptorsWithValue.length === 0) {
    return args.ast
  }

  const groupedBySelector = groupBy(
    args.variableDescriptorsWithValue,
    ({ variableDescriptor }) => variableDescriptor.selector
  )

  let processedSelectors = []

  let newAst = {}

  newAst = {
    ...args.ast,

    rules: args.ast.rules.map((ruleset) => {
      if (!ruleset.selector || !groupedBySelector[ruleset.selector]) {
        return ruleset
      }

      processedSelectors.push(ruleset.selector)

      const allDescriptors = groupedBySelector[ruleset.selector]

      let processedVariables = []

      const propertiesWithValue = allDescriptors
        .filter(({ value }) => !value.includes('CT_CSS_SKIP_RULE'))
        .reduce((acc, variableDescriptor) => {
          return {
            ...acc,
            [variableDescriptor.variableDescriptor.variableName]:
              variableDescriptor,
          }
        }, {})

      const propertiesWithoutValue = allDescriptors
        .filter(({ value }) => value.includes('CT_CSS_SKIP_RULE'))
        .reduce((acc, variableDescriptor) => {
          return {
            ...acc,
            [variableDescriptor.variableDescriptor.variableName]:
              variableDescriptor,
          }
        }, {})

      let newRulelistRules = ruleset.rulelist.rules
        // Drop rules that are skipped
        .filter(({ type, name }) => {
          if (type !== 'declaration') {
            return true
          }

          return !propertiesWithoutValue[name]
        })
        .map((declaration) => {
          if (
            declaration.type !== 'declaration' ||
            !propertiesWithValue[declaration.name]
          ) {
            return declaration
          }

          processedVariables.push(declaration.name)

          return {
            ...declaration,
            value: {
              ...declaration.value,
              text: propertiesWithValue[declaration.name].value,
            },
          }
        })

      // Add new properties in existing selectors
      if (
        processedVariables.length !== Object.values(propertiesWithValue).length
      ) {
        newRulelistRules = [
          ...newRulelistRules,
          ...Object.values(propertiesWithValue)
            .filter(
              ({ variableDescriptor }) =>
                !processedVariables.includes(variableDescriptor.variableName)
            )
            .map((variableDescriptorWithValue) => {
              return variableDescriptorToDeclaration(
                variableDescriptorWithValue
              )
            }),
        ]
      }

      return {
        ...ruleset,
        rulelist: {
          ...ruleset.rulelist,
          rules: newRulelistRules,
        },
      }
    }),
  }

  // Add new selectors
  if (processedSelectors.length !== Object.keys(groupedBySelector).length) {
    const selectorsWithActualValues = Object.values(groupedBySelector).filter(
      (variableDescriptorsWithValue) => {
        if (
          processedSelectors.includes(
            variableDescriptorsWithValue[0].variableDescriptor.selector
          )
        ) {
          return false
        }

        if (
          !variableDescriptorsWithValue.find(
            ({ value }) => !value.includes('CT_CSS_SKIP_RULE')
          )
        ) {
          return false
        }

        return true
      }
    )

    newAst = {
      ...newAst,
      rules: [
        ...newAst.rules,

        ...selectorsWithActualValues.map((variableDescriptorsWithValue) => {
          return {
            type: 'ruleset',
            selector:
              variableDescriptorsWithValue[0].variableDescriptor.selector,
            rulelist: {
              type: 'rulelist',
              rules: variableDescriptorsWithValue
                .filter(({ value }) => !value.includes('CT_CSS_SKIP_RULE'))
                .map(variableDescriptorToDeclaration),
            },
          }
        }),
      ],
    }
  }

  return newAst
}
