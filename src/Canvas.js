import React, { Component } from 'react'

class Canvas extends Component {
  componentDidMount() {
    this.props.getCtx(this.refs.canvas)
  }

  render() {
    let { grem } = this.props
    return (
      <div style={{ lineHeight: 0, width: this.props.width }}>
        <canvas
          ref="canvas"
          width={this.props.width * 2}
          height={this.props.height * 2}
          style={{
            width: this.props.width,
            height: this.props.height,
            pointerEvents: 'auto',
          }}
        />
      </div>
    )
  }
}

export default Canvas
