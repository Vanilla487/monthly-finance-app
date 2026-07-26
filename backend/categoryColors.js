export const CATEGORY_COLORS = [
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'blue',
  'purple',
  'pink',
  'grey'
]

export function isValidColor(color) {
  return CATEGORY_COLORS.includes(color)
}