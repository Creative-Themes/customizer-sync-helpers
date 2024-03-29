const isFunction = (functionToCheck) =>
  functionToCheck && {}.toString.call(functionToCheck) === '[object Function]'

// Maybe this is not needed at all
const handleSingleVariableFor = (variableDescriptor, value) =>
  [
    ...(variableDescriptor.selector
      ? document.querySelectorAll(variableDescriptor.selector)
      : [document.documentElement]),
  ].map((el) => {
    let actualValue =
      (variableDescriptor.type || '').indexOf('color') > -1
        ? value[
            variableDescriptor.type === 'color'
              ? 'default'
              : variableDescriptor.type.split(':')[1]
          ].color
        : variableDescriptor.extractValue
        ? variableDescriptor.extractValue(value)
        : value

    if (actualValue && actualValue.indexOf('CT_CSS_SKIP_RULE') > -1) {
      el.style.removeProperty(`--${variableDescriptor.variable}`)
    } else {
      el.style.setProperty(
        `--${variableDescriptor.variable}`,
        `${actualValue || ''}${variableDescriptor.unit || ''}`
      )
    }
  })

export const handleVariablesFor = (variables) =>
  wp.customize.bind('change', (e) => {
    if (!variables[e.id]) {
      return
    }

    let allVariables = variables[e.id]

    if (isFunction(allVariables)) {
      allVariables = allVariables(e())
    }

    if (!Array.isArray(allVariables)) {
      allVariables = [allVariables]
    }

    allVariables.map((d) => handleSingleVariableFor(d, e()))
  })
