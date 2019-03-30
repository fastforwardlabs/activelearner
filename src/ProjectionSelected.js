import React, { Component } from 'react'
import Projection from './Projection'
import Selected from './Selected'

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
        />
        {false ? (
          <Selected
            width={selected_width}
            height={
              height - this.props.footer_height - grem * 2 - header_height
            }
            grem={grem}
            mnist_images={mnist_images}
            embeddings={embeddings}
            loaded_embedding={loaded_embedding}
            ranges={ranges}
            transition_status={transition_status}
            header_height={header_height}
            round={round}
            round_limit={round_limit}
            dataset={dataset}
          />
        ) : null}
      </div>
    )
  }
}

export default ProjectionSelected
