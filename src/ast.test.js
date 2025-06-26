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

test('it correctly outputs stuff', () => {
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
      color: '#9f2020',
    },
    hover: {
      color: 'CT_CSS_SKIP_RULEDEFAULT',
    },
  }

  const newAst = getUpdateAstsForStyleDescriptor({
    variableDescriptor: [
      {
        selector: '.woocommerce-product-gallery',
        variable: 'flexy-nav-background-color',
        type: 'color:default',
      },
      {
        selector: '.woocommerce-product-gallery',
        variable: 'flexy-nav-background-hover-color',
        type: 'color:hover',
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
    '.woocommerce-product-gallery{--flexy-nav-background-color:#9f2020;}'
  )
})

test('it implements responsive selector', () => {
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
      selector: {
        desktop: ':rootdesktop',
        tablet: ':roottablet',
        mobile: ':rootmobile',
      },
      variable: 'theme-text-color',
      type: 'color',
      responsive: true,
    },

    value,
    fullValue: { fontColor: value },

    tabletMQ: '(max-width: 800px)',
    mobileMQ: '(max-width: 370px)',

    ...commonArgs,
  })

  persistNewAsts(cacheId, newAst)

  expect(emptyStyle.innerText).toBe(
    ':rootdesktop{--theme-text-color:red;}@media (max-width: 800px){:roottablet{--theme-text-color:red;}}@media (max-width: 370px){:rootmobile{--theme-text-color:red;}}'
  )
})

test('it cleans style selector with mentioned selector rule', () => {
  const emptyStyle = document.createElement('style')

  emptyStyle.innerText =
    ':root-similar{--theme-text-color:blue;}:root-not-similar{--theme-text-color:green;}'

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
      dropSelectors: [':root-similar'],
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

  expect(emptyStyle.innerText).toBe(
    ':root-not-similar{--theme-text-color:green;}:root{--theme-text-color:red;}'
  )
})

test('it drops selectors that contain dropSelector as suffix', () => {
  const style = document.createElement('style')

  style.innerText =
    ':button-root{--theme-bg:yellow;}:button-root-light{--theme-bg:orange;}'

  const cacheId = nanoid()
  const commonArgs = {
    cacheId,
    initialStyleTags: [style],
  }

  const astDescriptor = getStyleTagsWithAst(commonArgs)

  const newAst = getUpdateAstsForStyleDescriptor({
    variableDescriptor: {
      selector: ':root',
      dropSelectors: ['-light'], // matches ":button-root-light"
      variable: 'theme-bg',
      type: 'color',
    },
    value: { default: { color: 'green' } },
    fullValue: {},
    tabletMQ: '',
    mobileMQ: '',
    ...commonArgs,
  })

  persistNewAsts(cacheId, newAst)

  expect(style.innerText).toBe(
    ':button-root{--theme-bg:yellow;}:root{--theme-bg:green;}'
  )
})

test('it keeps all selectors when dropSelectors is empty or missing', () => {
  const style = document.createElement('style')

  style.innerText =
    ':card{--theme-border:red;}:card-hover{--theme-border:pink;}'

  const cacheId = nanoid()
  const commonArgs = {
    cacheId,
    initialStyleTags: [style],
  }

  const astDescriptor = getStyleTagsWithAst(commonArgs)

  const newAst = getUpdateAstsForStyleDescriptor({
    variableDescriptor: {
      selector: ':card-focused',
      variable: 'theme-border',
      type: 'color',
    },
    value: { default: { color: 'orange' } },
    fullValue: {},
    tabletMQ: '',
    mobileMQ: '',
    ...commonArgs,
  })

  persistNewAsts(cacheId, newAst)

  expect(style.innerText).toBe(
    ':card{--theme-border:red;}:card-hover{--theme-border:pink;}:card-focused{--theme-border:orange;}'
  )
})

test('it drops multiple selectors if partially matched', () => {
  const style = document.createElement('style')

  style.innerText =
    ':theme-dark{--c:white;}:theme-light{--c:black;}:theme-auto{--c:gray;}'

  const cacheId = nanoid()
  const commonArgs = {
    cacheId,
    initialStyleTags: [style],
  }

  const astDescriptor = getStyleTagsWithAst(commonArgs)

  const newAst = getUpdateAstsForStyleDescriptor({
    variableDescriptor: {
      selector: ':theme-neutral',
      dropSelectors: ['dark', 'light'], // matches both
      variable: 'c',
      type: 'color',
    },
    value: { default: { color: 'blue' } },
    fullValue: {},
    tabletMQ: '',
    mobileMQ: '',
    ...commonArgs,
  })

  persistNewAsts(cacheId, newAst)

  expect(style.innerText).toBe(
    ':theme-auto{--c:gray;}:theme-neutral{--c:blue;}'
  )
})

test('it removes all existing selectors and keeps only the new one', () => {
  const style = document.createElement('style')

  style.innerText =
    ':header{--space:12px;}:footer{--space:16px;}:body{--space:10px;}'

  const cacheId = nanoid()
  const commonArgs = {
    cacheId,
    initialStyleTags: [style],
  }

  const astDescriptor = getStyleTagsWithAst(commonArgs)

  const newAst = getUpdateAstsForStyleDescriptor({
    variableDescriptor: {
      selector: ':page',
      dropSelectors: ['header', 'footer', 'body'],
      variable: 'space',
      type: 'color',
    },
    value: { default: { color: '20px' } },
    fullValue: {},
    tabletMQ: '',
    mobileMQ: '',
    ...commonArgs,
  })

  persistNewAsts(cacheId, newAst)

  expect(style.innerText).toBe(':page{--space:20px;}')
})

test('drops newly added selector when it matches dropSelectors (should NOT)', () => {
  const style = document.createElement('style')

  style.innerText =
    ':root-similar{--theme-color:blue;}:root-not-similar{--theme-color:green;}'

  const cacheId = nanoid()
  const commonArgs = {
    cacheId,
    initialStyleTags: [style],
  }

  const astDescriptor = getStyleTagsWithAst(commonArgs)

  const newAst = getUpdateAstsForStyleDescriptor({
    variableDescriptor: {
      selector: ':root',
      dropSelectors: [':root'], // matches the new selector
      variable: 'theme-color',
      type: 'color',
    },
    value: { default: { color: 'purple' } },
    fullValue: {},
    tabletMQ: '',
    mobileMQ: '',
    ...commonArgs,
  })

  persistNewAsts(cacheId, newAst)

  // This expectation will fail — :root gets dropped
  expect(style.innerText).toBe(':root{--theme-color:purple;}')
})
