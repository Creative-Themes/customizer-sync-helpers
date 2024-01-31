import { clearAstCache, getStyleTagsWithAst, persistNewAsts } from './ast'
import { getUpdateAstsForStyleDescriptor } from './'

import nanoid from 'nanoid'

const style = document.createElement('style')

style.innerText = `:root {--theme-normal-container-max-width:1290px;--theme-narrow-container-max-width:750px;--theme-wide-offset:130px;--theme-content-spacing:1.5em;--ui-accent-color:#2271b1;--ui-accent-hover-color:#1d6197;--theme-palette-color-1:#2872fa;--theme-palette-color-2:#1559ed;--theme-palette-color-3:#3A4F66;--theme-palette-color-4:#192a3d;--theme-palette-color-5:#e1e8ed;--theme-palette-color-6:#f2f5f7;--theme-palette-color-7:#FAFBFC;--theme-palette-color-8:#ffffff;--theme-text-color:var(--theme-palette-color-3);--theme-link-initial-color:var(--theme-palette-color-1);--theme-link-hover-color:var(--theme-palette-color-2);--theme-border-color:var(--theme-palette-color-5);--theme-headings-color:var(--theme-palette-color-4);--theme-form-field-border-initial-color:var(--theme-border-color);--theme-form-field-border-focus-color:var(--theme-palette-color-1);--theme-button-text-initial-color:#ffffff;--theme-button-text-hover-color:#ffffff;--theme-button-background-initial-color:var(--theme-palette-color-1);--theme-button-background-hover-color:var(--theme-palette-color-2);}`

