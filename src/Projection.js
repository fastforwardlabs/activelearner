import React, { Component } from 'react'
import { decodeS, label_dict } from './Utils'
import * as THREE from 'three'
import * as _ from 'lodash'
import * as d3 from 'd3'
import * as TWEEN from '@tweenjs/tween.js'
import * as chroma from 'chroma-js'

let color_duration = 500
let size_duration = 500
let position_duration = 1000

/**
 *
 * @param {Array} texturesSources - List of Strings that represent texture sources
 * @returns {Array} Array containing a Promise for each source
 */
function getTextures(texturesSources) {
  const loader = new THREE.TextureLoader()
  return texturesSources.map(textureSource => {
    return new Promise((resolve, reject) => {
      loader.load(
        textureSource,
        texture => {
          texture.flipY = false
          resolve(texture)
        },
        undefined, // onProgress callback not supported from r84
        err => reject(err)
      )
    })
  })
}

// Constants for sprite sheets
// let sprite_side = 73
// let sprite_size = sprite_side * sprite_side
// let sprite_number = 12
// let sprite_image_size = 28
// actual sprite size needs to be power of 2
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

let point_size_dict = {
  MNIST: 30,
  Quickdraw: 30,
  Caltech: 30,
}

let hover_size = 28 * 3
let hover_pad = 4
let hover_bord = 0

let loader = new THREE.TextureLoader()
// let circle_texture = loader.load(`${process.env.PUBLIC_URL}/circle.png`)
// circle_texture.flipY = false

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

// let mnist_images = mnist_tile_locations.map(src => {
//   let img = document.createElement('img')
//   img.src = src
//   return img
// })

// let quickdraw_images = quickdraw_tile_locations.map(src => {
//   let img = document.createElement('img')
//   img.src = src
//   return img
// })

// let caltech_images = caltech_tile_locations.map(src => {
//   let img = document.createElement('img')
//   img.src = src
//   return img
// })

// let image_dict = {
//   MNIST: mnist_images,
//   Quickdraw: quickdraw_images,
//   Caltech: caltech_images,
// }

function getRanges(dataset) {
  let ranges = []
  let spec = sprite_spec_dict[dataset]
  let { sprite_number, sprite_size } = spec
  for (let i = 0; i < sprite_number; i++) {
    let start = i * sprite_size
    let end = (i + 1) * sprite_size
    if (i === sprite_number - 1) end = sprite_number * sprite_size
    ranges.push([start, end])
  }
  return ranges
}

// let mnist_images = mnist_tile_locations.map(src => {
//   let img = document.createElement('img')
//   img.src = src
//   return img
// })

// let color_array = [
//   [141, 211, 199],
//   [255, 255, 179],
//   [190, 186, 218],
//   [251, 128, 114],
//   [128, 177, 211],
//   [253, 180, 98],
//   [179, 222, 105],
//   [252, 205, 229],
//   [188, 128, 189],
//   [204, 235, 197],
//   [100, 100, 100],
// ]

function getColorStuff(dataset) {
  let color_num = label_dict[dataset].length
  let color_array = [...Array(color_num)].map((n, i) =>
    chroma
      .hsl(0 + (360 / color_num) * i, 1, 0.5)
      .luminance(0.5)
      .gl()
  )
  color_array.push(
    chroma
      .hsl(0, 0, 0.5)
      .luminance(0.1)
      .gl()
  )

  let color_array_hexes = [...Array(color_num)].map((n, i) =>
    chroma
      .hsl(0 + (360 / color_num) * i, 1, 0.5)
      .luminance(0.5)
      .hex()
  )

  let status_to_color = color_array.map(a => a.slice(0, 3))

  return { color_array, color_array_hexes, status_to_color }
}

function sliceRound(object, range) {
  return {
    coordinates: object.coordinates.slice(range[0], range[1]),
    labels: object.labels.slice(range[0], range[1]),
    statuses: object.statuses.slice(range[0], range[1]),
  }
}

function prepPositions(coordinates) {
  let position_prep = []
  for (let i = 0; i < coordinates.length; i++) {
    let embedding = coordinates[i]
    position_prep.push(embedding[0], embedding[1], 0)
  }
  let positions = new Float32Array(position_prep)
  return positions
}

