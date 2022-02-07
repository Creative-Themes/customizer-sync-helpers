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

  let allStyles = [...document.querySelectorAll('style')].filter(
    (s) => s.innerText.indexOf('narrow-container-max-width') > -1
  )

  const maybeIframe = document.querySelector(
    '.edit-post-visual-editor__content-area iframe'
  )

  if (maybeIframe) {
    allStyles = [
      ...allStyles,
      ...[...maybeIframe.contentDocument.querySelectorAll('style')].filter(
        (s) => s.innerText.indexOf('narrow-container-max-width') > -1
      ),
    ]
  }

  styleTagsCache = allStyles.map((style) => ({
    style,
    ast: parser.parse(style.innerText.replace(new RegExp('\n', 'g'), '')),
  }))

  return styleTagsCache
}

export const persistNewAsts = (styleTags) => {
  styleTagsCache = styleTags

  const stringifier = new shadyCss.Stringifier()

  styleTagsCache.map((styleDescriptor) => {
    styleDescriptor.style.innerText = stringifier.stringify(styleDescriptor.ast)
  })
}
