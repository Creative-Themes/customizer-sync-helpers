import { replaceVariableInAst, replacingLogic } from './ast-replacing-logic'

describe('replacingLogic', () => {
  test('it should handle color variable replacement', () => {
    const variableDescriptor = {
      type: 'color',
    }

    const value = {
      default: { color: '#ff0000' },
    }

    const ast = {
      rules: [],
    }

    const result = replacingLogic({
      variableDescriptor,
      value,
      ast,
    })

    expect(result.rules).toHaveLength(1)
    // Add more assertions based on your specific implementation
  })

  test('it should handle border variable replacement', () => {
    const variableDescriptor = {
      type: 'border',
    }

    const value = {
      width: 1,
      style: 'solid',
      color: { color: '#000000' },
    }

    const ast = {
      rules: [],
    }

    const result = replacingLogic({
      variableDescriptor,
      value,
      ast,
    })

    expect(result.rules).toHaveLength(1)
  })

  test('it should handle spacing variable replacement', () => {
    const variableDescriptor = {
      type: 'spacing',
    }

    const value = {
      top: 1,
      right: 2,
      bottom: 3,
      left: 4,
    }

    const ast = {
      rules: [],
    }

    const result = replacingLogic({
      variableDescriptor,
      value,
      ast,
    })

    expect(result.rules).toHaveLength(1)
  })

  test('it should handle box-shadow variable replacement', () => {
    const variableDescriptor = {
      type: 'box-shadow',
    }

    const value = {
      horizontal: 1,
      vertical: 2,
      blur: 3,
      spread: 4,
      color: { color: '#000000' },
    }

    const ast = {
      rules: [],
    }

    const result = replacingLogic({
      variableDescriptor,
      value,
      ast,
    })

    expect(result.rules).toHaveLength(1)
  })
})
