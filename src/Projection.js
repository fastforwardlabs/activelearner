import React, { Component } from 'react'
import { decodeS } from './Utils'
import * as THREE from 'three'
import * as _ from 'lodash'
import * as d3 from 'd3'
import * as TWEEN from '@tweenjs/tween.js'
import * as chroma from 'chroma-js'

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
let sprite_side = 73
let sprite_size = sprite_side * sprite_side
let sprite_number = 12
let sprite_image_size = 28
// actual sprite size needs to be power of 2
let sprite_actual_size = 2048

let mnist_tile_string = 'mnist_'
let mnist_tile_locations = [...Array(sprite_number)].map(
  (n, i) => `${process.env.PUBLIC_URL}/${mnist_tile_string}${i}.png`
)
let loader = new THREE.TextureLoader()
let circle_texture = loader.load(`${process.env.PUBLIC_URL}/circle.png`)
circle_texture.flipY = false

let ranges = []
for (let i = 0; i < sprite_number; i++) {
  let start = i * sprite_size
  let end = (i + 1) * sprite_size
  if (i === sprite_number - 1) end = sprite_number * sprite_size
  ranges.push([start, end])
}

let labels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

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
let color_num = 10
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
// console.log(color_array)
color_num = 10
let color_array_hexes = [...Array(color_num)].map((n, i) =>
  chroma
    .hsl(0 + (360 / color_num) * i, 1, 0.5)
    .luminance(0.5)
    .hex()
)

