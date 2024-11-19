import { maybePromoteScalarValueIntoResponsive } from './promote-into-responsive'
import { getStyleTagsWithAst, persistNewAsts } from './ast'
import {
  replaceVariableDescriptorsInAst,
  isFunction,
} from './ast-replacing-logic'

import { prepareVariableDescriptor } from './prepare-variable-descriptor'

export const getUpdateAstsForStyleDescriptor = (args = {}) => {
  args = {
    variableDescriptor: {},
    value: '',
    fullValue: {},

    tabletMQ: '(max-width: 999.98px)',
    mobileMQ: '(max-width: 689.98px)',

    cacheId: 'default',
    initialStyleTagsDescriptor: [],

    ...args,
  }

  let allDescriptors = args.variableDescriptor

  if (isFunction(allDescriptors)) {
    allDescriptors = allDescriptors(args.value)
  }

  if (!Array.isArray(allDescriptors)) {
    allDescriptors = [allDescriptors]
  }

  return getStyleTagsWithAst({
    cacheId: args['cacheId'],
    initialStyleTagsDescriptor: args.initialStyleTagsDescriptor,
  }).map((styleDescriptor) => {
    const prepareVariableDescriptorsForUpdate = (device) => {
      return (
        device === 'desktop'
          ? allDescriptors
          : allDescriptors.filter(({ responsive }) => !!responsive)
      ).map((variableDescriptor) => {
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

        return prepareVariableDescriptor({
          variableDescriptor,
          value: !!variableDescriptor.responsive ? value[device] : value,
          device,
        })
      })
    }

    let updatedAst = replaceVariableDescriptorsInAst({
      variableDescriptorsWithValue:
        prepareVariableDescriptorsForUpdate('desktop'),
      ast: styleDescriptor.ast,

      device: 'desktop',
    })

    let isResponsive = allDescriptors.find(({ responsive }) => !!responsive)

    if (!isResponsive) {
      return {
        ...styleDescriptor,
        ast: updatedAst,
      }
    }

    if (
      !updatedAst.rules.find(
        ({ type, parameters }) =>
          type === 'atRule' && parameters === args.tabletMQ
      )
    ) {
      updatedAst = {
        ...updatedAst,
        rules: [
          ...updatedAst.rules,
          {
            type: 'atRule',
            name: 'media',
            parameters: args.tabletMQ,
            rulelist: {
              type: 'rulelist',
              rules: [],
            },
          },
        ],
      }
    }

    if (
      !updatedAst.rules.find(
        ({ type, parameters }) =>
          type === 'atRule' && parameters === args.mobileMQ
      )
    ) {
      updatedAst = {
        ...updatedAst,
        rules: [
          ...updatedAst.rules,
          {
            type: 'atRule',
            name: 'media',
            parameters: args.mobileMQ,
            rulelist: {
              type: 'rulelist',
              rules: [],
            },
          },
        ],
      }
    }

    updatedAst = {
      ...updatedAst,
      rules: updatedAst.rules.map((rule) => {
        if (rule.type !== 'atRule') {
          return rule
        }

        let rulelist = rule.rulelist

        if (rule.parameters === args.tabletMQ) {
          rulelist = replaceVariableDescriptorsInAst({
            variableDescriptorsWithValue:
              prepareVariableDescriptorsForUpdate('tablet'),
            ast: rulelist,

            device: 'tablet',
          })
        }

        if (rule.parameters === args.mobileMQ) {
          rulelist = replaceVariableDescriptorsInAst({
            variableDescriptorsWithValue:
              prepareVariableDescriptorsForUpdate('mobile'),
            ast: rulelist,

            device: 'mobile',
          })
        }

        return {
          ...rule,
          rulelist,
        }
      }),
    }

    return {
      ...styleDescriptor,
      ast: updatedAst,
    }
  })
}

export const updateVariableInStyleTags = (args = {}) => {
  args = {
    variableDescriptor: {},
    value: '',
    fullValue: {},

    tabletMQ: '(max-width: 999.98px)',
    mobileMQ: '(max-width: 689.98px)',

    cacheId: 'default',
    initialStyleTagsDescriptor: [],

    ...args,
  }

  persistNewAsts(args['cacheId'], getUpdateAstsForStyleDescriptor(args))
}

export { clearAstCache, getStyleTagsWithAst, persistNewAsts } from './ast'
