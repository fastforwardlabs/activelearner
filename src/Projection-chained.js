import React, { Component } from 'react'
import { decodeS } from './Utils'
import * as THREE from 'three'
import * as _ from 'lodash'
import * as d3 from 'd3'
import * as TWEEN from '@tweenjs/tween.js'
import * as chroma from 'chroma-js'

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

function getSelected(statuses, coordinates) {
  return statuses
    .map((s, n) => [s, n])
    .filter(a => a[0] === 1)
    .map(a => coordinates[a[1]])
}

function tweenPointsPositions(points, start_position, end_position) {
  let position = start_position
  let tween = new TWEEN.Tween(position)
    .to(end_position, 1000)
    .easing(TWEEN.Easing.Linear.None)
  tween.onUpdate(function() {
    points.geometry.attributes.position = new THREE.BufferAttribute(position, 3)
    points.geometry.attributes.position.needsUpdate = true // required after the first render
  })
  return tween
}

function tweenMaterialSize(points, start_size, end_size) {
  let size_object = { size: points.material.size }
  let tween = new TWEEN.Tween(size_object)
    .to({ size: 0 }, 1000)
    .easing(TWEEN.Easing.Linear.None)
    .onUpdate(function() {
      points.material.size = size_object.size
    })
  return tween
}

function tweenColors(points, new_color) {
  // assume labelled color
  let old_colors = points.geometry.attributes.color.array.slice()
  let new_array = [...Array(old_colors.length)].map(p => 0.8)
  let new_colors = new Float32Array(new_array)
  let tween = new TWEEN.Tween(old_colors)
    .to(new_colors, 200)
    .easing(TWEEN.Easing.Linear.None)
  tween.onUpdate(function() {
    points.geometry.attributes.color = new THREE.BufferAttribute(old_colors, 3)
    points.geometry.attributes.color.needsUpdate = true // required after the first render
  })
  return tween
}