class Projection extends Component {
  constructor(props) {
    super(props)
    this.state = {
      color_array: null,
      color_array_hexes: null,
      status_to_color: null,
      initialized: false,
    }
    this.init = this.init.bind(this)
    this.animate = this.animate.bind(this)
    this.addPoints = this.addPoints.bind(this)
    this.transitionPoints = this.transitionPoints.bind(this)
    this.addSelectedPoints = this.addSelectedPoints.bind(this)
    this.labelSelected = this.labelSelected.bind(this)
    this.showHover = this.showHover.bind(this)
    this.hover_ctx = null
    this.resetCamera = this.resetCamera.bind(this)
    this.prev_d3_x = null
    this.prev_d3_y = null
  }

  getZFromScale(scale) {
    let rvFOV = THREE.Math.degToRad(this.camera.fov)
    let scale_height = this.props.height / scale
    let camera_z_position = scale_height / (2 * Math.tan(rvFOV / 2))
    return camera_z_position
  }

  getScaleFromZ(camera_z_position) {
    let rvFOV = THREE.Math.degToRad(this.camera.fov)
    let half_fov_height = Math.tan(rvFOV / 2) * camera_z_position
    let fov_height = half_fov_height * 2
    let scale = this.props.height / fov_height
    return scale
  }

  zoomHandler() {
    let d3_transform = d3.event.transform

    let scale = d3_transform.k
    let x = -(d3_transform.x - this.props.width / 2) / scale
    let y = (d3_transform.y - this.props.height / 2) / scale
    let z = this.getZFromScale(scale)

    if (d3.event.transform.k === this.getScaleFromZ(this.camera.position.z)) {
      if (this.prev_d3_x !== null) {
        let dx = d3_transform.x - this.prev_d3_x
        let dy = d3_transform.y - this.prev_d3_y
        let hover_transform = this.hover_mount.style.transform.split(',')
        let hover_x = parseInt(hover_transform[0].split('(')[1])
        let hover_y = parseInt(hover_transform[1])
        this.hover_mount.style.transform = `translate3d(${hover_x +
          dx}px, ${hover_y + dy}px, 0)`
      }
    }

    this.prev_d3_x = d3_transform.x
    this.prev_d3_y = d3_transform.y

    this.camera.position.set(x, y, z)
  }

  addPoints() {
    let { loaded_embedding, embeddings } = this.props

    this.scene.children[0] = new THREE.Group()

    // split embeddings and labels into chunks to match sprites
    // load the textures
    // let loader = new THREE.TextureLoader()
    // this.textures = mnist_tile_locations.map(l => {
    //   let t = loader.load(l)
    //   t.flipY = false
    //   // t.magFilter = THREE.NearestFilter
    //   // t.minFilter = THREE.LinearMipMapLinearFilter;
    //   return t
    // })
    let loaded = embeddings[loaded_embedding]
    let ranges = getRanges(this.props.dataset)
    let loaded_sliced = ranges.map(range => sliceRound(loaded, range))
    let parent_group = new THREE.Group()

    let { sprite_side, sprite_image_size } = sprite_spec_dict[
      this.props.dataset
    ]

    let slice_number = loaded_sliced.length
    for (let s = 0; s < slice_number; s++) {
      let slice = loaded_sliced[s]
      let point_number = slice.coordinates.length

      let geometry = new THREE.BufferGeometry()

      // positions
      let positions = prepPositions(slice.coordinates)

      // offsets
      let offsets = new Float32Array(point_number * 2)
      for (let i = 0, index = 0, l = point_number; i < l; i++, index += 2) {
        let x = ((i % sprite_side) * sprite_image_size) / sprite_actual_size
        let y =
          (Math.floor(i / sprite_side) * sprite_image_size) / sprite_actual_size
        offsets[index] = x
        offsets[index + 1] = y
      }

      let color_prep = slice.labels.map(label => {
        return this.state.status_to_color[label]
      })
      let color_flattened = _.flatten(color_prep)
      let colors = new Float32Array(color_flattened)

      let texture_subsize = 1 / sprite_side

      let texture = this.textures[s]
      let repeat = [texture_subsize, texture_subsize]

      geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.addAttribute('offset', new THREE.BufferAttribute(offsets, 2))
      geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3))

      // texture = circle_texture
      // repeat = [1, 1]

      let uniforms = {
        texture: { value: texture },
        repeat: { value: new THREE.Vector2(...repeat) },
        size: { value: point_size_dict[this.props.dataset] },
      }

      let vertex_shader = `
        attribute vec2 offset;
        varying vec2 vOffset;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float size;
        void main() {
          vOffset = offset;
          vColor = color;
          gl_PointSize = size;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`

