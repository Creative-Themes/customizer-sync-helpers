import { maybePromoteScalarValueIntoResponsive } from './promote-into-responsive'
import { getStyleTagsWithAst, persistNewAsts } from './ast'
import { replacingLogic } from './ast-replacing-logic'

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
              ast: currentAst,
            })
          }

          return replacingLogic({
            variableDescriptor,
            value: value.desktop,
            ast: currentAst,
          })
        }, styleDescriptor.ast),
      }
    })
  )
}

export { clearAstCache } from './ast'
