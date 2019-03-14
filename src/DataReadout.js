import React, { Component } from 'react'
import { comma, toPercent2, rangeDiff, activeStyle } from './Utils'

class DataReadout extends Component {
  render() {
    let { requested_embedding, loaded_embedding, embeddings } = this.props
    let rl =
      loaded_embedding !== null && requested_embedding === loaded_embedding
    let loaded = embeddings[loaded_embedding]

    return (
      <div>
        Data:{' '}
        {rl
          ? `${comma(loaded.coordinates.length)} images; ${comma(
              rangeDiff(loaded.ranges['init_embeddings'])
            )} labeled (${toPercent2(
              rangeDiff(loaded.ranges['init_embeddings']) /
                loaded.coordinates.length
            )})`
          : 'loading...'}
      </div>
    )
  }
}

export default DataReadout
