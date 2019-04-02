import React, { Component } from 'react'
import { mnist_strategies } from './mnist_strategies.js'
import { quickdraw_strategies } from './quickdraw_strategies.js'
import { caltech_strategies } from './caltech_strategies.js'
import { toPercent2, comma } from './Utils.js'
import { sortBy } from 'lodash'

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

class End extends Component {
  render() {
    let { grem, strategy, strategies, dataset } = this.props

    let num_labeled = strategy_dict[dataset].num_labeled
    let strategy_accuracy = strategy_dict[dataset]
    let results = strategy_accuracy[strategy]
    let end = 7

    let race = strategies.map((s, j) => {
      return {
        string: `${s}: ${toPercent2(strategy_accuracy[s].accuracy[end])}`,
        strategy: s,
        value: strategy_accuracy[s].accuracy[end],
        diff:
          strategy_accuracy[s].accuracy[end] - strategy_accuracy[s].accuracy[0],
      }
    })
    race = sortBy(race, 'value').reverse()

    return (
      <div style={{}}>
        <div
          style={{
            padding: grem / 2,
            color: 'black',
            position: 'relative',
            background: 'white',
          }}
        >
          Final round
          <button
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              padding: grem / 2,
              color: 'black',
            }}
            onClick={() => {
              this.props.toggleEnd(false)
            }}
          >
            &times;
          </button>
        </div>
        <div style={{ padding: grem / 2, background: '#ccc' }}>
          <p style={{ marginBottom: grem / 2 }}>
            After eight rounds of labeling using points selected by the{' '}
            {strategy} strategy ({comma(num_labeled[end] - num_labeled[0])}{' '}
            additional points), the {dataset} classifier's accuracy is{' '}
            {toPercent2(results.accuracy[end])}, an improvement of{' '}
            {toPercent2(results.accuracy[end] - results.accuracy[0])} over the
            first round.
          </p>
          <p>Strategies ranked by accuracy improvement:</p>
          <div style={{ marginBottom: grem / 2 }}>
            {race.map((o, i) => (
              <div
                key={o.strategy}
                style={{
                  textTransform: 'capitalize',
                  background: strategy === o.strategy ? 'black' : 'transparent',
                  color: strategy === o.strategy ? '#fff' : 'black',
                  display: 'flex',
                  marginBottom: grem / 8,
                }}
              >
                <div style={{ marginRight: grem / 4 }}>
                  {i + 1}. {o.strategy}:
                </div>
                <div style={{ textAlign: 'right', flexGrow: 1 }}>
                  {(o.value * 100).toFixed(2)}% (
                  {Math.sign(o.diff) === 1 ? '+' : ''}
                  {(o.diff * 100).toFixed(2)}%)
                </div>
              </div>
            ))}
          </div>
          <p style={{ marginBottom: grem / 2 }}>
            The classifier is trained on {comma(num_labeled[end])} labeled
            points;{' '}
            {toPercent2(num_labeled[end] / total_dict[this.props.dataset])} of
            the {comma(total_dict[this.props.dataset])} image dataset.
          </p>
          <p>
            <button
              style={{ color: 'inherit' }}
              onClick={() => {
                this.props.toggleEnd(false)
              }}
            >
              Continue exploring
            </button>
          </p>
        </div>
      </div>
    )
  }
}

export default End
