import React, { Component } from 'react'

class BigButton extends Component {
  render() {
    let { transition_status, grem, round_limit, round } = this.props

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
      } points selected`

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
      next_state = null
    }

    let adjusted_round = round
    if (transition_status > 1 && transition_status < 2.3)
      adjusted_round = Math.max(0, adjusted_round - 1)

    return (
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          bottom: this.props.footer_height + grem * 2.5,
          left: 0,
          padding: `0 ${grem / 4}px`,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            padding: `0 ${grem / 4}px`,
            position: 'relative',
          }}
        >
          {button_text}
        </div>
        <div
          style={{
            padding: `0 ${grem / 4}px`,
            display: next_state === null ? 'none' : 'block',
          }}
        >
          <button
            style={{
              pointerEvents: 'auto',
            }}
            onClick={() => {
              this.props.toggleList(true)
            }}
          >
            view list
          </button>
        </div>
        <div
          style={{
            padding: `0 ${grem / 4}px`,
          }}
        >
          {round_limit !== adjusted_round ? (
            <button
              style={{
                width: 140,
                height: grem,
                background: next_state === null ? '#444' : 'white',
                color: next_state === null ? 'white' : 'black',
                textAlign: 'left',
                cursor: next_state === null ? 'default' : 'pointer',
                textDecoration: next_state === null ? 'none' : 'underline',
                borderRadius: grem / 2,
                textAlign: 'center',
                pointerEvents: 'auto',
                display: next_state === null ? 'none' : 'block',
              }}
              disabled={next_state === null}
              onClick={() => {
                if (next_state !== null) {
                  this.props.setTransitionStatus(next_state)
                }
              }}
            >
              Label & train
            </button>
          ) : null}
        </div>
      </div>
    )
  }
}

export default BigButton
