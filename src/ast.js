import * as shadyCss from 'shady-css-parser'

let styleTagsCache = null

export const clearAstCache = () => {
  styleTagsCache = null
}

export const getStyleTagsWithAst = () => {
  if (styleTagsCache) {
    return styleTagsCache
  }

  const maybeStyle = document.querySelector('#ct-main-styles-inline-css')

  if (!maybeStyle) {
    return []
  }

  const parser = new shadyCss.Parser()

  styleTagsCache = [
    {
      style: maybeStyle,
      ast: parser.parse(maybeStyle.innerText),
    },
  ]

  return styleTagsCache
}

export const persistNewAsts = (styleTags) => {
  styleTagsCache = styleTags

  const stringifier = new shadyCss.Stringifier()

  styleTagsCache.map((styleDescriptor) => {
    styleDescriptor.style.innerText = stringifier.stringify(styleDescriptor.ast)
  })
}
