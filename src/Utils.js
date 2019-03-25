export function comma(x) {
  // https://stackoverflow.com/a/2901298/8691291
  var parts = x.toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}
export function toPercent(x) {
  return Math.round(x * 100) + '%'
}

export function toPercent2(x) {
  return Math.round(x * 10000) / 100 + '%'
}

export function drawLine(ctx, x, y, move_boolean) {
  if (move_boolean) {
    ctx.moveTo(x, y)
  } else {
    ctx.lineTo(x, y)
  }
}

export function rangeDiff(range) {
  return range[1] - range[0]
}

export function activeStyle(color) {
  let style = {
    background: color,
    boxShadow: `-0.25em 0 0 ${color}, 0.25em 0 0 ${color}`,
    textDecoration: 'none',
  }
  return style
}

export function decodeS(string) {
  let splits = string.split('-')
  return {
    dataset: splits[0],
    strategy: splits[1],
    round: splits[2],
  }
}

let labels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
let quickdraw_labels = [
  'dolphin',
  'cat',
  'face',
  'angel',
  'airplane',
  'apple',
  'broccoli',
  'crayon',
  'bicycle',
  'elephant',
]
export let label_dict = { MNIST: labels, Quickdraw: quickdraw_labels }