// let status_to_color = color_array.map(a => a.map(c => c / 255))
let status_to_color = color_array.map(a => a.slice(0, 3))

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
    this.state = {}
    this.init = this.init.bind(this)
    this.animate = this.animate.bind(this)
    this.addPoints = this.addPoints.bind(this)
    this.transitionPoints = this.transitionPoints.bind(this)
    this.addSelectedPoints = this.addSelectedPoints.bind(this)
    this.labelSelected = this.labelSelected.bind(this)
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

    this.camera.position.set(x, y, z)

    // point size scales at end of zoom
    // let new_size = zoomScaler(z)
    // let point_group = this.scene.children[0].children
    // for (let c = 0; c < point_group.length; c++) {
    //   point_group[c].material.uniforms.size.value = new_size
    // }
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
    let loaded_sliced = ranges.map(range => sliceRound(loaded, range))
    let parent_group = new THREE.Group()

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
        return status_to_color[label]
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
        size: { value: 20 },
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
          vec4 tex = texture2D( texture, uv * repeat  + vOffset);
          if ( tex.r < 0.5 ) discard;
          tex.r = 1.0;
          tex.g = 1.0;
          tex.b = 1.0;
          gl_FragColor = tex * vec4(vColor, 1.0);
        }`

      // material
      let material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertex_shader,
        fragmentShader: fragment_shader,
      })

      let point_cloud = new THREE.Points(geometry, material)
      parent_group.add(point_cloud)
    }

    this.scene.children[0] = parent_group
  }

  transitionPoints(loaded_embedding, embeddings) {
    let me = this

    let back_points = this.scene.children[0]
    let existing_points = this.scene.children[1].children
    let loaded = embeddings[loaded_embedding]
    let loaded_sliced = ranges.map(range => sliceRound(loaded, range))

    let slice_number = loaded_sliced.length
    for (let s = 0; s < slice_number; s++) {
      let back_existing = back_points.children[s]
      let slice = loaded_sliced[s]

      let start_position = back_existing.geometry.attributes.position.array.slice()
      let end_position = prepPositions(slice.coordinates)

      let position_tween = new TWEEN.Tween(start_position)
        .to(end_position, 800)
        .easing(TWEEN.Easing.Linear.None)
      position_tween.onUpdate(function() {
        back_existing.geometry.attributes.position.array = start_position
        back_existing.geometry.attributes.position.needsUpdate = true
      })
      position_tween.start()

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

      let size = { value: 20 }
      let end_size = { value: 0 }
      let me = this
      let size_tween = new TWEEN.Tween(size)
        .to(end_size, 400)
        .easing(TWEEN.Easing.Linear.None)
        .delay(400)
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
        .to(sel_end_position, 800)
        .easing(TWEEN.Easing.Linear.None)
      sel_position_tween.onUpdate(function() {
        existing.geometry.attributes.position.array = sel_start_positions
        existing.geometry.attributes.position.needsUpdate = true
      })
      sel_position_tween.onComplete(() => {
        if (s === 0) {
          setTimeout(() => {
            me.addPoints()
            if (existing.material.uniforms.size.value > 0) {
              me.props.setTransitionStatus(2.6)
            } else {
              me.addSelectedPoints()
              me.props.setTransitionStatus(0)
            }
          }, 0)
        }
      })
      if (existing.material.uniforms.size.value > 0) {
        sel_position_tween.chain(size_tween)
      } else {
        // existing.material.uniforms.size.value = 20
      }
      sel_position_tween.start()
    }
  }

  addSelectedPoints() {
    let { loaded_embedding, embeddings } = this.props

    this.scene.children[1] = new THREE.Group()

    let loaded = embeddings[loaded_embedding]

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
        return [1, 1, 1]
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
  }

  revealSelected() {
    let size = { value: 0 }
    let end_size = { value: 20 }
    let groups = this.scene.children[1].children
    for (let g = 0; g < groups.length; g++) {
      let points = groups[g]
      let size_tween = new TWEEN.Tween(size)
        .to(end_size, 400)
        .easing(TWEEN.Easing.Linear.None)
      size_tween.onUpdate(function() {
        points.material.uniforms.size = size
      })
      let me = this
      size_tween.onComplete(function() {
        if (g === 0) {
          me.props.setTransitionStatus(1)
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
        let color = status_to_color[label]
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
      prevProps.loaded_embedding === null &&
      this.props.loaded_embedding !== null
    ) {
      // first load
      Promise.all(getTextures(mnist_tile_locations)).then(textures => {
        this.textures = textures
        this.addPoints()
        this.addSelectedPoints()
        this.props.setTransitionStatus(0.5)
      })
    } else if (prevProps.loaded_embedding !== this.props.loaded_embedding) {
      //   // embeddings have changed
      let prevd = decodeS(prevProps.loaded_embedding)
      let d = decodeS(this.props.loaded_embedding)
      if (prevd.dataset !== d.dataset) {
        // different dataset
        console.log('different dataset')
        // this.addPoints()
      } else if (prevd.strategy !== d.strategy) {
        // new strategy, we should transition
        // if (this.props.transition_status === 1) {
        // this.labelSelected()
        // }
        this.transitionPoints(
          this.props.loaded_embedding,
          this.props.embeddings
        )
      } else if (
        prevd.round !== d.round &&
        this.props.transition_status !== 1.5
      ) {
        this.transitionPoints(
          this.props.loaded_embedding,
          this.props.embeddings
        )
      }
    } else if (
      (this.props.transition_status === 0.5 &&
        prevProps.transition_status === 0) ||
      (this.props.transition_status === 0.5 &&
        prevProps.transition_status === 2.6)
    ) {
      this.revealSelected()
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
  }

  init() {
    let { width, height } = this.props

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
    let { width, height, grem } = this.props
    return (
      <div
        style={{
          position: 'absolute',
          left: 0,
          width: width,
          height: height,
          background: '#222',
          overflow: 'hidden',
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
          style={{
            background: 'transparent',
            display: 'flex',
            flexWrap: 'auto',
            padding: `0 ${grem / 4}px`,
            position: 'absolute',
            left: 0,
            bottom: this.props.footer_height + grem,
          }}
        >
          <div style={{ padding: `0 ${grem / 4}px` }}>Labels:</div>
          <div
            style={{
              background: '#888',
              color: '#111',
              width: grem,
              height: grem,
              textAlign: 'center',
            }}
          >
            ?
          </div>
          {color_array_hexes.map((c, i) => (
            <div
              style={{
                background: color_array_hexes[i],
                height: grem,
                textAlign: 'center',
                color: '#111',
                width: grem,
              }}
            >
              {i}
            </div>
          ))}
        </div>
      </div>
    )
  }
}

export default Projection
