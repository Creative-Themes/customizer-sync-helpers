import * as shadyCss from 'shady-css-parser'

const maybeGetPreviewerIframe = () => {
  return document.querySelector(
    '.edit-post-visual-editor__content-area iframe[name="editor-canvas"]'
  )
}

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
    (s) => s.innerText && s.innerText.indexOf('narrow-container-max-width') > -1
  )

  const maybeIframe = maybeGetPreviewerIframe()

  if (maybeIframe) {
    allStyles = [
      ...allStyles,
      ...[...maybeIframe.contentDocument.querySelectorAll('style')].filter(
        (s) =>
          s.innerText && s.innerText.indexOf('narrow-container-max-width') > -1
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
    if (!styleDescriptor.style) {
      console.error('No ast for style', styleDescriptor)
      return
    }

    styleDescriptor.style.innerText = stringifier.stringify(styleDescriptor.ast)
  })
}

export const overrideStylesWithAst = () => {
  if (!styleTagsCache) {
    return
  }

  persistNewAsts(
    styleTagsCache.map((styleDescriptor) => {
      if (styleDescriptor.style.id) {
        return styleDescriptor
      }

      let allStyles = [...document.querySelectorAll('style')].filter(
        (s) =>
          s.innerText && s.innerText.indexOf('narrow-container-max-width') > -1
      )

      const maybeIframe = maybeGetPreviewerIframe()

      if (maybeIframe) {
        allStyles = [
          ...allStyles,
          ...[...maybeIframe.contentDocument.querySelectorAll('style')].filter(
            (s) =>
              s.innerText &&
              s.innerText.indexOf('narrow-container-max-width') > -1
          ),
        ]
      }

      styleDescriptor.style = allStyles.find((s) => !s.id)

      return {
        ...styleDescriptor,
      }
    })
  )
}