      let fragment_shader = `
        uniform sampler2D texture;
        uniform vec2 repeat;
        varying vec2 vOffset;
        varying vec3 vColor;
        void main() {
          vec2 uv = vec2( gl_PointCoord.x, gl_PointCoord.y );
          vec4 tex = texture2D( texture, uv * repeat  + vOffset);
          if ( tex.r < 0.5 ) discard;
          tex.r = 1.0;
          tex.g = 1.0;
          tex.b = 1.0;
          gl_FragColor = tex * vec4(vColor, 1.0);
        }`

      if (this.props.dataset === 'Caltech') {
        fragment_shader = `
          uniform sampler2D texture;
          uniform vec2 repeat;
          varying vec2 vOffset;
          varying vec3 vColor;
          void main() {
            vec2 uv = vec2( gl_PointCoord.x, gl_PointCoord.y );
            // vec4 tex = texture2D( texture, uv * repeat );
            vec4 tex = texture2D( texture, uv * repeat  + vOffset);
            // if ( tex.r < 0.5 ) discard;
            if ( uv[0] < 0.1 ) tex = vec4(vColor, 1.0);
            if ( uv[1] < 0.1 ) tex = vec4(vColor, 1.0);
            if ( uv[0] > 0.9 ) tex = vec4(vColor, 1.0);
            if ( uv[1] > 0.9 ) tex = vec4(vColor, 1.0);
            // tex.r = 1.0;
            // tex.g = 1.0;
            // tex.b = 1.0;
            gl_FragColor = tex;
        }`
      }

