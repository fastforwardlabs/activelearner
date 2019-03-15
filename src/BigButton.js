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
      button_text = 'Selecting...'
      next_state = null
    } else if (transition_status === 1) {
      button_text = 'Label & train'
      next_state = 1.5
    } else if (transition_status === 1.5) {
      button_text = 'Labeling...'
      next_state = null
    } else if (transition_status === 2) {
      button_text = 'Training...'
      next_state = null
    } else if (transition_status === 2.3) {
      button_text = 'Training...'
      next_state = null
    } else if (transition_status === 2.6) {
      button_text = 'Deselecting...'
      next_state = null
    }

    let adjusted_round = round
    if (transition_status > 1 && transition_status < 2.3)
      adjusted_round = Math.max(0, adjusted_round - 1)

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          background: '#111',
          position: 'absolute',
          bottom: this.props.footer_height,
          right: 0,
        }}
      >
        <div>
          {round_limit !== adjusted_round ? (
            <button
              style={{
                width: 200,
                height: 2 * grem,
                background: next_state === null ? '#eee' : 'white',
                color: 'black',
                textAlign: 'left',
                paddingLeft: grem / 2,
                cursor: next_state === null ? 'default' : 'pointer',
                textDecoration: next_state === null ? 'none' : 'underline',
              }}
              disabled={next_state === null}
              onClick={() => {
                if (next_state !== null) {
                  this.props.setTransitionStatus(next_state)
                }
              }}
            >
              {button_text}
            </button>
          ) : null}
        </div>
      </div>
    )
  }
}

export default BigButton
