import React, { Component } from 'react'
import * as chroma from 'chroma-js'

// duplicate from projection
let sprite_actual_size = 2048

let sprite_spec_mnist = {
  sprite_side: 73,
  sprite_size: 73 * 73,
  sprite_number: 12,
  sprite_image_size: 28,
}

let sprite_spec_quickdraw = Object.assign({}, sprite_spec_mnist, {
  sprite_number: 13,
})

let sprite_spec_caltech = Object.assign({}, sprite_spec_mnist, {
  sprite_side: 9,
  sprite_size: 9 * 9,
  sprite_number: 11,
  sprite_image_size: 224,
})

let sprite_spec_dict = {
  MNIST: sprite_spec_mnist,
  Quickdraw: sprite_spec_quickdraw,
  Caltech: sprite_spec_caltech,
}

let mnist_tile_string = 'mnist_'
let mnist_tile_locations = [...Array(sprite_spec_mnist.sprite_number)].map(
  (n, i) => `${process.env.PUBLIC_URL}/${mnist_tile_string}${i}.png`
)

let quickdraw_tile_string = 'QUICKDRAW_'
let quickdraw_tile_locations = [
  ...Array(sprite_spec_quickdraw.sprite_number),
].map((n, i) => `${process.env.PUBLIC_URL}/${quickdraw_tile_string}${i}.png`)

let caltech_tile_string = 'caltech_'
let caltech_tile_locations = [...Array(sprite_spec_caltech.sprite_number)].map(
  (n, i) => `${process.env.PUBLIC_URL}/${caltech_tile_string}${i}.png`
)

let tile_dict = {
  MNIST: mnist_tile_locations,
  Quickdraw: quickdraw_tile_locations,
  Caltech: caltech_tile_locations,
}

class SelectedList extends Component {
  render() {
    let { grem, embeddings, loaded_embedding, dataset, ww, wh } = this.props

    console.log(wh)

    let selected_indexes = []
    // let loaded = embeddings[loaded_embedding]
    let loaded = embeddings[loaded_embedding]
    if (loaded) {
      for (let i = 0; i < loaded.statuses.length; i++) {
        if (loaded.statuses[i] === 1) {
          selected_indexes.push(i)
        }
      }
    }

    let { sprite_size, sprite_side, sprite_image_size } = sprite_spec_dict[
      dataset
    ]

    let target_width = 100 + grem / 2
    let columns = Math.floor((ww - grem) / target_width)
    let image_width = (ww - grem - (columns - 1) * (grem / 2)) / columns
    // let image_columns = Math.round(ww- grem/2) / (target_width + grem / 2))
    // let image_width = Math.floor((ww - grem) / image_columns)
    let scale = image_width / sprite_image_size

    let image_pickers = selected_indexes.map(loc_index => {
      let sprite_num = Math.floor(loc_index / sprite_size)
      let sprite_index = loc_index % sprite_size
      let column = sprite_index % sprite_side
      let row = Math.floor(sprite_index / sprite_side)
      return [sprite_num, column, row]
    })

    return (
      <div style={{ background: '#888' }}>
        <div
          style={{
            padding: grem / 2,
            background: 'white',
            color: 'black',
            position: 'relative',
          }}
        >
          Selected points
          <button
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              padding: grem / 2,
              color: 'black',
            }}
            onClick={() => {
              this.props.toggleList(false)
            }}
          >
            &times;
          </button>
        </div>
        <div style={{ overflow: 'auto', height: wh - grem * 6 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fill, ${image_width}px)`,
              gridRowGap: grem / 2,
              gridColumnGap: grem / 2,
              padding: grem / 2,
            }}
          >
            {image_pickers.length > 0
              ? image_pickers.map((p, i) => {
                  return (
                    <div
                      key={p}
                      style={{ paddingBottom: '100%', position: 'relative' }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          right: 0,
                          bottom: 0,
                          backgroundImage: `url(${tile_dict[dataset][p[0]]})`,
                          backgroundSize: `${scale *
                            sprite_actual_size}px ${scale *
                            sprite_actual_size}px`,
                          backgroundPosition: `-${p[1] *
                            scale *
                            sprite_image_size}px -${p[2] *
                            scale *
                            sprite_image_size}px`,
                          imageRendering: 'pixelated',
                        }}
                      />
                    </div>
                  )
                })
              : null}
          </div>
        </div>
      </div>
    )
  }
}

export default SelectedList
