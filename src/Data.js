import React, { Component } from 'react'
import Layout from './Layout'
import * as _ from 'lodash'
import * as d3 from 'd3'

let datasets = ['MNIST', 'Quickdraw', 'Caltech']
let strategies = ['random', 'entropy', 'adversarial', 'ensemble']

let mnist_strategy_url = [
  'mnist_random_round',
  'mnist_entropy_round',
  'mnist_adv_round',
  'mnist_ensemble_entropy_round',
]

let quickdraw_strategy_url = [
  'quickdraw_random_round',
  'quickdraw_entropy_round',
  'quickdraw_adv_round',
  'quickdraw_ensemble_entropy_round',
]

let caltech_strategy_url = [
  'caltech_random_round',
  'caltech_entropy_round',
  'caltech_adv_round',
  'caltech_ensemble_entropy_round',
]

let strategy_dict = {
  [datasets[0]]: mnist_strategy_url,
  [datasets[1]]: quickdraw_strategy_url,
  [datasets[2]]: caltech_strategy_url,
}

function es(dataset, strategy, round) {
  return `${dataset}-${strategy}-${round}`
}

let sprite_actual_size = 2048

let sprite_spec_mnist = {
  sprite_side: 73,
  sprite_size: 73 * 73,
  sprite_number: 12,
  sprite_image_size: 28,
}

let sprite_spec_quickdraw = Object.assign({}, sprite_spec_mnist, {
  sprite_number: 13,
})

let sprite_spec_caltech = Object.assign({}, sprite_spec_mnist, {
  sprite_side: 9,
  sprite_size: 9 * 9,
  sprite_number: 11,
  sprite_image_size: 224,
})

let sprite_spec_dict = {
  MNIST: sprite_spec_mnist,
  Quickdraw: sprite_spec_quickdraw,
  Caltech: sprite_spec_caltech,
}

let mnist_tile_string = 'mnist_'
let mnist_tile_locations = [...Array(sprite_spec_mnist.sprite_number)].map(
  (n, i) => `${process.env.PUBLIC_URL}/${mnist_tile_string}${i}.png`
)

let quickdraw_tile_string = 'QUICKDRAW_'
let quickdraw_tile_locations = [
  ...Array(sprite_spec_quickdraw.sprite_number),
].map((n, i) => `${process.env.PUBLIC_URL}/${quickdraw_tile_string}${i}.png`)

let caltech_tile_string = 'CALTECH_'
let caltech_tile_locations = [...Array(sprite_spec_caltech.sprite_number)].map(
  (n, i) => `${process.env.PUBLIC_URL}/${caltech_tile_string}${i}.png`
)

let tile_dict = {
  MNIST: mnist_tile_locations,
  Quickdraw: quickdraw_tile_locations,
  Caltech: caltech_tile_locations,
}

let tile_array = [
  mnist_tile_locations,
  quickdraw_tile_locations,
  caltech_tile_locations,
]

// range key ref: [init_embeddings, selected_embeddings, unselected_embeddings]

class Data extends Component {
  constructor(props) {
    super(props)
    this.state = {
      embeddings: {},
      dataset: datasets[0],
      strategy: strategies[1],
      round: 0,
      requested_embedding: null,
      loaded_embedding: null,
      strategy_explored: [0, 0, 0],
      standings_seen: false,
      loading: false,
      images: [null, null, null],
    }
    this.scaleEmbeddings = this.scaleEmbeddings.bind(this)
    this.fetchData = this.fetchData.bind(this)
    this.checkOrFetchData = this.checkOrFetchData.bind(this)
    this.selectRound = this.selectRound.bind(this)
    this.loadImages = this.loadImages.bind(this)
    this.checkStandings = this.checkStandings.bind(this)
  }

  selectRound(round) {
    let dataset_index = datasets.indexOf(this.state.dataset)
    let new_exploreds = this.state.strategy_explored.slice()
    let strat_limit = Math.max(
      this.state.strategy_explored[dataset_index],
      round
    )
    new_exploreds[dataset_index] = strat_limit
    this.setState({ round: round, strategy_explored: new_exploreds })
    this.checkOrFetchData(this.state.dataset, this.state.strategy, round)
  }

  loadImages(index) {
    if (this.state.images[index] === null) {
      let tile_locations = tile_array[index]
      let images = tile_locations.map(src => {
        let img = document.createElement('img')
        img.src = src
        return img
      })
      // make a copy
      let new_images = this.state.images.slice()
      new_images[index] = images
      this.setState({ images: new_images })
    }
  }

