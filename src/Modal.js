import React, { Component } from 'react'

class Modal extends Component {
  render() {
    let { grem } = this.props
    return (
      <div style={{}}>
        <div
          style={{
            padding: grem / 2,
            color: 'black',
            position: 'relative',
            background: 'white',
          }}
        >
          About Active Learner
          <button
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              padding: grem / 2,
              color: 'black',
            }}
            onClick={() => {
              this.props.toggleModal(false)
            }}
          >
            &times;
          </button>
        </div>
        <div style={{ padding: grem / 2, background: '#ccc' }}>
          <p style={{ fontStyle: 'italic' }}>
            Active Learner is a research prototype by{' '}
            <a href="http://fastforwardlabs.com">Cloudera Fast Forward Labs</a>,{' '}
            built to accompany our report on Learning with Limited Labeled Data.
            For more about the report{' '}
            <a href="https://blog.fastforwardlabs.com/2019/04/02/a-guide-to-learning-with-limited-labeled-data.html">
              read our blog post
            </a>
            .
          </p>
          <p style={{ textIndent: grem }}>
            Supervised machine learning, while powerful, needs labeled data to
            be effective. Active learning{' '}
            <span
              style={{
                color: 'black',
                background: `linear-gradient(to right, ${
                  this.props.gradient_string
                })`,
              }}
            >
              reduces the number of labeled examples needed to train a model
            </span>
            , saving time and money while obtaining comparable performance to
            models trained with much more data.
          </p>
          <p style={{ textIndent: grem }}>
            In Active Learner, we visualize the selections of{' '}
            <span
              style={{
                background: '#111',
                color: 'white',
              }}
            >
              four different training strategies
            </span>{' '}
            on{' '}
            <span
              style={{
                background: '#111',
                color: 'white',
              }}
            >
              three different datasets
            </span>
            . We use a dimensionality reduction technique called{' '}
            <a href="https://umap-learn.readthedocs.io/en/latest/">UMAP</a> to
            visualize how the model is clustering the dataset.{' '}
            <span
              style={{
                background: 'white',
                color: 'black',
              }}
            >
              We highlight the points that the strategy has selected to be
              labeled in the next round.
            </span>{' '}
            Clicking on the{' '}
            <span className="rainbow-animate">Next&nbsp;round</span> button
            retrieves the labels for those selections and retrains the model,
            showing how the clusters shift.{' '}
            <span style={{ background: '#666', color: '#fff' }}>
              The graph at the bottom shows the changes in accuracy for
              different rounds.
            </span>{' '}
            You can use the graph to compare the effectiveness of the different
            strategies.
          </p>
          <p style={{ textIndent: grem }}>
            <button
              style={{
                color: 'black',
              }}
              onClick={() => {
                this.props.toggleModal(false)
              }}
            >
              Start exploring now
            </button>{' '}
            or learn more about strategies and datasets below.
          </p>
          <div
            style={{
              width: '100%',
              height: 1,
              background: `linear-gradient(to right, ${
                this.props.gradient_string
              })`,
              marginTop: grem / 2 - 0.5,
              marginBottom: grem / 2 - 0.5,
              background: '#aaa',
            }}
          />
          <p style={{}}>Strategy and dataset info</p>
          <p style={{ marginBottom: grem / 2, textIndent: grem }}>
            Active learning strategies focus on points that the model is
            especially uncertain about. You can see this focus in the
            visualization when the{' '}
            <span style={{ background: 'white' }}>
              selected points are at the boundaries of clusters
            </span>
            . You can compare the different active learning strategies (
            <span style={{ background: 'black', color: 'white' }}>Entropy</span>
            ,{' '}
            <span style={{ background: 'black', color: 'white' }}>
              Adversarial
            </span>
            ,{' '}
            <span style={{ background: 'black', color: 'white' }}>
              Ensemble
            </span>
            ) with the{' '}
            <span style={{ background: 'black', color: 'white' }}>Random</span>{' '}
            strategy to get a feel for how active learning works.
          </p>
          <p>About the strategies</p>
          <p style={{ textIndent: grem }}>
            <span style={{ background: 'black', color: 'white' }}>Random</span>:{' '}
            <span style={{ background: 'white' }}>
              points are selected randomly
            </span>
            .
          </p>
          <p style={{ textIndent: grem }}>
            <span style={{ background: 'black', color: 'white' }}>Entropy</span>
            :{' '}
            <span style={{ background: 'white' }}>
              points with high entropy are selected
            </span>
            . The outcome of an uncertain event carries a higher entropy
            compared to an event with no uncertainty.
          </p>
          <p style={{ textIndent: grem }}>
            <span style={{ background: 'black', color: 'white' }}>
              Adversarial
            </span>
            :{' '}
            <span style={{ background: 'white' }}>
              points with small adversarial perturbation magnitudes are selected
            </span>
            . A perturbation causes a particular datapoint to be classified as a
            different category.
          </p>
          <p style={{ textIndent: grem, marginBottom: grem / 2 }}>
            <span style={{ background: 'black', color: 'white' }}>
              Ensemble
            </span>
            :{' '}
            <span style={{ background: 'white' }}>
              points are selected using the averaged prediction probabilities
              across an ensemble of models
            </span>
            .
          </p>

          <p>About the datasets</p>
          <p style={{ textIndent: grem }}>
            <span style={{ background: 'black', color: 'white' }}>MNIST</span>:
            The <a href="http://yann.lecun.com/exdb/mnist/">MNIST dataset</a>{' '}
            consists of handwritten digits from 0 to 9. It has a training set of
            60,000 examples, and a test set of 10,000 examples. We use 5,000
            labels to start and add 1,000 more labels each round.
          </p>
          <p style={{ textIndent: grem }}>
            <span style={{ background: 'black', color: 'white' }}>
              Quickdraw
            </span>
            : The{' '}
            <a href="https://quickdraw.withgoogle.com/data">
              Quick Draw dataset
            </a>{' '}
            consists of 50 million hand-drawn figures across 345 categories. We
            randomly selected 10 categories for which to build a classifier,
            resulting in a training set of 65,729 examples and a test set of
            16,436 examples. We use 5,000 labels to start and add 1,000 more
            labels each round.
          </p>
          <p style={{ textIndent: grem }}>
            <span style={{ background: 'black', color: 'white' }}>Caltech</span>
            : The{' '}
            <a href="http://www.vision.caltech.edu/Image_Datasets/Caltech256/">
              Caltech 256 dataset
            </a>{' '}
            consists of 30,607 images from 256 categories. We randomly selected
            10 categories for which to build a classifier, resulting in a
            training set of 822 examples, and a test set of 212 examples. We use
            300 labels to start and add 50 labels each round.
          </p>
        </div>
      </div>
    )
  }
}

export default Modal