function createPointGroup(
  data_sliced,
  sliced_statuses,
  textures,
  selected_color
) {
  let unselected = new THREE.Group()
  let selected_backers = new THREE.Group()
  let selected = new THREE.Group()

  // let these_groups = [unselected, selected_backers, selected]
  let these_groups = [unselected, selected_backers]

  let slice_number = data_sliced.length
  for (let s = 0; s < slice_number; s++) {
    let slice = data_sliced[s]
    let statuses_slice = sliced_statuses[s]
    let point_number = slice.coordinates.length

    let unselected_is = []
    let selected_is = []
    // Sort
    for (let st = 0; st < point_number; st++) {
      let status = statuses_slice[st]
      if (status === 0 || status === 2) {
        unselected_is.push(st)
      } else if (status === 1) {
        selected_is.push(st)
      }
    }

    // selected twice for backers
    // let groups = [unlabelled_is, labelled_is, selected_is]
    // let groups = [unselected_is, selected_is, selected_is]
    let groups = [unselected_is, selected_is]
    for (let g = 0; g < groups.length; g++) {
      let group = groups[g]
      let geometry = new THREE.BufferGeometry()

      // positions
      let positions = prepPositions(group.map(n => slice.coordinates[n]))

      // offsets
      let offsets = new Float32Array(group.length * 2)
      for (let i = 0, index = 0, l = group.length; i < l; i++, index += 2) {
        let loc_index = group[i]
        let x =
          ((loc_index % sprite_side) * sprite_image_size) / sprite_actual_size
        let y =
          (Math.floor(loc_index / sprite_side) * sprite_image_size) /
          sprite_actual_size
        offsets[index] = x
        offsets[index + 1] = y
      }

      // colors
      let color_prep = group.map(loc_index => {
        if (slice.statuses[loc_index] === 1) {
          // if (g === 2) {
          //   return [1, 1, 1]
          // } else {
          //  return [1, 1, 1]
          if (g === 1) {
            return [0.9, 0.9, 0.9]
          } else {
            return color_array[10].slice(0, 3)
          }

          // }
        } else {
          return status_to_color[slice.labels[loc_index]]
        }
      })
      let color_flattened = _.flatten(color_prep)
      let colors = new Float32Array(color_flattened)

      let texture_subsize = 1 / sprite_side

      let texture = textures[s]
      let repeat = [texture_subsize, texture_subsize]

      // if (g === 2) {
      //   offsets = offsets.map(o => 0)
      //   texture = circle_texture
      //   repeat = [1, 1]
      // }

      geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.addAttribute('offset', new THREE.BufferAttribute(offsets, 2))
      geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3))

      texture = circle_texture
      repeat = [1, 1]

      let uniforms = {
        texture: { value: texture },
        repeat: { value: new THREE.Vector2(...repeat) },
        size: { value: 2 },
      }

      if (g === 1) {
        uniforms.size.value = 7
      } else if (g === 2) {
        uniforms.size.value = 4
      }

      // if (g === 2) {
      //   uniforms.texture2 = {
      //     value: circle_texture,
      //   }
      // }

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

      // let fragment_shader = `
      //   uniform sampler2D texture;
      //   uniform vec2 repeat;
      //   varying vec2 vOffset;
      //   varying vec3 vColor;
      //   void main() {
      //     vec2 uv = vec2( gl_PointCoord.x, gl_PointCoord.y );
      //     vec4 tex = texture2D( texture, uv * repeat + vOffset );
      //     if ( tex.r < 0.5 ) discard;
      //     tex.r = 1.0;
      //     tex.g = 1.0;
      //     tex.b = 1.0;

      //     gl_FragColor = tex * vec4(vColor, 1.0);
      //   }`

      // if (g === 2) {
      //   fragment_shader = `
      //   uniform sampler2D texture;
      //   uniform sampler2D texture2;
      //   uniform vec2 repeat;
      //   varying vec2 vOffset;
      //   varying vec3 vColor;
      //   void main() {
      //     vec2 uv = vec2( gl_PointCoord.x, gl_PointCoord.y );
      //     vec4 tex = texture2D( texture, uv * repeat + vOffset );
      //     vec4 tex2 = texture2D( texture2, uv );
      //     // tex.r = min(tex.r, tex2.r)
      //     // tex.g = min(tex.g, tex2.g)
      //     // tex.b = min(tex.g, tex2.b)
      //     if ( tex2.r < 0.5 ) discard;
      //     tex2.r = 0.6;
      //     tex2.g = 0.6;
      //     tex2.b = 0.6;
      //     // if (tex.r > 0.5)
      //     // {
      //     //   tex2.r = 0.0;
      //     //   tex2.g = 0.0;
      //     //   tex2.b = 0.0;
      //     // }
      //     // else
      //     // {
      //     // }
      //     tex2.r = 0.8 - tex.r;
      //     tex2.g = 0.8 - tex.g;
      //     tex2.b = 0.8 - tex.b;
      //     gl_FragColor = tex2;
      //   }`
      // }

      let fragment_shader = `
        uniform sampler2D texture;
        uniform vec2 repeat;
        varying vec2 vOffset;
        varying vec3 vColor;
        void main() {
          vec2 uv = vec2( gl_PointCoord.x, gl_PointCoord.y );
          vec4 tex = texture2D( texture, uv * repeat );
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
      these_groups[g].add(point_cloud)
    }
  }
  return these_groups
}

class Projection extends Component {
  constructor(props) {
    super(props)
    this.state = {}
    this.init = this.init.bind(this)
    this.animate = this.animate.bind(this)
    this.addPoints = this.addPoints.bind(this)
    this.transitionPoints = this.transitionPoints.bind(this)
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
    let {
      strategies,
      strategy,
      loaded_embedding,
      embeddings,
      strategy_colors,
    } = this.props

    // split embeddings and labels into chunks to match sprites
    // load the textures
    let loader = new THREE.TextureLoader()
    this.textures = mnist_tile_locations.map(l => {
      let t = loader.load(l)
      t.flipY = false
      // t.magFilter = THREE.NearestFilter
      // t.minFilter = THREE.LinearMipMapLinearFilter;
      return t
    })
    let loaded = embeddings[loaded_embedding]
    let loaded_statuses = loaded.statuses.map(s => s)
    let loaded_sliced = ranges.map(range => sliceRound(loaded, range))
    let statuses_sliced = ranges.map(range =>
      loaded_statuses.slice(range[0], range[1])
    )

    let three_groups = createPointGroup(
      loaded_sliced,
      statuses_sliced,
      this.textures,
      chroma(strategy_colors[strategies.indexOf(strategy)])
        .gl()
        .slice(0, 3)
    )

    let parent_group = new THREE.Group()
    for (let group of three_groups) {
      parent_group.add(group)
    }
    this.scene.children[0] = parent_group
  }

  transitionPoints(prev_loaded_string) {
    let {
      loaded_embedding,
      embeddings,
      strategies,
      strategy,
      strategy_colors,
    } = this.props

    // tween points
    let loaded = embeddings[loaded_embedding]
    let prev_points = this.scene.children[0].children
    let loaded_sliced = ranges.map(range => sliceRound(loaded, range))
    let prev_statuses = embeddings[prev_loaded_string].statuses.map(s => s)
    let statuses_sliced = ranges.map(range =>
      prev_statuses.slice(range[0], range[1])
    )
    let loaded_points = createPointGroup(
      loaded_sliced,
      statuses_sliced,
      this.textures,
      chroma(strategy_colors[strategies.indexOf(strategy)])
        .gl()
        .slice(0, 3)
    )

    let textures = this.textures
    let scene = this.scene
    for (let g = 0; g < prev_points.length; g++) {
      let prev_group = prev_points[g]
      let loaded_group = loaded_points[g]

      if (g === 1) {
        // selected only
        for (let p = 0; p < prev_group.children.length; p++) {
          let points = this.scene.children[0].children[g].children[p]
          let position = prev_group.children[
            p
          ].geometry.attributes.color.array.slice()
          let target = loaded_group.children[p].geometry.attributes.color.array
          let color_tween = new TWEEN.Tween(position).to(target, 600)
          this.props.setTransitionStatus(1)
          let trans = this.props.setTransitionStatus
          color_tween
            .onUpdate(function() {
              points.geometry.attributes.color.array = position
              points.geometry.attributes.color.needsUpdate = true
            })
            .onComplete(function() {
              trans(2)
            })
          color_tween.start()

          let size_start = { value: 7 }
          let size_target = { value: 2 }
          let size_tween = new TWEEN.Tween(size_start).to(size_target, 400)
          size_tween
            .onUpdate(function() {
              points.material.uniforms.size = size_start
            })
            .onComplete(function() {})
          size_tween.delay(600 + 200 + 800 + 200)
          let addPoints = this.addPoints
          size_tween.onComplete(function() {
            addPoints()
          })
          size_tween.start()
        }
      }

      for (let p = 0; p < prev_group.children.length; p++) {
        let points = this.scene.children[0].children[g].children[p]
        let position = prev_group.children[
          p
        ].geometry.attributes.position.array.slice()
        let target = loaded_group.children[p].geometry.attributes.position.array
        let position_tween = new TWEEN.Tween(position).to(target, 800)
        position_tween.onUpdate(function() {
          points.geometry.attributes.position.array = position
          points.geometry.attributes.position.needsUpdate = true
        })
        position_tween.delay(600 + 200)
        position_tween.start()
      }
    }
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.loaded_embedding === null &&
      this.props.loaded_embedding !== null
    ) {
      // first load
      this.addPoints()
    } else if (prevProps.loaded_embedding !== this.props.loaded_embedding) {
      // embeddings have changed
      let prevd = decodeS(prevProps.loaded_embedding)
      let d = decodeS(this.props.loaded_embedding)
      if (prevd.dataset !== d.dataset) {
        // different dataset
        console.log('different dataset')
        this.addPoints()
      } else if (prevd.strategy !== d.strategy) {
        // new strategy, we should transition
        console.log('different strategy')
        this.transitionPoints(prevProps.loaded_embedding)
      } else if (prevd.round !== d.round) {
        console.log('different round')
        this.transitionPoints(prevProps.loaded_embedding)
      }
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
    this.renderer.setClearColor(0x222222, 1)
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
            position: 'absolute',
            left: grem,
            bottom: grem,
            display: 'flex',
          }}
        >
          {color_array_hexes.map((c, i) => (
            <div
              style={{
                background: color_array_hexes[i],
                width: grem,
                height: grem,
                textAlign: 'center',
                color: '#111',
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
