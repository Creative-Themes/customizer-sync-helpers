import { clearAstCache, getStyleTagsWithAst, persistNewAsts } from './ast'
import { getUpdateAstsForStyleDescriptor } from './'

import nanoid from 'nanoid'

test('it adds previously non-existing in the style tag', () => {
  const emptyStyle = document.createElement('style')

  emptyStyle.innerText = ''

  const cacheId = nanoid()
  const commonArgs = {
    cacheId,
    initialStyleTags: [emptyStyle],
  }

  const astDescriptor = getStyleTagsWithAst(commonArgs)

  const value = {
    default: {
      color: 'red',
    },
  }

  // TODO: part to be refactored
  const newAst = getUpdateAstsForStyleDescriptor({
    variableDescriptor: {
      selector: ':root',
      variable: 'theme-text-color',
      type: 'color',
    },

    value,
    fullValue: { fontColor: value },

    tabletMQ: '(max-width: 800px)',
    mobileMQ: '(max-width: 370px)',

    ...commonArgs,
  })

  persistNewAsts(cacheId, newAst)

  expect(emptyStyle.innerText).toBe(':root{--theme-text-color:red;}')
})

test('it adds previously non-existing in the style tag with multiple variable descriptors', () => {
  const emptyStyle = document.createElement('style')

  emptyStyle.innerText = ''

  emptyStyle.innerText = ':root{--theme-text-color:blue;}'

  const cacheId = nanoid()
  const commonArgs = {
    cacheId,
    initialStyleTags: [emptyStyle],
  }

  const astDescriptor = getStyleTagsWithAst(commonArgs)

  const value = {
    default: {
      color: 'red',
    },
  }

  // TODO: part to be refactored
  const newAst = getUpdateAstsForStyleDescriptor({
    variableDescriptor: [
      {
        selector: ':root',
        variable: 'theme-text-color',
        type: 'color',
      },

      {
        selector: ':root',
        variable: 'theme-text-color-hover',
        type: 'color',
      },

      {
        selector: 'body',
        variable: 'theme-text-color-hover',
        type: 'color',
      },
    ],

    value,
    fullValue: { fontColor: value },

    tabletMQ: '(max-width: 800px)',
    mobileMQ: '(max-width: 370px)',

    ...commonArgs,
  })

  persistNewAsts(cacheId, newAst)

  expect(emptyStyle.innerText).toBe(
    ':root{--theme-text-color:red;--theme-text-color-hover:red;}body{--theme-text-color-hover:red;}'
  )
})

test('it drops selectors', () => {
  const emptyStyle = document.createElement('style')

  emptyStyle.innerText = ''

  emptyStyle.innerText = ':root{--theme-text-color:blue;}'

  const cacheId = nanoid()
  const commonArgs = {
    cacheId,
    initialStyleTags: [emptyStyle],
  }

  const astDescriptor = getStyleTagsWithAst(commonArgs)

  const value = {
    default: {
      color: 'CT_CSS_SKIP_RULE',
    },
  }

  // TODO: part to be refactored
  const newAst = getUpdateAstsForStyleDescriptor({
    variableDescriptor: [
      {
        selector: ':root',
        variable: 'theme-text-color',
        type: 'color',
      },
    ],

    value,
    fullValue: { fontColor: value },

    tabletMQ: '(max-width: 800px)',
    mobileMQ: '(max-width: 370px)',

    ...commonArgs,
  })

  persistNewAsts(cacheId, newAst)

  expect(emptyStyle.innerText).toBe(':root{}')
})
