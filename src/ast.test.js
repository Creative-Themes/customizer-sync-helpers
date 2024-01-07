import { getStyleTagsWithAst, persistNewAsts } from './ast'
import { getUpdateAstsForStyleDescriptor } from './'

import nanoid from 'nanoid'

const style = document.createElement('style')

style.innerText = `:root {--theme-normal-container-max-width:1290px;--theme-narrow-container-max-width:750px;--theme-wide-offset:130px;--theme-content-spacing:1.5em;--ui-accent-color:#2271b1;--ui-accent-hover-color:#1d6197;--theme-palette-color-1:#2872fa;--theme-palette-color-2:#1559ed;--theme-palette-color-3:#3A4F66;--theme-palette-color-4:#192a3d;--theme-palette-color-5:#e1e8ed;--theme-palette-color-6:#f2f5f7;--theme-palette-color-7:#FAFBFC;--theme-palette-color-8:#ffffff;--theme-text-color:var(--theme-palette-color-3);--theme-link-initial-color:var(--theme-palette-color-1);--theme-link-hover-color:var(--theme-palette-color-2);--theme-border-color:var(--theme-palette-color-5);--theme-headings-color:var(--theme-palette-color-4);--theme-form-field-border-initial-color:var(--theme-border-color);--theme-form-field-border-focus-color:var(--theme-palette-color-1);--theme-button-text-initial-color:#ffffff;--theme-button-text-hover-color:#ffffff;--theme-button-background-initial-color:var(--theme-palette-color-1);--theme-button-background-hover-color:var(--theme-palette-color-2);}`

// console.log(getStyleTagsWithAst({ initialStyleTags: [style] })[0].ast)

test('it parses ast for our style tag', () => {
  expect(
    getStyleTagsWithAst({
      cacheId: nanoid(),
      initialStyleTags: [style],
    })
  ).toHaveLength(1)
})

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
