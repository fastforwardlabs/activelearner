import React, { Component } from 'react'
import * as chroma from 'chroma-js'
import { label_dict } from './Utils'

let image_num = 40
let images = [...Array(40)].map(n => null)

// fixme: this duplicates projection
let sprite_side = 73
let sprite_size = sprite_side * sprite_side
let sprite_number = 12
let sprite_image_size = 28
// actual sprite size needs to be power of 2
let sprite_actual_size = 2048

let mnist_tile_string = 'mnist_'
let mnist_tile_locations = [...Array(sprite_number)].map(
  (n, i) => `${process.env.PUBLIC_URL}/${mnist_tile_string}${i}.png`
)

let quickdraw_tile_string = 'QUICKDRAW_'
let quickdraw_tile_locations = [...Array(sprite_number)].map(
  (n, i) => `${process.env.PUBLIC_URL}/${quickdraw_tile_string}${i}.png`
)

let tile_dict = {
  MNIST: mnist_tile_locations,
  Quickdraw: quickdraw_tile_locations,
}

let color_num = 10
let status_to_color = [...Array(color_num)].map((n, i) =>
  chroma
    .hsl(0 + (360 / color_num) * i, 1, 0.5)
    .luminance(0.5)
    .hex()
)

let total_dict = {
  MNIST: 60000,
  Quickdraw: 65729,
  Caltech: 822,
}

class Selected extends Component {
  constructor(props) {
    super(props)
    this.state = {
      labels: null,
      prev_loaded: null,
    }
  }

  componentDidUpdate(prevProps) {
    let { embeddings } = this.props

    if (this.props.loaded_embedding !== prevProps.loaded_embedding) {
      if (prevProps.loaded_embedding === null) {
        // first real loaded set the state
        this.setState({ prev_loaded: this.props.loaded_embedding })
      } else {
        // use the statuses from previous
        let prev_embeddings = embeddings[prevProps.loaded_embedding]
        let selected_indexes = []
        for (let i = 0; i < prev_embeddings.statuses.length; i++) {
          if (prev_embeddings.statuses[i] === 1) {
            selected_indexes.push(i)
          }
        }
        let loaded = embeddings[this.props.loaded_embedding]
        let new_labels = selected_indexes.map((n, i) => loaded.labels[n])
        this.setState({ labels: new_labels })
      }
    }
    if (
      this.props.transition_status === 0.5 &&
      prevProps.transition_status !== 0
    ) {
      // need to make this run in between
      let me = this
      setTimeout(() => {
        me.setState({
          prev_loaded: this.props.loaded_embedding,
          labels: null,
        })
      }, 0)
    }
  }

  render() {
    let {
      width,
      height,
      grem,
      embeddings,
      loaded_embedding,
      transition_status,
      header_height,
      round,
      round_limit,
      dataset,
    } = this.props

    let selected_indexes = []
    // let loaded = embeddings[loaded_embedding]
    let loaded = embeddings[this.state.prev_loaded]
    if (loaded) {
      for (let i = 0; i < loaded.statuses.length; i++) {
        if (loaded.statuses[i] === 1) {
          selected_indexes.push(i)
        }
      }
    }

    let grid_columns = 3
    let gutter = grem / 2
    let side_padding = grem / 4
    let image_width =
      (width - side_padding * 2 * 2 - gutter * (grid_columns - 1)) /
      grid_columns
    let image_height = image_width

    let image_pickers = selected_indexes.map(loc_index => {
      let sprite_num = Math.floor(loc_index / sprite_size)
      let sprite_index = loc_index % sprite_size
      let column = sprite_index % sprite_side
      let row = Math.floor(sprite_index / sprite_side)
      return [sprite_num, column, row]
    })

    let selected_labels = null
    if (loaded_embedding !== null) {
      selected_labels = selected_indexes.map(
        (n, i) => embeddings[loaded_embedding].labels[i]
      )
    }

    let scale = image_width / sprite_image_size

    let adjusted_round = round
    if (transition_status > 1 && transition_status < 2.3)
      adjusted_round = Math.max(0, adjusted_round - 1)

    return (
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: header_height,
          width: width,
          height: height,
          background: '#333',
          overflow: 'hidden',
        }}
      >
        {transition_status === 0 ? (
          <div
            style={{
              padding: grem / 4,
            }}
          >
            <div
              style={{
                padding: grem / 4,
              }}
            >
              Use the select data button below to select data points based on
              the strategy.
            </div>
          </div>
        ) : null}
        <div
          style={{
            opacity:
              transition_status === 0 ||
              transition_status === 2.6 ||
              round_limit === adjusted_round
                ? 0
                : 1,
            transition: 'opacity 0.4s linear',
            transitionDelay: '0.1s',
            padding: grem / 2,
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              position: 'absolute',
              left: 0,
              top: 0,
              width: width,
              background: '#444',
              padding: `${grem / 4}px ${grem / 2}px`,
            }}
          >
            <div>{transition_status < 2 ? 'Selected' : 'Labeled'}:</div>
            <div>1,000</div>
          </div>
          <div
            style={{
              right: 0,
              top: header_height,
              width: width,
              height: height - grem / 2,
              paddingTop: grem * 1,
              background: '#333',
              overflow: 'auto',
            }}
          >
            <div
              style={{
                display: 'grid',
                paddingTop: side_padding * 2,
                paddingBottom: side_padding * 2,
                gridTemplateColumns: `repeat(${grid_columns}, ${image_width}px)`,
                gridColumnGap: gutter,
                gridRowGap: gutter,
              }}
            >
              {image_pickers.length > 0
                ? image_pickers.map((p, i) => {
                    let label =
                      this.state.labels !== null &&
                      this.props.transition_status > 1.5
                        ? label_dict[dataset][this.state.labels[i]]
                        : 'selected'
                    let background =
                      this.state.labels !== null &&
                      this.props.transition_status > 1.5
                        ? status_to_color[this.state.labels[i]]
                        : '#ddd'
                    return (
                      <div
                        key={p}
                        style={{
                          width: image_width,
                          height: image_height + grem - 3,
                          background: background,
                          color: '#111',
                          textAlign: 'center',
                          transition: 'background 400ms linear',
                          paddingLeft: 3,
                          paddingTop: 3,
                        }}
                      >
                        <div
                          style={{
                            backgroundImage: `url(${tile_dict[dataset][p[0]]})`,
                            backgroundSize: `${scale *
                              sprite_actual_size}px ${scale *
                              sprite_actual_size}px`,
                            backgroundPosition: `-${p[1] *
                              scale *
                              sprite_image_size}px -${p[2] *
                              scale *
                              sprite_image_size}px`,
                            width: image_width - 6,
                            height: image_height - 6,
                            imageRendering: 'pixelated',
                          }}
                        />
                        <div
                          style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {label}
                        </div>
                      </div>
                    )
                  })
                : null}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Selected
