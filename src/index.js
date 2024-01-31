import { maybePromoteScalarValueIntoResponsive } from './promote-into-responsive'
import { getStyleTagsWithAst, persistNewAsts } from './ast'
import { isFunction, replacingLogic } from './ast-replacing-logic'

export const getAllDescriptors = (
  args = {},
  allDescriptors,
  styleDescriptor
) => {
  return allDescriptors.reduce((currentAst, variableDescriptor) => {
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
      !tabletAst.rules.some(
        ({ type, parameters }) =>
          type === 'atRule' && parameters === args.tabletMQ
      )
    ) {
      tabletAst.rules.push({
        type: 'atRule',
        name: 'media',
        parameters: args.tabletMQ,
        rulelist: {
          type: 'rulelist',
          rules: [],
        },
      })
    }

    tabletAst = {
      ...tabletAst,
    }

    let mobileAst = tabletAst

    if (
      !mobileAst.rules.some(
        ({ type, parameters }) =>
          type === 'atRule' && parameters === args.mobileMQ
      )
    ) {
      mobileAst.rules.push({
        type: 'atRule',
        name: 'media',
        parameters: args.mobileMQ,
        rulelist: {
          type: 'rulelist',
          rules: [],
        },
      })
    }

    mobileAst = {
      ...mobileAst,
      rules: mobileAst.rules.map((rule) => {
        if (
          rule.type !== 'atRule' ||
          (rule.parameters !== args.mobileMQ &&
            rule.parameters !== args.tabletMQ)
        ) {
          return rule
        }

        if (rule.parameters === args.mobileMQ) {
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
              ast: rule.rulelist,
              value: value.mobile,
              device: 'mobile',
            }),
          }
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
            ast: rule.rulelist,
            value: value.tablet,
            device: 'tablet',
          }),
        }
      }),
    }

    return mobileAst
  }, styleDescriptor.ast)
}

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

  return getStyleTagsWithAst({
    cacheId: args['cacheId'],
    initialStyleTagsDescriptor: args.initialStyleTagsDescriptor,

    // TODO: rename
    parentArgs: args,
  }).map((styleDescriptor) => {
    return {
      ...styleDescriptor,
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
