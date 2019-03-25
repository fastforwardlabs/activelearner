import React, { Component } from 'react'
import Header from './Header'
import Footer from './Footer'
import { activeStyle } from './Utils'
import ProjectionSelected from './ProjectionSelected'
import BigButton from './BigButton'
import Timer from './Timer'
import * as chroma from 'chroma-js'

// let strategy_colors = ['#1b9e77', '#d95f02', '#7570b3', '#e7298a']

let color_num = 4
let strategy_colors = [...Array(color_num)].map((n, i) =>
  chroma
    .hsl(-45 + (90 / color_num) * i, 1, 0.5)
    .luminance(0.5)
    .hex()
)

// fixme: this duplicates projection
let sprite_side = 73
let sprite_size = sprite_side * sprite_side
let sprite_number = 12
let sprite_image_size = 28
// actual sprite size needs to be power of 2
let sprite_actual_size = 2048

let ranges = []
for (let i = 0; i < sprite_number; i++) {
  let start = i * sprite_size
  let end = (i + 1) * sprite_size
  if (i === sprite_number - 1) end = sprite_number * sprite_size
  ranges.push([start, end])
}

let mnist_tile_string = 'mnist_'
let mnist_tile_locations = [...Array(sprite_number)].map(
  (n, i) => `${process.env.PUBLIC_URL}/${mnist_tile_string}${i}.png`
)
let mnist_images = mnist_tile_locations.map(src => {
  let img = document.createElement('img')
  img.src = src
  return img
})

color_num = 10
let color_array_hexes = [...Array(color_num)].map((n, i) =>
  chroma
    .hsl(0 + (360 / color_num) * i, 1, 0.5)
    .luminance(0.5)
    .hex()
)
let gradient_string = color_array_hexes.reduce((total, curr, i) => {
  return (
    total +
    curr +
    ' ' +
    Math.round((i / color_num) * 100) +
    (i === color_num - 1 ? '%' : '%, ')
  )
}, '')

let transition_timings = [400]

// let strategy_colors = ['#66c2a5','#fc8d62','#8da0cb','#e78ac3']

class Layout extends Component {
  constructor(props) {
    super(props)
    this.state = {
      ww: null,
      wh: null,
      header_height: null,
      footer_height: null,
      transition_status: 0,
      loading_round: false,
      simulating_labeling: false,
    }
    this.setSize = this.setSize.bind(this)
    this.setHeaderHeight = this.setHeaderHeight.bind(this)
    this.setFooterHeight = this.setFooterHeight.bind(this)
    this.setTransitionStatus = this.setTransitionStatus.bind(this)
    this.labelsGotten = this.labelsGotten.bind(this)
  }

  setHeaderHeight(height) {
    this.setState({ header_height: height })
  }

  setFooterHeight(height) {
    this.setState({ footer_height: height })
  }

  setSize() {
    this.setState({ ww: window.innerWidth, wh: window.innerHeight })
  }

  componentWillMount() {
    this.setSize()
  }

  componentDidMount() {
    window.addEventListener('resize', this.setSize)
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.state.loading_round === true &&
      prevProps.loaded_embedding !== this.props.loaded_embedding
    ) {
      this.setState({ loading_round: false })
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setSize)
  }

  setTransitionStatus(status) {
    if (status === 1.5) {
      this.setState({ transition_status: status, simulating_labeling: true })
      this.props.selectRound(this.props.round + 1)
    } else {
      this.setState({ transition_status: status })
    }
  }

  labelsGotten() {
    this.setState({
      transition_status: 2,
      loading_round: true,
      simulating_labeling: false,
    })
  }

  render() {
    let {
      ww,
      wh,
      header_height,
      footer_height,
      loading_round,
      simulating_labeling,
      transition_status,
    } = this.state
    let {
      dataset,
      strategy,
      round,
      datasets,
      strategies,
      selectDataset,
      selectStrategy,
      embeddings,
      requested_embedding,
      loaded_embedding,
      strategy_explored,
    } = this.props

    let font_size = 14
    let line_height = 1.5
    let grem = font_size * line_height

    let round_limit = 7

    return ww === null ? (
      <div style={{ padding: grem / 4 }}>Loading layout...</div>
    ) : (
      <div
        style={{
          width: ww,
          height: wh,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              padding: grem / 2,
              zIndex: 999,
              background: 'red',
              display: 'none',
            }}
          >
            {transition_status}
          </div>
          {footer_height !== null && header_height !== null ? (
            <div
              style={{
                background: 'white',
                height: wh,
              }}
            >
              <ProjectionSelected
                width={ww}
                height={wh}
                grem={grem}
                strategies={strategies}
                strategy_colors={strategy_colors}
                strategy={strategy}
                dataset={dataset}
                embeddings={embeddings}
                requested_embedding={requested_embedding}
                loaded_embedding={loaded_embedding}
                loading_round={loading_round}
                selectRound={this.props.selectRound}
                mnist_images={mnist_images}
                ranges={ranges}
                transition_status={this.state.transition_status}
                setTransitionStatus={this.setTransitionStatus}
                footer_height={footer_height}
                round={round}
                header_height={header_height}
                round_limit={round_limit}
              />
            </div>
          ) : null}
          {footer_height !== null ? (
            <BigButton
              transition_status={this.state.transition_status}
              grem={grem}
              footer_height={footer_height}
              setTransitionStatus={this.setTransitionStatus}
              round_limit={round_limit}
              round={round}
            />
          ) : null}
          <Header
            datasets={datasets}
            selectDataset={selectDataset}
            strategies={strategies}
            strategy={strategy}
            strategy_colors={strategy_colors}
            selectStrategy={selectStrategy}
            dataset={dataset}
            activeStyle={activeStyle}
            setHeaderHeight={this.setHeaderHeight}
            gradient_string={gradient_string}
            grem={grem}
            transition_status={this.state.transition_status}
          />
          {header_height !== null ? (
            <Footer
              round={round}
              ww={ww}
              grem={grem}
              strategies={strategies}
              strategy_colors={strategy_colors}
              strategy={strategy}
              setFooterHeight={this.setFooterHeight}
              selectRound={this.props.selectRound}
              gradient_string={gradient_string}
              color_array_hexes={color_array_hexes}
              transition_status={this.state.transition_status}
              setTransitionStatus={this.setTransitionStatus}
              simulating_labeling={simulating_labeling}
              strategy_explored={strategy_explored}
              round_limit={round_limit}
              dataset={dataset}
            />
          ) : null}
          {this.state.simulating_labeling ? (
            <div
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                width: '100vw',
                height: '100vh',
                display: 'grid',
                justifyItems: 'center',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: Math.min(500, ww),
                  background: '#666',
                  padding: grem,
                }}
              >
                <div>Getting labels for 1,000 selected points...</div>
                <Timer
                  grem={grem}
                  gradient_string={gradient_string}
                  ww={ww}
                  labelsGotten={this.labelsGotten}
                />
              </div>
            </div>
          ) : null}
        </>
      </div>
    )
  }
}

export default Layout
