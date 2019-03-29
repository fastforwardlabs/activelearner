import React, { Component } from 'react'
import { comma, drawLine, toPercent2 } from './Utils'
import { mnist_strategies } from './mnist_strategies.js'
import { quickdraw_strategies } from './quickdraw_strategies.js'
import { caltech_strategies } from './caltech_strategies.js'
import Canvas from './Canvas'
import * as chroma from 'chroma-js'
import * as _ from 'lodash'

let strategy_dict = {
  MNIST: mnist_strategies,
  Quickdraw: quickdraw_strategies,
  Caltech: caltech_strategies,
}

let total_dict = {
  MNIST: 60000,
  Quickdraw: 65729,
  Caltech: 822,
}

let placeholder_arrays = [...Array(4)].map(n =>
  [...Array(5)].map(n => Math.random())
)

let point_size = 4
let y_padding = point_size * 2

class Accuracy extends Component {
  constructor(props) {
    super(props)
    this.ctx = null
    this.getCtx = this.getCtx.bind(this)
    this.draw = this.draw.bind(this)
    this.handleRound = this.handleRound.bind(this)
  }

  getCtx(canvas) {
    this.ctx = canvas.getContext('2d')
  }

  componentDidMount() {
    this.ctx.scale(2, 2)
    this.draw()
  }

  componentDidUpdate(prevProps) {
    if (this.props.strategy_explored !== prevProps.strategy_explored) {
      this.ctx.scale(2, 2)
    }
    this.draw()
  }

  handleRound(new_round) {
    if (new_round !== this.props.round) {
      this.props.selectRound(new_round)
    }
  }

  draw() {
    let {
      width,
      height,
      strategies,
      strategy_colors,
      round,
      strategy,
      grem,
      transition_status,
      strategy_explored,
      dataset,
    } = this.props

    let strategy_accuracy = strategy_dict[dataset]
    let results = strategy_accuracy[strategy]

    height = height - grem * 2
    if (transition_status === 3) round = round + 1
    let ctx = this.ctx
    let point_size = 4
    // let x_padding = point_size
    let cell_num = 8
    let cell_width = 100
    let x_padding = cell_width / 2

    let all_strat_results = strategies.map(s =>
      _.min(strategy_accuracy[s].accuracy)
    )

    let rounded_min = Math.floor(_.min(all_strat_results) * 10) / 10

    let rounds_limit = strategy_explored

    let space = 1 - rounded_min
    let interval = 0.05

    ctx.clearRect(0, 0, cell_width * (strategy_explored + 1), height)

    let y_padding = point_size * 2
    height = height - y_padding * 2

    ctx.fillStyle = 'rgba(100,100,100,0.3)'
    ctx.fillRect(round * cell_width, y_padding, cell_width, height)

    ctx.lineWidth = 3
    ctx.strokeStyle = 'rgba(100,100,100,0.5)'
    for (let i = 0; i < space + interval; i = i + interval) {
      ctx.beginPath()
      let y = (i / space) * height
      drawLine(ctx, 0, y + y_padding, true)
      drawLine(ctx, cell_width * (strategy_explored + 1), y + y_padding, false)
      ctx.stroke()
    }

    let non_active_strats = strategies.filter(s => s !== strategy)

    for (let strat of non_active_strats) {
      let these_results = strategy_accuracy[strat]

      ctx.lineWidth = 2
      ctx.strokeStyle = '#666'
      ctx.fillStyle = '#666'
      ctx.beginPath()
      for (let i = 0; i < strategy_explored + 1; i++) {
        let accuracy =
          (these_results.accuracy[i] - rounded_min) / (1 - rounded_min)
        drawLine(
          ctx,
          i * cell_width + x_padding,
          height - accuracy * height + y_padding,
          i === 0
        )
      }
      ctx.stroke()
      for (let i = 0; i < strategy_explored + 1; i++) {
        let accuracy =
          (these_results.accuracy[i] - rounded_min) / (1 - rounded_min)
        ctx.beginPath()
        ctx.arc(
          i * cell_width + x_padding,
          height - accuracy * height + y_padding,
          point_size,
          0,
          2 * Math.PI
        )
        ctx.fill()
      }
    }

    point_size = 6

    ctx.lineWidth = 2
    ctx.strokeStyle = '#efefef'
    ctx.fillStyle = '#efefef'
    ctx.beginPath()
    for (let i = 0; i < strategy_explored + 1; i++) {
      let accuracy = (results.accuracy[i] - rounded_min) / (1 - rounded_min)
      drawLine(
        ctx,
        i * cell_width + x_padding,
        height - accuracy * height + y_padding,
        i === 0
      )
    }
    ctx.stroke()
    for (let i = 0; i < strategy_explored + 1; i++) {
      let accuracy = (results.accuracy[i] - rounded_min) / (1 - rounded_min)
      ctx.beginPath()
      ctx.arc(
        i * cell_width + x_padding,
        height - accuracy * height + y_padding,
        point_size,
        0,
        2 * Math.PI
      )
      ctx.fill()
    }
  }

