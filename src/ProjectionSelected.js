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
        <Projection
          width={width}
          height={height}
          grem={grem}
          active_embedding={active_embedding}
          strategies={strategies}
          strategy_colors={strategy_colors}
          strategy={strategy}
          embeddings={embeddings}
          requested_embedding={requested_embedding}
          loaded_embedding={loaded_embedding}
          transition_status={transition_status}
          setTransitionStatus={setTransitionStatus}
          loading_round={loading_round}
          footer_height={footer_height}
          selectRound={this.props.selectRound}
          round={round}
          round_limit={round_limit}
          dataset={dataset}
          loadImages={this.props.loadImages}
          images={this.props.images}
          setKeyHeight={this.props.setKeyHeight}
          toggleEnd={this.props.toggleEnd}
        />
      </div>
    )
  }
}

export default ProjectionSelected
