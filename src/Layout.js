import React, { Component } from 'react'
import Header from './Header'
import Footer from './Footer'
import { activeStyle } from './Utils'
import ProjectionSelected from './ProjectionSelected'
import BigButton from './BigButton'
import Timer from './Timer'
import * as chroma from 'chroma-js'
import { debounce } from 'lodash'
import SelectedList from './SelectedList'
import Modal from './Modal'

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
// let mnist_images = mnist_tile_locations.map(src => {
//   let img = document.createElement('img')
//   img.src = src
//   return img
// })

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
      show_list: false,
      show_modal: true,
      key_height: null,
    }
    this.setSize = this.setSize.bind(this)
    this.setSize = debounce(this.setSize, 200)
    this.setHeaderHeight = this.setHeaderHeight.bind(this)
    this.setFooterHeight = this.setFooterHeight.bind(this)
    this.setTransitionStatus = this.setTransitionStatus.bind(this)
    this.labelsGotten = this.labelsGotten.bind(this)
    this.toggleList = this.toggleList.bind(this)
    this.toggleModal = this.toggleModal.bind(this)
    this.setKeyHeight = this.setKeyHeight.bind(this)
  }

  setKeyHeight(height) {
    this.setState({ key_height: height })
  }

  setHeaderHeight(height) {
    this.setState({ header_height: height })
  }

  setFooterHeight(height) {
    this.setState({ footer_height: height })
  }

  toggleList(new_value) {
    this.setState({ show_list: new_value })
  }

  toggleModal(new_value) {
    this.setState({ show_modal: new_value })
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
      show_list,
      show_modal,
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
      toggleList,
    } = this.props

    let font_size = 14
    let line_height = 1.5
    let grem = font_size * line_height

    let round_limit = 7

    let loading_embedding = requested_embedding !== loaded_embedding

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
                ranges={ranges}
                transition_status={this.state.transition_status}
                setTransitionStatus={this.setTransitionStatus}
                footer_height={footer_height}
                round={round}
                header_height={header_height}
                round_limit={round_limit}
                loadImages={this.props.loadImages}
                images={this.props.images}
                setKeyHeight={this.setKeyHeight}
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
              dataset={dataset}
              toggleList={this.toggleList}
              selectRound={this.props.selectRound}
              dataset={dataset}
              strategy={strategy}
              loading_embedding={loading_embedding}
              key_height={this.state.key_height}
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
            setTransitionStatus={this.setTransitionStatus}
            toggleModal={this.toggleModal}
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
              key_height={this.state.key_height}
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
                color: 'black',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: Math.min(500, ww),
                  background: 'white',
                  color: 'black',
                  padding: grem,
                  background: '#888',
                }}
              >
                <div style={{ marginBottom: grem / 2 }}>Round {round + 1}</div>
                <div style={{ position: 'relative', height: grem }}>
                  <Timer
                    grem={grem}
                    gradient_string={gradient_string}
                    ww={ww}
                    labelsGotten={this.labelsGotten}
                  />
                </div>
                <div
                  style={{
                    position: 'relative',
                    paddingTop: grem / 2,
                  }}
                >
                  Getting labels for selected points...
                </div>
              </div>
            </div>
          ) : null}
          {show_list ? (
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
                color: 'black',
                background: 'rgba(0, 0, 0, 0.4)',
              }}
              onClick={() => {
                this.toggleList(false)
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: ww - grem * 3,
                  color: 'black',
                }}
                onClick={e => {
                  e.stopPropagation()
                }}
              >
                <SelectedList
                  grem={grem}
                  dataset={dataset}
                  strategy={strategy}
                  embeddings={embeddings}
                  loaded_embedding={loaded_embedding}
                  wh={wh}
                  ww={ww - grem * 3}
                  toggleList={this.toggleList}
                />
              </div>
            </div>
          ) : null}
          {show_modal ? (
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
                color: 'black',
                background: 'rgba(60, 60, 60, 0.4)',
                overflow: 'auto',
                paddingTop: wh < 800 ? wh / 4 : grem * 2.5,
                paddingBottom: wh / 4,
              }}
              onClick={() => {
                this.toggleModal(false)
              }}
            >
              <div
                style={{
                  position: 'relative',
                  maxWidth: 600,
                  width: '100%',
                  color: 'black',
                }}
                onClick={e => {
                  e.stopPropagation()
                }}
              >
                <Modal
                  grem={grem}
                  toggleModal={this.toggleModal}
                  gradient_string={gradient_string}
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