describe('getStyleTagsWithAst', () => {
  beforeEach(() => {
    // Clear the cache before each test
    clearAstCache()
  })

  test('it parses ast for our style tag', () => {
    const result = getStyleTagsWithAst({
      initialStyleTags: [style],
    })

    expect(result).toHaveLength(1)
    expect(result[0].ast.rules).toHaveLength(1)
    expect(result[0].ast.type).toEqual('stylesheet')
    expect(result[0].ast.range).toEqual({
      end: 1072,
      start: 0,
    })

    expect(result[0].ast.rules[0].rulelist.type).toEqual('rulelist')
    expect(result[0].ast.rules[0].rulelist.rules).toHaveLength(25)
    expect(result[0].ast.rules[0].rulelist.rules[0]).toEqual({
      type: 'declaration',
      name: '--theme-normal-container-max-width',
      value: {
        type: 'expression',
        text: '1290px',
        range: { start: 42, end: 48 },
      },
      nameRange: { start: 7, end: 41 },
      range: { start: 7, end: 49 },
    })
  })

  test('it parses ast for our variableDescriptor', () => {
    const cacheId = nanoid()
    const commonArgs = {
      cacheId,
      initialStyleTags: [style],
    }

    const astDescriptor = getStyleTagsWithAst(commonArgs)

    const newAst = getUpdateAstsForStyleDescriptor({
      variableDescriptor: {
        selector: ':root',
        variable: 'theme-normal-container-max-width',
        unit: 'px',
      },
      value: '1510',
      fullValue: {},
      tabletMQ: '(max-width: 999.98px)',
      mobileMQ: '(max-width: 689.98px)',

      ...commonArgs,
    })

    persistNewAsts(cacheId, newAst)

    expect(astDescriptor).toHaveLength(1)
    expect(astDescriptor[0].ast.type).toEqual('stylesheet')
    expect(astDescriptor[0].ast.rules).toHaveLength(1)
    expect(astDescriptor[0].ast.range).toEqual({
      end: 1072,
      start: 0,
    })
    expect(astDescriptor[0].ast.rules[0].rulelist.rules).toHaveLength(25)

    expect(style.innerText).toBe(
      ':root{--theme-normal-container-max-width:1510px;--theme-narrow-container-max-width:750px;--theme-wide-offset:130px;--theme-content-spacing:1.5em;--ui-accent-color:#2271b1;--ui-accent-hover-color:#1d6197;--theme-palette-color-1:#2872fa;--theme-palette-color-2:#1559ed;--theme-palette-color-3:#3A4F66;--theme-palette-color-4:#192a3d;--theme-palette-color-5:#e1e8ed;--theme-palette-color-6:#f2f5f7;--theme-palette-color-7:#FAFBFC;--theme-palette-color-8:#ffffff;--theme-text-color:var(--theme-palette-color-3);--theme-link-initial-color:var(--theme-palette-color-1);--theme-link-hover-color:var(--theme-palette-color-2);--theme-border-color:var(--theme-palette-color-5);--theme-headings-color:var(--theme-palette-color-4);--theme-form-field-border-initial-color:var(--theme-border-color);--theme-form-field-border-focus-color:var(--theme-palette-color-1);--theme-button-text-initial-color:#ffffff;--theme-button-text-hover-color:#ffffff;--theme-button-background-initial-color:var(--theme-palette-color-1);--theme-button-background-hover-color:var(--theme-palette-color-2);}'
    )
  })

  test('it parses ast for our variableDescriptor for empty style tag', () => {
    const emptyStyle = document.createElement('style')

    emptyStyle.innerText = ''

    const cacheId = nanoid()
    const commonArgs = {
      cacheId,
      initialStyleTags: [emptyStyle],
    }

    const astDescriptor = getStyleTagsWithAst(commonArgs)

    const newAst = getUpdateAstsForStyleDescriptor({
      variableDescriptor: {
        selector: ':root',
        variable: 'theme-normal-container-max-width',
        unit: 'px',
      },
      value: '1510',
      fullValue: {},
      tabletMQ: '(max-width: 999.98px)',
      mobileMQ: '(max-width: 689.98px)',

      ...commonArgs,
    })

    persistNewAsts(cacheId, newAst)

    expect(astDescriptor).toHaveLength(1)
    expect(astDescriptor[0].ast.type).toEqual('stylesheet')
    expect(astDescriptor[0].ast.rules).toHaveLength(0)
    expect(astDescriptor[0].ast.range).toEqual({
      end: 0,
      start: 0,
    })

    expect(emptyStyle.innerText).toBe(
      ':root{--theme-normal-container-max-width:1510px;}'
    )
  })

  test('it parses ast for our variableDescriptor (Colors)', () => {
    const cacheId = nanoid()
    const commonArgs = {
      cacheId,
      initialStyleTags: [style],
    }

    const astDescriptor = getStyleTagsWithAst(commonArgs)

    const newAst = getUpdateAstsForStyleDescriptor({
      variableDescriptor: [
        {
          selector: ':root',
          variable: 'theme-button-text-initial-color',
          type: 'color:default',
        },
        {
          selector: ':root',
          variable: 'theme-button-text-hover-color',
          type: 'color:hover',
        },
      ],
      value: {
        default: {
          color: '#9a2727',
        },
        hover: {
          color: '#ffffff',
        },
      },
      fullValue: {},
      tabletMQ: '(max-width: 999.98px)',
      mobileMQ: '(max-width: 689.98px)',

      ...commonArgs,
    })

    persistNewAsts(cacheId, newAst)

    expect(astDescriptor).toHaveLength(1)
    expect(astDescriptor[0].ast.type).toEqual('stylesheet')
    expect(astDescriptor[0].ast.rules).toHaveLength(1)
    expect(astDescriptor[0].ast.range).toEqual({
      end: 1071,
      start: 0,
    })

    expect(astDescriptor[0].ast.rules[0].rulelist.rules).toHaveLength(25)
    expect(astDescriptor[0].ast.rules[0].rulelist.rules[21]).toEqual({
      type: 'declaration',
      name: '--theme-button-text-initial-color',
      value: {
        type: 'expression',
        text: '#ffffff',
        range: {
          end: 893,
          start: 886,
        },
      },
      nameRange: { start: 852, end: 885 },
      range: { start: 852, end: 894 },
    })
    expect(astDescriptor[0].ast.rules[0].rulelist.rules[22]).toEqual({
      type: 'declaration',
      name: '--theme-button-text-hover-color',
      value: {
        type: 'expression',
        text: '#ffffff',
        range: {
          end: 933,
          start: 926,
        },
      },
      nameRange: { start: 894, end: 925 },
      range: { start: 894, end: 934 },
    })

    expect(style.innerText).toBe(
      ':root{--theme-normal-container-max-width:1510px;--theme-narrow-container-max-width:750px;--theme-wide-offset:130px;--theme-content-spacing:1.5em;--ui-accent-color:#2271b1;--ui-accent-hover-color:#1d6197;--theme-palette-color-1:#2872fa;--theme-palette-color-2:#1559ed;--theme-palette-color-3:#3A4F66;--theme-palette-color-4:#192a3d;--theme-palette-color-5:#e1e8ed;--theme-palette-color-6:#f2f5f7;--theme-palette-color-7:#FAFBFC;--theme-palette-color-8:#ffffff;--theme-text-color:var(--theme-palette-color-3);--theme-link-initial-color:var(--theme-palette-color-1);--theme-link-hover-color:var(--theme-palette-color-2);--theme-border-color:var(--theme-palette-color-5);--theme-headings-color:var(--theme-palette-color-4);--theme-form-field-border-initial-color:var(--theme-border-color);--theme-form-field-border-focus-color:var(--theme-palette-color-1);--theme-button-text-initial-color:#9a2727;--theme-button-text-hover-color:#ffffff;--theme-button-background-initial-color:var(--theme-palette-color-1);--theme-button-background-hover-color:var(--theme-palette-color-2);}'
    )
  })

  test('it parses ast for our variableDescriptor (Colors) for empty style tag', () => {
    const emptyStyle = document.createElement('style')

    emptyStyle.innerText = ''

    const cacheId = nanoid()
    const commonArgs = {
      cacheId,
      initialStyleTags: [emptyStyle],
    }

    const astDescriptor = getStyleTagsWithAst(commonArgs)

    const newAst = getUpdateAstsForStyleDescriptor({
      variableDescriptor: [
        {
          selector: ':root',
          variable: 'theme-button-text-initial-color',
          type: 'color:default',
        },
        {
          selector: ':root',
          variable: 'theme-button-text-hover-color',
          type: 'color:hover',
        },
      ],
      value: {
        default: {
          color: '#9a2727',
        },
        hover: {
          color: '#ffffff',
        },
      },
      fullValue: {},
      tabletMQ: '(max-width: 999.98px)',
      mobileMQ: '(max-width: 689.98px)',

      ...commonArgs,
    })

    persistNewAsts(cacheId, newAst)

    expect(astDescriptor).toHaveLength(1)
    expect(astDescriptor[0].ast.type).toEqual('stylesheet')
    expect(astDescriptor[0].ast.rules).toHaveLength(0)
    expect(astDescriptor[0].ast.range).toEqual({
      end: 0,
      start: 0,
    })

    expect(emptyStyle.innerText).toBe(
      ':root{--theme-button-text-initial-color:#9a2727;--theme-button-text-hover-color:#ffffff;}'
    )
  })

  test('it parses ast for our variableDescriptor (Responsive value)', () => {
    const cacheId = nanoid()
    const commonArgs = {
      cacheId,
      initialStyleTags: [style],
    }

    const astDescriptor = getStyleTagsWithAst(commonArgs)

    const newAst = getUpdateAstsForStyleDescriptor({
      variableDescriptor: {
        selector: ':root',
        variable: 'theme-content-vertical-spacing',
        responsive: true,
        unit: '',
      },
      value: {
        desktop: '157px',
        tablet: '181px',
        mobile: '100vh',
        __changed: ['tablet', 'mobile'],
      },
      fullValue: {},
      tabletMQ: '(max-width: 999.98px)',
      mobileMQ: '(max-width: 689.98px)',

      ...commonArgs,
    })

    persistNewAsts(cacheId, newAst)

    expect(astDescriptor).toHaveLength(1)
    expect(astDescriptor[0].ast.type).toEqual('stylesheet')
    expect(astDescriptor[0].ast.rules).toHaveLength(1)
    expect(astDescriptor[0].ast.range).toEqual({
      end: 1071,
      start: 0,
    })
    expect(astDescriptor[0].ast.rules[0].rulelist.rules).toHaveLength(25)

    expect(style.innerText).toBe(
      ':root{--theme-normal-container-max-width:1510px;--theme-narrow-container-max-width:750px;--theme-wide-offset:130px;--theme-content-spacing:1.5em;--ui-accent-color:#2271b1;--ui-accent-hover-color:#1d6197;--theme-palette-color-1:#2872fa;--theme-palette-color-2:#1559ed;--theme-palette-color-3:#3A4F66;--theme-palette-color-4:#192a3d;--theme-palette-color-5:#e1e8ed;--theme-palette-color-6:#f2f5f7;--theme-palette-color-7:#FAFBFC;--theme-palette-color-8:#ffffff;--theme-text-color:var(--theme-palette-color-3);--theme-link-initial-color:var(--theme-palette-color-1);--theme-link-hover-color:var(--theme-palette-color-2);--theme-border-color:var(--theme-palette-color-5);--theme-headings-color:var(--theme-palette-color-4);--theme-form-field-border-initial-color:var(--theme-border-color);--theme-form-field-border-focus-color:var(--theme-palette-color-1);--theme-button-text-initial-color:#9a2727;--theme-button-text-hover-color:#ffffff;--theme-button-background-initial-color:var(--theme-palette-color-1);--theme-button-background-hover-color:var(--theme-palette-color-2);--theme-content-vertical-spacing:157px;}@media (max-width: 999.98px){:root{--theme-content-vertical-spacing:181px;}}@media (max-width: 689.98px){:root{--theme-content-vertical-spacing:100vh;}}'
    )
  })

  test('it parses ast for our variableDescriptor (Responsive value) for empty style tag', () => {
    const emptyStyle = document.createElement('style')

    emptyStyle.innerText = ''

    const cacheId = nanoid()
    const commonArgs = {
      cacheId,
      initialStyleTags: [emptyStyle],
    }

    const astDescriptor = getStyleTagsWithAst(commonArgs)

    const newAst = getUpdateAstsForStyleDescriptor({
      variableDescriptor: {
        selector: ':root',
        variable: 'theme-content-vertical-spacing',
        responsive: true,
        unit: '',
      },
      value: {
        desktop: '157px',
        tablet: '181px',
        mobile: '100vh',
        __changed: ['tablet', 'mobile'],
      },
      fullValue: {},
      tabletMQ: '(max-width: 999.98px)',
      mobileMQ: '(max-width: 689.98px)',

      ...commonArgs,
    })

    persistNewAsts(cacheId, newAst)

    expect(astDescriptor).toHaveLength(1)
    expect(astDescriptor[0].ast.type).toEqual('stylesheet')
    expect(astDescriptor[0].ast.rules).toHaveLength(0)
    expect(astDescriptor[0].ast.range).toEqual({
      end: 0,
      start: 0,
    })

    expect(emptyStyle.innerText).toBe(
      ':root{--theme-content-vertical-spacing:157px;}@media (max-width: 999.98px){:root{--theme-content-vertical-spacing:181px;}}@media (max-width: 689.98px){:root{--theme-content-vertical-spacing:100vh;}}'
    )
  })
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
