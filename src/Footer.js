import React, { Component } from 'react'
import Accuracy from './Accuracy'

let color_seed = Math.floor(Math.random() * 10)

class Footer extends Component {
  constructor(props) {
    super(props)
    this.state = {}
    this.setHeight = this.setHeight.bind(this)
  }

  setHeight() {
    let height = this.divElement.clientHeight
    this.props.setFooterHeight(height)
  }

  componentDidMount() {
    this.setHeight()
  }

  render() {
    let {
      round,
      ww,
      grem,
      strategies,
      strategy_colors,
      strategy,
      selectRound,
      color_array_hexes,
      transition_status,
      simulating_labeling,
      gradient_string,
      strategy_explored,
      round_limit,
      dataset,
    } = this.props

    let adjusted_round = round
    let adjusted_explored = strategy_explored
    if (transition_status > 1 && transition_status < 2.3) {
      adjusted_round = Math.max(0, adjusted_round - 1)
      adjusted_explored = Math.max(0, adjusted_explored - 1)
    }

    return (
      <div
        ref={divElement => {
          this.divElement = divElement
        }}
        style={{
          position: 'absolute',
          bottom: grem * 2,
          left: 0,
          height: 7 * grem,
          pointerEvents: 'none',
        }}
      >
        <Accuracy
          width={ww}
          transition_status={transition_status}
          height={7 * grem}
          grem={grem}
          strategies={strategies}
          selectRound={this.props.selectRound}
          dataset={dataset}
          strategy_colors={strategy_colors}
          strategy={strategy}
          round={adjusted_round}
          strategy_explored={adjusted_explored}
          round_limit={round_limit}
        />
      </div>
    )
  }
}

export default Footer