      // material
      let material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertex_shader,
        fragmentShader: fragment_shader,
      })

      let point_cloud = new THREE.Points(geometry, material)

      point_cloud.userData = { sprite_index: s }

      parent_group.add(point_cloud)
    }

    this.scene.children[0] = parent_group
  }

  transitionPoints(loaded_embedding, embeddings, transition_colors) {
    let back_points = this.scene.children[0]
    let existing_points = this.scene.children[1].children
    let loaded = embeddings[loaded_embedding]

    let ranges = getRanges(this.props.dataset)
    let loaded_sliced = ranges.map(range => sliceRound(loaded, range))

    let slice_number = loaded_sliced.length
    for (let s = 0; s < slice_number; s++) {
      let back_existing = back_points.children[s]
      let slice = loaded_sliced[s]

      let start_position = back_existing.geometry.attributes.position.array.slice()
      let end_position = prepPositions(slice.coordinates)

      if (true || transition_colors) {
        let start_colors = back_existing.geometry.attributes.color.array.slice()
        let color_prep = slice.labels.map(label => {
          let color = this.state.status_to_color[label]
          return color
        })
        let color_flattened = _.flatten(color_prep)
        let end_colors = new Float32Array(color_flattened)

        let color_tween = new TWEEN.Tween(start_colors)
          .to(end_colors, color_duration)
          .easing(TWEEN.Easing.Linear.None)
        color_tween.onUpdate(function() {
          back_existing.geometry.attributes.color.array = start_colors
          back_existing.geometry.attributes.color.needsUpdate = true
        })
        color_tween.delay(color_duration)

        let position_tween = new TWEEN.Tween(start_position)
          .to(end_position, position_duration)
          .easing(TWEEN.Easing.Linear.None)
        position_tween.onUpdate(function() {
          back_existing.geometry.attributes.position.array = start_position
          back_existing.geometry.attributes.position.needsUpdate = true
        })
        position_tween.start().chain(color_tween)

        // let combo_tween = new TWEEN.Tween(combo_start)
        //   .to(combo_end, 800)
        //   .easing(TWEEN.Easing.Linear.None)
        // combo_tween.onUpdate(function() {
        //   if (s === 0) {
        //     console.log(combo_start.positions[0])
        //   }
        //   back_existing.geometry.attributes.color.array = combo_start.colors
        //   back_existing.geometry.attributes.color.needsUpdate = true
        //   back_existing.geometry.attributes.position.array =
        //     combo_start.positions
        //   back_existing.geometry.attributes.position.needsUpdate = true
        // })
        // combo_tween.start()
      } else {
        let position_tween = new TWEEN.Tween(start_position)
          .to(end_position, 800)
          .easing(TWEEN.Easing.Linear.None)
        position_tween.onUpdate(function() {
          back_existing.geometry.attributes.position.array = start_position
          back_existing.geometry.attributes.position.needsUpdate = true
        })
        position_tween.start()
      }

      // selected
      let existing = existing_points[s]
      let indexes = Array.from(existing.geometry.attributes.indexes.array)

      let sel_start_positions = existing.geometry.attributes.position.array.slice()
      let sel_end_position_prep = indexes.map(i => {
        let coord = slice.coordinates[i]
        return coord
      })
      let end_flattened = prepPositions(sel_end_position_prep)
      let sel_end_position = new Float32Array(end_flattened)

      let size_delay = 1200
      if (!transition_colors) size_delay = 400
      let size = { value: point_size_dict[this.props.dataset] }
      let end_size = { value: 0 }
      let me = this
      let size_tween = new TWEEN.Tween(size)
        .to(end_size, size_duration)
        .easing(TWEEN.Easing.Linear.None)
        .delay(size_delay)
        .onComplete(() => {
          // hack to just run once
          if (s === 0) {
            me.addSelectedPoints()
            me.props.setTransitionStatus(0.5)
          }
        })
      size_tween.onUpdate(function() {
        existing.material.uniforms.size = size
      })

      let sel_position_tween = new TWEEN.Tween(sel_start_positions)
        .to(sel_end_position, position_duration)
        .easing(TWEEN.Easing.Linear.None)
      sel_position_tween.onUpdate(function() {
        existing.geometry.attributes.position.array = sel_start_positions
        existing.geometry.attributes.position.needsUpdate = true
      })
      sel_position_tween.onComplete(() => {
        if (s === 0) {
          setTimeout(() => {
            if (existing.material.uniforms.size.value > 0) {
              me.props.setTransitionStatus(2.6)
            } else {
              me.addSelectedPoints()
              me.props.setTransitionStatus(2.6)
              me.props.setTransitionStatus(0.5)
            }
          }, 0)
        }
      })
      if (existing.material.uniforms.size.value > 0) {
        sel_position_tween.chain(size_tween)
      } else {
        // me.addSelectedPoints()
        // me.props.setTransitionStatus(0.5)
        // existing.material.uniforms.size.value = 20
      }
      sel_position_tween.start()
    }
  }

  addSelectedPoints() {
    let { loaded_embedding, embeddings } = this.props

    this.scene.children[1] = new THREE.Group()

    let loaded = embeddings[loaded_embedding]

    let { sprite_side, sprite_image_size } = sprite_spec_dict[
      this.props.dataset
    ]

    let ranges = getRanges(this.props.dataset)
    let loaded_sliced = ranges.map(range => sliceRound(loaded, range))

    let parent_group = new THREE.Group()

    let slice_number = loaded_sliced.length
    for (let s = 0; s < slice_number; s++) {
      let slice = loaded_sliced[s]

      let indexes = []
      for (let i = 0; i < slice.statuses.length; i++) {
        if (slice.statuses[i] === 1) {
          indexes.push(i)
        }
      }
      let attribute_indexes = new Float32Array(indexes)

      let point_number = indexes.length

      let geometry = new THREE.BufferGeometry()

      // positions
      let positions = prepPositions(indexes.map(i => slice.coordinates[i]))

      // offsets
      let offsets = new Float32Array(point_number * 2)
      for (let i = 0, index = 0, l = point_number; i < l; i++, index += 2) {
        let loc_index = indexes[i]
        let x =
          ((loc_index % sprite_side) * sprite_image_size) / sprite_actual_size
        let y =
          (Math.floor(loc_index / sprite_side) * sprite_image_size) /
          sprite_actual_size
        offsets[index] = x
        offsets[index + 1] = y
      }

      let color_prep = indexes.map(i => {
        return [0.85, 0.85, 0.85]
      })
      let color_flattened = _.flatten(color_prep)
      let colors = new Float32Array(color_flattened)

      let texture_subsize = 1 / sprite_side

      let texture = this.textures[s]
      let repeat = [texture_subsize, texture_subsize]

      geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.addAttribute('offset', new THREE.BufferAttribute(offsets, 2))
      geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3))
      geometry.addAttribute(
        'indexes',
        new THREE.BufferAttribute(attribute_indexes, 1)
      )

      // texture = circle_texture
      // repeat = [1, 1]

      let uniforms = {
        texture: { value: texture },
        repeat: { value: new THREE.Vector2(...repeat) },
        size: { value: 0 },
      }

      let vertex_shader = `
        attribute vec2 offset;
        varying vec2 vOffset;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float size;
        void main() {
          vOffset = offset;
          vColor = color;
          gl_PointSize = size;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`

      let fragment_shader = `
        uniform sampler2D texture;
        uniform vec2 repeat;
        varying vec2 vOffset;
        varying vec3 vColor;
        void main() {
          vec2 uv = vec2( gl_PointCoord.x, gl_PointCoord.y );
          // vec4 tex = texture2D( texture, uv * repeat );
          vec4 tex = texture2D( texture, uv * repeat + vOffset );
          if ( tex.r < 0.5 ) discard;
          tex.r = 1.0;
          tex.g = 1.0;
          tex.b = 1.0;
          gl_FragColor = tex * vec4(vColor, 1.0);
        }`

      if (this.props.dataset === 'Caltech') {
        fragment_shader = `
          uniform sampler2D texture;
          uniform vec2 repeat;
          varying vec2 vOffset;
          varying vec3 vColor;
          void main() {
            vec2 uv = vec2( gl_PointCoord.x, gl_PointCoord.y );
            // vec4 tex = texture2D( texture, uv * repeat );
            vec4 tex = texture2D( texture, uv * repeat  + vOffset);
            // if ( tex.r < 0.5 ) discard;
            if ( uv[0] < 0.1 ) tex = vec4(vColor, 1.0);
            if ( uv[1] < 0.1 ) tex = vec4(vColor, 1.0);
            if ( uv[0] > 0.9 ) tex = vec4(vColor, 1.0);
            if ( uv[1] > 0.9 ) tex = vec4(vColor, 1.0);
            // tex.r = 1.0;
            // tex.g = 1.0;
            // tex.b = 1.0;
            gl_FragColor = tex;
        }`
      }

      // material
      let material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertex_shader,
        fragmentShader: fragment_shader,
      })

      let point_cloud = new THREE.Points(geometry, material)
      parent_group.add(point_cloud)
    }

    this.scene.children[1] = parent_group
    // this.scene.children[1].visible = false
  }

  revealSelected() {
    let size = { value: 0 }
    let end_size = { value: point_size_dict[this.props.dataset] }
    let groups = this.scene.children[1].children
    for (let g = 0; g < groups.length; g++) {
      let points = groups[g]
      let size_tween = new TWEEN.Tween(size)
        .to(end_size, size_duration)
        .easing(TWEEN.Easing.Linear.None)
      size_tween.onUpdate(function() {
        points.material.uniforms.size = size
      })
      let me = this
      size_tween.onComplete(function() {
        if (g === 0) {
          setTimeout(() => {
            me.props.setTransitionStatus(1)
          }, 200)
        }
      })
      size_tween.start()
    }

    // let opacity = { value: 0 }
    // let end_opacity = { value: 1 }
    // for (let g = 0; g < groups.length; g++) {
    //   let points = groups[g]
    //   points.material.uniforms.size = { value: 20 }
    //   let opacity_tween = new TWEEN.Tween(opacity)
    //     .to(end_opacity, 800)
    //     .easing(TWEEN.Easing.Linear.None)
    //   opacity_tween.onUpdate(function() {
    //     console.log(opacity.value)
    //     points.material.opacity = opacity.value
    //   })
    //   let me = this
    //   opacity_tween.onComplete(function() {
    //     if (g === 0) {
    //       me.props.setTransitionStatus(1)
    //     }
    //   })
    //   opacity_tween.start()
    // }
  }

  labelSelected() {
    let { loaded_embedding, embeddings } = this.props

    let loaded = embeddings[loaded_embedding]

    let ranges = getRanges(this.props.dataset)
    let loaded_sliced = ranges.map(range => sliceRound(loaded, range))

    let existing_points = this.scene.children[1].children

    for (let s = 0; s < loaded_sliced.length; s++) {
      let slice = loaded_sliced[s]
      let existing = existing_points[s]

      let indexes = Array.from(existing.geometry.attributes.indexes.array)

      let start_colors = existing_points[
        s
      ].geometry.attributes.color.array.slice()

      let color_prep = indexes.map(i => {
        let label = slice.labels[i]
        let color = this.state.status_to_color[label]
        return color
      })
      let color_flattened = _.flatten(color_prep)
      let end_colors = new Float32Array(color_flattened)

      let color_tween = new TWEEN.Tween(start_colors)
        .to(end_colors, 400)
        .easing(TWEEN.Easing.Linear.None)
      let points = existing_points[s]
      color_tween.onUpdate(function() {
        points.geometry.attributes.color.array = start_colors
        points.geometry.attributes.color.needsUpdate = true
      })
      let me = this
      color_tween.onComplete(function() {
        if (s === 0) {
          setTimeout(function() {
            me.props.setTransitionStatus(2.3)
          }, 0)
        }
      })
      color_tween.start()
    }
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.loaded_embedding !== null &&
      this.state.initialized === false
    ) {
      this.setState({ initialized: true })
      // first load
      Promise.all(getTextures(tile_dict[this.props.dataset]))
        .then(textures => {
          this.textures = textures
          this.addPoints()
          this.addSelectedPoints()
          this.props.setTransitionStatus(0.5)
          let datasets = ['MNIST', 'Quickdraw', 'Caltech']
          let index = datasets.indexOf(this.props.dataset)
          let me = this
          setTimeout(() => {
            me.props.loadImages(index)
            let height = this.divElement.clientHeight
            me.props.setKeyHeight(height)
          }, 0)
        })
        .catch(function(err) {
          console.log(err.message) // some coding error in handling happened
        })
    } else if (prevProps.loaded_embedding !== this.props.loaded_embedding) {
      //   // embeddings have changed
      let prevd = decodeS(prevProps.loaded_embedding)
      let d = decodeS(this.props.loaded_embedding)
      if (prevd.dataset !== d.dataset) {
        let { color_array, color_array_hexes, status_to_color } = getColorStuff(
          d.dataset
        )
        this.setState({
          color_array,
          color_array_hexes,
          status_to_color,
        })

        // different dataset
        while (this.scene.children.length > 0) {
          this.scene.remove(this.scene.children[0])
        }
        this.resetCamera()
        this.props.setTransitionStatus(0)
        let height = this.divElement.clientHeight
        this.props.setKeyHeight(height)
        let me = this
        setTimeout(() => {
          Promise.all(getTextures(tile_dict[me.props.dataset])).then(
            textures => {
              me.textures = textures
              me.addPoints()

              me.addSelectedPoints()
              me.props.setTransitionStatus(0.5)
            }
          )
        }, 0)
      } else if (prevd.strategy !== d.strategy) {
        // new strategy, we should transition
        // new strategy, who dis
        // if (this.props.transition_status === 1) {
        // this.labelSelected()
        // }
        this.transitionPoints(
          this.props.loaded_embedding,
          this.props.embeddings,
          true
        )
      } else if (
        prevd.round !== d.round &&
        this.props.transition_status !== 1.5
      ) {
        this.transitionPoints(
          this.props.loaded_embedding,
          this.props.embeddings,
          true
        )
      }
    } else if (
      (this.props.transition_status === 0.5 &&
        prevProps.transition_status === 0) ||
      (this.props.transition_status === 0.5 &&
        prevProps.transition_status === 2.6)
    ) {
      if (this.props.round !== this.props.round_limit) {
        this.revealSelected()
      } else {
        // last round
        this.props.setTransitionStatus(1)
        // if (!this.props.standings_seen) {
        let me = this
        setTimeout(() => {
          me.props.toggleEnd(true)
        }, 200)
        // }
      }
    } else if (
      // probably a race condition here
      this.props.transition_status === 2 &&
      prevProps.transition_status === 1.5
    ) {
      this.labelSelected(this.props.loaded_embedding, this.props.embeddings)
    } else if (
      this.props.transition_status === 2.3 &&
      prevProps.transition_status === 2
    ) {
      this.transitionPoints(this.props.loaded_embedding, this.props.embeddings)
    } else if (this.props.round !== prevProps.round) {
    }

    let { width, height } = this.props
    if (width !== prevProps.width || height !== prevProps.height) {
      this.camera.aspect = width / height
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(width, height)

      let current_scale = this.getScaleFromZ(this.camera.position.z)
      let d3_x =
        -(this.camera.position.x * current_scale) + this.props.width / 2
      let d3_y = this.camera.position.y * current_scale + this.props.height / 2
      var resize_transform = d3.zoomIdentity
        .translate(d3_x, d3_y)
        .scale(current_scale)
      let view = d3.select(this.mount)
      this.d3_zoom.transform(view, resize_transform)

      let me = this
      setTimeout(() => {
        let height = me.divElement.clientHeight
        me.props.setKeyHeight(height)
      }, 0)
    }
  }

  showHover(mouse_coords, sprite_index, digit_index, full_index) {
    let images = this.props.images
    let image_dict = {
      MNIST: images[0],
      Quickdraw: images[1],
      Caltech: images[2],
    }

    if (
      this.hover_ctx !== undefined &&
      image_dict[this.props.dataset] !== undefined &&
      image_dict[this.props.dataset] !== null
    ) {
      let loaded = this.props.embeddings[this.props.loaded_embedding]
      this.hover_mount.style.display = 'block'
      let y_adjust = `${mouse_coords[1] -
        hover_size -
        this.props.grem -
        hover_pad * 4 -
        14}px`
      // y_adjust = `${mouse_coords[1] - hover_size / 2 - hover_pad}px`
      this.hover_mount.style.transform = `translate3d(${mouse_coords[0] -
        hover_size / 2 -
        hover_pad}px, ${y_adjust},0)`
      this.hover_ctx = this.hover_mount.childNodes[0].getContext('2d')
      this.hover_ctx.imageSmoothingEnabled = false
      let label = this.hover_mount.childNodes[1]
      this.hover_ctx.fillRect(0, 0, hover_size, hover_size)

      let status = loaded.statuses[full_index]

      let adjusted_status = this.state.status_to_color.slice(
        0,
        this.state.status_to_color.length - 1
      )
      adjusted_status.push([0.5, 0.5, 0.5])

      let color = null
      let text_color = 'black'
      if (status === 1 && this.props.round !== this.props.round_limit) {
        color = '#eee'
        text_color = 'black'
      } else {
        color =
          'rgba(' +
          adjusted_status[loaded.labels[full_index]]
            .map(d => Math.round(d * 255))
            .join(',') +
          ',1)'
      }
      this.hover_mount.style.background = color
      this.hover_mount.style.color = text_color

      let { sprite_side, sprite_image_size } = sprite_spec_dict[
        this.props.dataset
      ]

      label.style.background = color
      label.innerText =
        status === 1 && this.props.round !== this.props.round_limit
          ? 'selected'
          : [...label_dict[this.props.dataset], 'unlabeled'][
              loaded.labels[full_index]
            ]
      this.hover_ctx.drawImage(
        image_dict[this.props.dataset][sprite_index],
        // source rectangle
        (digit_index % sprite_side) * sprite_image_size,
        Math.floor(digit_index / sprite_side) * sprite_image_size,
        sprite_image_size,
        sprite_image_size,
        // destination rectangle
        0,
        0,
        hover_size,
        hover_size
      )
    }
  }

  checkIntersects(mouse_position) {
    let { width, height } = this.props
    let [mouseX, mouseY] = mouse_position

    let { sprite_size } = sprite_spec_dict[this.props.dataset]

    function mouseToThree([mouseX, mouseY]) {
      return new THREE.Vector3(
        (mouseX / width) * 2 - 1,
        -(mouseY / height) * 2 + 1,
        1
      )
    }

    function sortIntersectsByDistanceToRay(intersects) {
      return _.sortBy(intersects, 'distanceToRay')
    }

    let mouse_vector = mouseToThree(mouse_position)
    this.raycaster.setFromCamera(mouse_vector, this.camera)
    this.raycaster.params.Points.threshold = 0.25
    if (this.props.dataset === 'Caletch')
      this.raycaster.params.Points.threshold = 4.0
    if (
      this.scene.children[0] !== undefined &&
      this.scene.children[0].children.length > 0
    ) {
      let intersects = this.raycaster.intersectObjects(
        this.scene.children[0].children
      )
      if (intersects[0]) {
        let sorted_intersects = sortIntersectsByDistanceToRay(intersects)
        let intersect = sorted_intersects[0]
        let sprite_index = intersect.object.userData.sprite_index
        let digit_index = intersect.index
        let full_index = sprite_index * sprite_size + digit_index
        this.showHover([mouseX, mouseY], sprite_index, digit_index, full_index)
        // this.props.setHoverIndex(full_index)
        // this.highlightPoint(sprite_index, digit_index, full_index)
      } else {
        this.hover_mount.style.display = `none`
      }
    }
  }

  handleMouse() {
    let view = d3.select(this.renderer.domElement)

    this.raycaster = new THREE.Raycaster()

    view.on('mousemove', () => {
      let [mouseX, mouseY] = d3.mouse(view.node())
      let mouse_position = [mouseX, mouseY]
      this.checkIntersects(mouse_position)
    })

    view.on('mouseleave', () => {
      this.hover_mount.style.display = `none`
    })
  }

  init() {
    let { width, height } = this.props

    let { color_array, color_array_hexes, status_to_color } = getColorStuff(
      this.props.dataset
    )
    this.setState({
      color_array,
      color_array_hexes,
      status_to_color,
    })

    this.scene = new THREE.Scene()

    let vFOV = 75
    let aspect = width / height
    let near = 0.01
    let far = 1000

    this.camera = new THREE.PerspectiveCamera(vFOV, aspect, near, far)

    this.camera.position.z = 30

    this.renderer = new THREE.WebGLRenderer()
    this.renderer.setClearColor(0x111111, 1)
    this.renderer.setSize(width, height)
    this.mount.appendChild(this.renderer.domElement)

    let point_group = new THREE.Group()
    this.scene.add(point_group)
    let selected_point_group = new THREE.Group()
    this.scene.add(selected_point_group)

    this.d3_zoom = d3
      .zoom()
      .scaleExtent([this.getScaleFromZ(far - 1), this.getScaleFromZ(0.1)])
      .on('zoom', this.zoomHandler.bind(this))

    let view = d3.select(this.mount)
    this.view = view
    view.call(this.d3_zoom)
    let initial_scale = this.getScaleFromZ(this.camera.position.z)
    var initial_transform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(initial_scale)
    this.d3_zoom.transform(view, initial_transform)

    this.animate()

    this.handleMouse()
  }

  resetCamera() {
    let { width, height } = this.props

    let view = d3.select(this.mount)

    this.camera.position.x = 0
    this.camera.position.y = 0
    this.camera.position.z = 30

    let initial_scale = this.getScaleFromZ(this.camera.position.z)
    var initial_transform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(initial_scale)
    this.d3_zoom.transform(view, initial_transform)
  }

  animate() {
    requestAnimationFrame(this.animate)
    TWEEN.update()
    this.renderer.sortObjects = false
    this.renderer.render(this.scene, this.camera)
  }

  componentDidMount() {
    this.init()
  }

  componentWillUnmount() {
    this.mount.removeChild(this.renderer.domElement)
  }

  render() {
    let { width, height, grem, dataset } = this.props
    return (
      <div
        style={{
          position: 'absolute',
          left: 0,
          width: width,
          height: height,
          background: '#222',
          overflow: 'hidden',
          cursor: 'crosshair',
        }}
        grem={grem}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: width,
            height: height,
          }}
          ref={mount => {
            this.mount = mount
          }}
        />
        <div
          ref={divElement => {
            this.divElement = divElement
          }}
          style={{
            background: 'transparent',
            display: 'flex',
            flexWrap: 'wrap',
            padding: `0 ${grem / 4}px`,
            position: 'absolute',
            left: 0,
            bottom: 0,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              marginBottom: grem / 2,
              marginRight: grem / 4,
            }}
          >
            <div style={{ padding: `0 ${grem / 4}px` }}>Key:</div>
            <div
              style={{
                background: '#888',
                color: '#111',
                height: grem,
                padding: `0 ${grem / 4}px`,
                textAlign: 'center',
                marginRight: grem / 4,
              }}
            >
              unlabeled
            </div>
            <div
              style={{
                background: '#fff',
                color: '#111',
                height: grem,
                padding: `0 ${grem / 4}px`,
                textAlign: 'center',
              }}
            >
              selected
            </div>
          </div>

          <div
            style={{
              padding: `0 ${grem / 4}px 0 ${grem / 4}px`,
              display: 'flex',
              flexWrap: 'wrap',
              marginBottom: grem / 2,
            }}
          >
            <div style={{ padding: `0 ${grem / 4}px 0 0` }}>Labels:</div>
            {this.state.color_array_hexes !== null
              ? this.state.color_array_hexes.map((c, i) => (
                  <div
                    key={'color_' + i}
                    style={{
                      background: this.state.color_array_hexes[i],
                      height: grem,
                      textAlign: 'center',
                      color: '#111',
                      padding: `0 ${grem / 4}px`,
                      marginRight: grem / 4,
                    }}
                  >
                    {label_dict[dataset][i]}
                  </div>
                ))
              : null}
          </div>
        </div>
        <div
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: hover_size + hover_pad * 2 + hover_bord * 2,
            pointerEvents: 'none',
            padding: hover_pad,
            display: 'none',
            color: 'white',
            height: grem + hover_size + hover_pad * 3 + hover_bord * 2,
            lineHeight: 0,
            border: `solid ${hover_bord}px rgba(0,0,0,0.3)`,
          }}
          ref={mount => {
            this.hover_mount = mount
          }}
        >
          <canvas
            width={hover_size}
            height={hover_size}
            style={{ imageRendering: 'pixelated' }}
          />
          <div
            style={{
              width: hover_size,
              height: grem,
              textAlign: 'center',
              lineHeight: 1.5,
              paddingTop: hover_pad,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          />
        </div>
      </div>
    )
  }
}

export default Projection
