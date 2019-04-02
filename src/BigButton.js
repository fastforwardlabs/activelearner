import React, { Component } from 'react'

const capitalize = s => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

class BigButton extends Component {
  render() {
    let {
      transition_status,
      grem,
      round_limit,
      round,
      dataset,
      strategy,
    } = this.props

    let adjusted_round = round
    if (transition_status > 1 && transition_status < 2.3)
      adjusted_round = Math.max(0, adjusted_round - 1)

    let button_text
    let next_state
    if (transition_status === 0) {
      button_text = 'Loading...'
      next_state = null
    } else if (transition_status === 0.5) {
      button_text = 'Selecting points...'
      next_state = null
    } else if (transition_status === 1) {
      button_text = `${
        this.props.dataset === 'Caltech' ? '50' : '1,000'
      } points selected from ${dataset} using ${capitalize(strategy)}`
      if (adjusted_round === round_limit)
        button_text = `Final round of ${dataset} using ${strategy}`
      if (this.props.loading_embedding) button_text = 'Loading...'
      next_state = 1.5
    } else if (transition_status === 1.5) {
      button_text = 'Labeling points...'
      next_state = null
    } else if (transition_status === 2) {
      button_text = 'Retraining model...'
      next_state = null
    } else if (transition_status === 2.3) {
      button_text = 'Retraining model...'
      next_state = null
    } else if (transition_status === 2.6) {
      button_text = 'Selecting points...'
      if (adjusted_round === round_limit)
        button_text = `Final round of ${dataset} using ${strategy}`
      next_state = null
    }

    let inactive = next_state === null || round_limit === adjusted_round

    return (
      <div
        style={{
          position: 'absolute',
          bottom:
            this.props.key_height === null
              ? grem + this.props.footer_height + grem * 1.5
              : this.props.key_height + this.props.footer_height + grem * 1,
          left: 0,
          padding: `0 ${grem / 4}px`,
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', marginBottom: grem / 2 }}>
          <div
            style={{
              padding: `0 ${grem / 4}px`,
              position: 'relative',
            }}
          >
            {button_text}
          </div>
        </div>
        <div style={{ display: 'flex' }}>
          <div
            style={{
              padding: `0 ${grem / 4}px`,
            }}
          >
            <button
              style={{
                pointerEvents: 'auto',
                color: inactive ? '#555' : 'white',
                textDecoration: inactive ? 'none' : 'underline',
                cursor: inactive ? 'default' : 'pointer',
                pointerEvents: inactive ? 'none' : 'auto',
              }}
              onClick={() => {
                if (next_state !== null && round_limit !== adjusted_round) {
                  this.props.toggleList(true)
                }
              }}
            >
              View list
            </button>
          </div>
          <div
            style={{
              padding: `0 ${grem / 4}px`,
            }}
          >
            <button
              className={next_state === null ? 'gray-bg' : 'rainbow-animate'}
              style={{
                width: 120,
                height: grem,
                color: next_state === null ? '#222' : 'black',
                textAlign: 'left',
                cursor: next_state === null ? 'default' : 'pointer',
                textDecoration: next_state === null ? 'none' : 'underline',
                borderRadius: grem / 2,
                textAlign: 'center',
                pointerEvents: 'auto',
              }}
              disabled={next_state === null}
              onClick={() => {
                if (next_state !== null) {
                  if (round_limit === adjusted_round) {
                    this.props.selectRound(0)
                  } else {
                    this.props.setTransitionStatus(next_state)
                  }
                }
              }}
            >
              {round_limit !== adjusted_round ? 'Next round' : 'Restart'}
            </button>
          </div>
          <div
            style={{
              padding: `0 ${grem / 4}px`,
            }}
          >
            <button
              style={{
                pointerEvents: 'auto',
                color: inactive ? '#555' : 'white',
                textDecoration: inactive ? 'none' : 'underline',
                cursor: inactive ? 'default' : 'pointer',
                pointerEvents: inactive ? 'none' : 'auto',
              }}
              onClick={() => {
                if (next_state !== null && round_limit !== adjusted_round) {
                  if (next_state !== null) {
                    this.props.selectRound(round_limit)
                  }
                }
              }}
            >
              Jump to end
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default BigButton
