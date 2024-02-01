import { prepareSpacingValueFor } from './types/spacing'
import { prepareBoxShadowValueFor } from './types/boxShadow'

import { isFunction } from './ast-replacing-logic'

export const prepareVariableDescriptor = (args = {}) => {
  args = {
    variableDescriptor: {},
    value: {},
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

  let variablePrefix = '--'

  if (args.variableDescriptor.variableType === 'property') {
    variablePrefix = ''
  }

  let variableName = `${variablePrefix}${
    isFunction(args.variableDescriptor.variable)
      ? args.variableDescriptor.variable()
      : args.variableDescriptor.variable
  }`

  return {
    variableDescriptor: {
      ...args.variableDescriptor,
      selector: args.variableDescriptor.selector || ':root',
      variableName,
    },
    value: `${actualValue}${args.variableDescriptor.unit || ''}${
      args.variableDescriptor.important ? ' !important' : ''
    }`,
  }
}
