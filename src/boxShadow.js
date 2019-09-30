export const prepareBoxShadowValueFor = value => {
  if (!value.enable) {
    return 'CT_CSS_SKIP_RULE'
  }

  if (
    parseFloat(value.blur) === 0 &&
    parseFloat(value.spread) === 0 &&
    parseFloat(value.v_offset) === 0 &&
    parseFloat(value.h_offset) === 0
  ) {
    return 'CT_CSS_SKIP_RULE'
  }

  const box_shadow_components = []

  if (value.inset) {
    box_shadow_components.push('inset')
  }

  box_shadow_components.push(`${value.h_offset}px`)
  box_shadow_components.push(`${value.v_offset}px`)

  if (parseFloat(value.blur) !== 0) {
    box_shadow_components.push(`${value.blur}px`)

    if (parseFloat(value.spread) !== 0) {
      box_shadow_components.push(`${value.spread}px`)
    }
  }

  if (parseFloat(value.blur) === 0 && parseFloat(value.spread) !== 0) {
    box_shadow_components.push(`${value.blur}px`)
    box_shadow_components.push(`${value.spread}px`)
  }

  box_shadow_components.push(value.color.color)
  return box_shadow_components.join(' ')
}