  selectDataset(index) {
    this.setState({
      dataset: datasets[index],
      round: 0,
      standings_seen: false,
    })
    this.checkOrFetchData(datasets[index], this.state.strategy, 0)
    this.loadImages(index)
  }

  selectStrategy(index) {
    this.setState({ strategy: strategies[index] })
    this.checkOrFetchData(
      this.state.dataset,
      strategies[index],
      this.state.round
    )
  }

  checkOrFetchData(dataset, strategy, round) {
    let { embeddings } = this.state
    let string = es(dataset, strategy, round)
    this.setState({ requested_embedding: string })
    if (embeddings[string] !== undefined) {
      this.setState({ loaded_embedding: string })
    } else {
      this.fetchData(dataset, strategy, round)
    }
  }

  scaleEmbeddings(embeddings) {
    let xs = embeddings.map(e => Math.abs(e[0]))
    let ys = embeddings.map(e => Math.abs(e[1]))
    let max_x = _.max(xs)
    let max_y = _.max(ys)
    let max = Math.max(max_x, max_y)
    let scale = d3
      .scaleLinear()
      .domain([-max, max])
      .range([-20, 20])
    let scaled_embeddings = embeddings.map(e => [scale(e[0]), scale(e[1])])
    return scaled_embeddings
  }

  checkStandings() {
    this.setState({ standings_seen: true })
  }

  fetchData(dataset, strategy, round) {
    let url = `${process.env.PUBLIC_URL}/${
      strategy_dict[dataset][strategies.indexOf(strategy)]
    }${round}.json`
    fetch(url)
      .then(response => response.json())
      .then(r => {
        // calculate embedding scale for all
        let coordinates = r.coordinates
        let xs = coordinates.map(e => Math.abs(e[0]))
        let ys = coordinates.map(e => Math.abs(e[1]))
        let max_x = _.max(xs)
        let max_y = _.max(ys)
        let max = Math.max(max_x, max_y)
        let scale = d3
          .scaleLinear()
          .domain([-max, max])
          .range([-20, 20])
        let scaled = coordinates.map(e => [scale(e[0]), scale(e[1])])
        let object = {}
        object.coordinates = scaled
        object.statuses = r.status
        object.labels = r.labels
        let embedding_string = es(dataset, strategy, round)
        this.setState({
          loaded_embedding: embedding_string,
          embeddings: Object.assign({}, this.state.embeddings, {
            [embedding_string]: object,
          }),
        })
      })

    // let array_size = 60000
    // let fake_object = {}
    // fake_object.ranges = {
    //   init_embeddings: [0, 10000],
    //   selected_embeddings: [10000, 11000],
    //   unselected_embeddings: [11000, 60000],
    // }
    // let fake = [...Array(array_size)].map(n => [
    //   Math.random() * 40 - 20,
    //   Math.random() * 40 - 20,
    // ])
    // let embeddings = fake
    // let xs = embeddings.map(e => Math.abs(e[0]))
    // let ys = embeddings.map(e => Math.abs(e[1]))
    // let max_x = _.max(xs)
    // let max_y = _.max(ys)
    // let max = Math.max(max_x, max_y)
    // let scale = d3
    //   .scaleLinear()
    //   .domain([-max, max])
    //   .range([-20, 20])
    // let scaled = embeddings.map(e => [scale(e[0]), scale(e[1])])
    // fake_object.coordinates = scaled

    // let labelled = [...Array(10000)].map(n => 1)
    // let selected = [...Array(1000)].map(n => 2)
    // let unlabelled = [
    //   ...Array(array_size - labelled.length - selected.length),
    // ].map(n => 0)

    // let statuses = _.shuffle([...labelled, ...selected, ...unlabelled])
    // fake_object.statuses = statuses

    // let embedding_string = es(dataset, strategy, round)

    // this.setState({
    //   loaded_embedding: embedding_string,
    //   embeddings: Object.assign({}, this.state.embeddings, {
    //     [embedding_string]: fake_object,
    //   }),
    // })
  }

  componentDidMount() {
    let { dataset, strategy, round } = this.state
    this.checkOrFetchData(dataset, strategy, round)
  }

  render() {
    let dataset_index = datasets.indexOf(this.state.dataset)
    let altered_state = Object.assign({}, this.state, {
      strategy_explored: this.state.strategy_explored[dataset_index],
    })
    return (
      <Layout
        {...altered_state}
        datasets={datasets}
        strategies={strategies}
        selectDataset={this.selectDataset.bind(this)}
        selectStrategy={this.selectStrategy.bind(this)}
        selectRound={this.selectRound.bind(this)}
        loadImages={this.loadImages.bind(this)}
        checkStandings={this.checkStandings}
      />
    )
  }
}

export default Data
