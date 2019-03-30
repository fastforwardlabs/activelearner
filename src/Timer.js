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
            position: 'absolute',
            height: '100%',
            width: '100%',
            left: 0,
            top: 0,
            background: '#ddd',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${(this.state.count / 1000) * 100}%`,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: '100%',
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
