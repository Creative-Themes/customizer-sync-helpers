import { maybePromoteScalarValueIntoResponsive } from './promote-into-responsive'
import { getStyleTagsWithAst, persistNewAsts } from './ast'
import {
  replaceVariableDescriptorsInAst,
  isFunction,
  replacingLogic,
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
    const prepareVariableDescriptorsForUpdate = (device) =>
      allDescriptors.map((variableDescriptor) => {
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
          value,
          device,
        })
      })

    return {
      ...styleDescriptor,
      ast: replaceVariableDescriptorsInAst({
        variableDescriptorsWithValue:
          prepareVariableDescriptorsForUpdate('desktop'),
        ast: styleDescriptor.ast,
      }),
    }

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
            ast: currentAst,
          })
        }

        let desktopAst = replacingLogic({
          variableDescriptor,
          value: value.desktop,
          ast: currentAst,
          device: 'desktop',
        })

        let tabletAst = desktopAst

        if (
          !tabletAst.rules.find(
            ({ type, parameters }) =>
              type === 'atRule' && parameters === args.tabletMQ
          )
        ) {
          tabletAst = {
            ...tabletAst,
            rules: [
              ...tabletAst.rules,
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

        tabletAst = {
          ...tabletAst,
          rules: tabletAst.rules.map((rule) => {
            if (rule.type !== 'atRule' || rule.parameters !== args.tabletMQ) {
              return rule
            }

            return {
              ...rule,
              rulelist: replacingLogic({
                variableDescriptor: {
                  ...variableDescriptor,
                  selector:
                    variableDescriptor.selector ===
                    '.edit-post-visual-editor__content-area > div'
                      ? ':root'
                      : variableDescriptor.selector,
                },
                value: value.tablet,
                ast: rule.rulelist,
                device: 'tablet',
              }),
            }
          }),
        }

        let mobileAst = tabletAst

        if (
          !mobileAst.rules.find(
            ({ type, parameters }) =>
              type === 'atRule' && parameters === args.mobileMQ
          )
        ) {
          mobileAst = {
            ...mobileAst,
            rules: [
              ...mobileAst.rules,
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

        mobileAst = {
          ...mobileAst,
          rules: mobileAst.rules.map((rule) => {
            if (rule.type !== 'atRule' || rule.parameters !== args.mobileMQ) {
              return rule
            }

            return {
              ...rule,
              rulelist: replacingLogic({
                variableDescriptor: {
                  ...variableDescriptor,
                  selector:
                    variableDescriptor.selector ===
                    '.edit-post-visual-editor__content-area > div'
                      ? ':root'
                      : variableDescriptor.selector,
                },
                value: value.mobile,
                ast: rule.rulelist,
                device: 'mobile',
              }),
            }
          }),
        }

        return mobileAst
      }, styleDescriptor.ast),
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

export { clearAstCache } from './ast'
