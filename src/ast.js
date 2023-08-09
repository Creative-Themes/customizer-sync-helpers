import * as shadyCss from 'shady-css-parser'

const maybeGetPreviewerIframe = () => {
  return document.querySelector(
    '.edit-post-visual-editor__content-area iframe[name="editor-canvas"]'
  )
}

let styleTagsCache = {}

export const clearAstCache = () => {
  styleTagsCache = {}
}

export const getStyleTagsWithAst = (args = {}) => {
  args = {
    cacheId: 'default',
    initialStyleTagsDescriptor: [],
    ...args,
  }

  if (styleTagsCache[args.cacheId]) {
    return styleTagsCache[args.cacheId]
  }

  const parser = new shadyCss.Parser()

  let allStyles = []

  const maybeStyle = document.querySelector('#ct-main-styles-inline-css')

  if (maybeStyle) {
    allStyles.push(maybeStyle)
  }

  styleTagsCache[args.cacheId] = [
    ...args.initialStyleTagsDescriptor,

    ...allStyles.map((style) => ({
      style,
    })),
  ].map((styleDescriptor) => {
    let normalizedStyleDescriptor = {
      readStyles: styleDescriptor.readStyles
        ? styleDescriptor.readStyles
        : () => {
            if (!styleDescriptor.style) {
              throw new Error(
                'No style tag is provided. Please provide a style tag or a readStyles function.'
              )
            }

            return styleDescriptor.style.innerText
          },

      persistStyles: styleDescriptor.persistStyles
        ? styleDescriptor.persistStyles
        : (newCss) => {
            if (!styleDescriptor.style) {
              throw new Error(
                'No style tag is provided. Please provide a style tag or a persistStyles function.'
              )
            }

            styleDescriptor.style.innerText = newCss
          },
    }

    return {
      ...normalizedStyleDescriptor,
      ast: parser.parse(
        normalizedStyleDescriptor
          .readStyles()
          .replace(new RegExp('\n', 'g'), '')
      ),
    }
  })

  return styleTagsCache[args.cacheId]
}

export const persistNewAsts = (cacheId, styleTags) => {
  styleTagsCache[cacheId] = styleTags

  const stringifier = new shadyCss.Stringifier()

  styleTagsCache[cacheId].map((styleDescriptor) => {
    const groupedRules = styleDescriptor.ast.rules.reduce(
      (result, rule) => {
        if (rule.type === 'atRule' && rule.name === 'media') {
          return {
            ...result,
            media: [...result.media, rule],
          }
        }

        return {
          ...result,
          nonMedia: [...result.nonMedia, rule],
        }
      },
      {
        nonMedia: [],
        media: [],
      }
    )

    const newCss = stringifier.stringify({
      ...styleDescriptor.ast,
      rules: [...groupedRules.nonMedia, ...groupedRules.media],
    })

    styleDescriptor.persistStyles(newCss)
  })
}
