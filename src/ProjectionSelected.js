import React, { Component } from 'react'
import Projection from './Projection'

class ProjectionSelected extends Component {
  render() {
    let {
      width,
      height,
      grem,
      strategies,
      strategy_colors,
      strategy,
      active_embedding,
      requested_embedding,
      loaded_embedding,
      embeddings,
      mnist_images,
      ranges,
      transition_status,
      setTransitionStatus,
      loading_round,
      header_height,
      footer_height,
      round,
      round_limit,
      dataset,
    } = this.props

    let selected_width = 200
    return (
      <div style={{ position: 'relative' }}>
        <Projection {...this.props} />
      </div>
    )
  }
}

export default ProjectionSelected
