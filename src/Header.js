import React, { Component } from 'react'
import * as chroma from 'chroma-js'
const capitalize = s => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

class Header extends Component {
  constructor(props) {
    super(props)
    this.state = {}
    this.setHeight = this.setHeight.bind(this)
  }

  setHeight() {
    let height = this.divElement.clientHeight
    this.props.setHeaderHeight(height)
  }

  componentDidMount() {
    this.setHeight()
  }

  render() {
    let {
      datasets,
      selectDataset,
      strategies,
      strategy,
      strategy_colors,
      selectStrategy,
      dataset,
      activeStyle,
      grem,
    } = this.props

    let background = 'transparent'
    // background = '#444'

    return (
      <div
        ref={divElement => {
          this.divElement = divElement
        }}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          display: 'flex',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            background: background,
            display: 'flex',
            flexWrap: 'wrap',
            padding: `0 ${grem / 4}px 0 ${grem / 2}px`,
            pointerEvents: 'all',
          }}
        >
          <div
            style={{
              padding: `0 ${grem / 4}px`,
              fontWeight: 'bold',
            }}
          >
            Active Learner
          </div>
        </div>
        <div
          style={{
            background: background,
            display: 'flex',
            flexWrap: 'wrap',
            padding: `0 ${grem / 4}px`,
            pointerEvents: 'all',
          }}
        >
          <div style={{ padding: `0 ${grem / 4}px` }}>Dataset:</div>
          {datasets
            .map((n, i) => {
              let active = n === dataset
              let inner
              active
                ? (inner = <span>{n}</span>)
                : (inner = (
                    <button
                      onClick={() => {
                        selectDataset(i)
                      }}
                    >
                      {n}
                    </button>
                  ))
              return (
                <span
                  key={n}
                  style={{
                    padding: `0 ${grem / 4}px`,
                    background: active ? 'white' : 'transparent',
                    color: active ? 'black' : 'white',
                  }}
                >
                  {inner}
                </span>
              )
            })
            .reduce((p, c) => [p, ' ', c])}
        </div>
        <div
          style={{
            background: background,
            display: 'flex',
            flexWrap: 'wrap',
            padding: `0 ${grem / 4}px`,
            pointerEvents: 'all',
          }}
        >
          <div style={{ padding: `0 ${grem / 4}px` }}>Strategy:</div>
          {strategies
            .map((n, i) => {
              let active = n === strategy
              let inner
              active
                ? (inner = <span>{capitalize(n)}</span>)
                : (inner = (
                    <button
                      onClick={() => {
                        selectStrategy(i)
                      }}
                    >
                      {capitalize(n)}
                    </button>
                  ))
              return (
                <span
                  key={n}
                  style={{
                    padding: `0 ${grem / 4}px`,
                    background: active ? 'white' : 'transparent',
                    color: active ? 'black' : 'white',
                  }}
                >
                  {inner}
                </span>
              )
            })
            .reduce((p, c) => [p, ' ', c])}
        </div>
      </div>
    )
  }
}

export default Header
