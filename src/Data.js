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

function es(dataset, strategy, round) {
  return `${dataset}-${strategy}-${round}`
}

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
      strategy_explored: 0,
    }
    this.scaleEmbeddings = this.scaleEmbeddings.bind(this)
    this.fetchData = this.fetchData.bind(this)
    this.checkOrFetchData = this.checkOrFetchData.bind(this)
    this.selectRound = this.selectRound.bind(this)
  }

  selectRound(round) {
    let strat_limit = Math.max(this.state.strategy_explored, round)
    this.setState({ round: round, strategy_explored: strat_limit })
    this.checkOrFetchData(this.state.dataset, this.state.strategy, round)
  }

  selectDataset(index) {
    this.setState({ dataset: datasets[index], strategy_explored: 0 })
    this.checkOrFetchData(
      datasets[index],
      this.state.strategy,
      this.state.round
    )
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

  fetchData(dataset, strategy, round) {
    let url = `${process.env.PUBLIC_URL}/${
      mnist_strategy_url[strategies.indexOf(strategy)]
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
    return (
      <Layout
        {...this.state}
        datasets={datasets}
        strategies={strategies}
        selectDataset={this.selectDataset.bind(this)}
        selectStrategy={this.selectStrategy.bind(this)}
        selectRound={this.selectRound.bind(this)}
      />
    )
  }
}

export default Data