  render() {
    let {
      width,
      height,
      grem,
      strategies,
      strategy,
      round,
      transition_status,
      adjusted_round,
      strategy_explored,
      round_limit,
      dataset,
    } = this.props

    let num_labeled = strategy_dict[dataset].num_labeled
    let results = strategy_dict[dataset][strategy]

    let label_round = round
    let cell_width = 100
    if (transition_status > 1) label_round = round + 1
    return (
      <div style={{}}>
        <div style={{ display: 'inline-flex', pointerEvents: 'auto' }}>
          <div style={{ padding: `0 ${grem / 4}px` }}>
            <div style={{ padding: `0 ${grem / 4}px` }}>
              {true ? (
                <span>
                  Round {round + 1} of {round_limit + 1}
                </span>
              ) : (
                ' '
              )}{' '}
            </div>
          </div>
          <div style={{ padding: `0 ${grem / 4}px` }}>
            <div style={{ padding: `0 ${grem / 4}px` }}>
              Accuracy: {toPercent2(results.accuracy[round])}
            </div>
          </div>
        </div>
        <div
          style={{
            position: 'relative',
            width: cell_width * (strategy_explored + 1),
            height: height - grem * 2,
            pointerEvents: 'auto',
          }}
        >
          <Canvas
            width={cell_width * (strategy_explored + 1)}
            height={height - grem * 2}
            getCtx={this.getCtx}
            grem={grem}
          />
          <>
            {[...Array(strategy_explored + 1)].map((n, i) => (
              <div
                key={'explored' + i}
                onClick={() => {
                  this.handleRound(i)
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: cell_width * i,
                  width: cell_width,
                  height: height - grem * 2,
                  cursor: i === round ? 'default' : 'pointer',
                }}
              />
            ))}
            <div
              style={{
                position: 'absolute',
                top: y_padding,
                left: cell_width * (strategy_explored + 1),
                width: (round_limit - strategy_explored) * cell_width,
                height: height - grem * 2 - y_padding * 2,
                border: 'solid 2px rgba(100,100,100,0.2)',
                pointerEvents: 'auto',
                borderLeft: 'none',
                pointerEvents: 'none',
              }}
            />
          </>
        </div>
        <div
          style={{
            display: 'flex',
            pointerEvents: 'auto',
            justifyContent: 'space-between',
            padding: `0 ${grem / 4}px`,
          }}
        >
          <div style={{ padding: `0 ${grem / 4}px` }}>
            {comma(total_dict[this.props.dataset])} points,{' '}
            {comma(num_labeled[label_round])} labelled (
            {toPercent2(
              num_labeled[label_round] / total_dict[this.props.dataset]
            )}
            )
          </div>
        </div>
      </div>
    )
  }
}

export default Accuracy
