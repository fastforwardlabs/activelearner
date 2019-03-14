import React, { Component } from 'react'

class Timer extends Component {
  constructor(props) {
    super(props)
    this.state = {
      count: 0,
    }
  }

  componentDidMount() {
    let counter = 0
    let count = 0
    let me = this
    function repeatOften() {
      counter += 25
      let count_check = Math.floor(counter)
      if (count_check !== count) {
        count = count_check
      }
      me.setState({ count: count })
      if (count < 1000) {
        requestAnimationFrame(repeatOften)
      } else {
        setTimeout(() => {
          me.props.labelsGotten()
        }, 200)
      }
    }
    setTimeout(() => requestAnimationFrame(repeatOften), 200)
  }

  render() {
    let { grem, ww } = this.props
    return (
      <div>
        <div
          style={{
            height: grem,
            width: `${100}%`,
            marginTop: grem / 2,
            background: '#222',
          }}
        >
          <div
            style={{
              height: grem,
              width: `${(this.state.count / 1000) * 100}%`,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: grem,
                width: Math.min(500, ww) - grem * 2,
                background: `linear-gradient(to right, ${
                  this.props.gradient_string
                })`,
              }}
            />
          </div>
        </div>
      </div>
    )
  }
}

export default Timer
