import * as THREE from 'three'
import gsap from 'gsap'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { createBadge } from './badge.js'

/* ------------------------------------------------------------------
   The cartoon world. One long stage along +X; scrolling moves the
   camera through it: meadow -> island valley -> sky -> sunset -> snowy night.
------------------------------------------------------------------- */

const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
const mix = (a, b, t) => a + (b - a) * t
const rnd = (() => { let s = 7; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 } })()

export const ISLANDS = { x0: 55, gap: 9.5, count: 7 }
export const SNOW_FROM = 176

function terrainH(x, z) {
  const az = Math.abs(z - 0.6)
  const open = ss(2.2, 9, az)
  let h = 0.25 * Math.sin(x * 0.13 + 1.3) + 0.18 * Math.sin(x * 0.31)
  h += open * (1.1 * Math.sin(x * 0.09 + z * 0.17) + 0.7 * Math.sin(x * 0.05 - z * 0.11 + 2))
  const back = Math.max(0, -z - 16)
  h += back * 0.2 + Math.sin(x * 0.045 + z * 0.03) * back * 0.14
  const valley = ss(47.5, 52, x) * (1 - ss(113, 121, x))
  const keep = ss(-26, -40, z) // far mountains around the lake stay
  const v = valley * (1 - keep)
  return h * (1 - v) - 7 * v
}

/* ---------- sky ---------- */
const PHASES = [
  { top: '#4ea8ff', hor: '#d9f1ff', sun: '#fff1cf', sunI: 2.4, hemiS: '#d6ecff', hemiG: '#97cf6f', hemiI: 1.25, fog: '#cdeaff', dir: [0.35, 0.6, -1], cloud: '#ffffff', stars: 0 },
  { top: '#2f86f5', hor: '#c4e8ff', sun: '#ffffff', sunI: 2.6, hemiS: '#e0f2ff', hemiG: '#9fd27d', hemiI: 1.3, fog: '#c2e5ff', dir: [0, 0.85, -1], cloud: '#ffffff', stars: 0 },
  { top: '#4a4ea6', hor: '#ffb27a', sun: '#ff9d5c', sunI: 2.0, hemiS: '#ffc8a2', hemiG: '#7a7f8f', hemiI: 1.0, fog: '#f6b48f', dir: [-0.25, 0.1, -1], cloud: '#ffd3b8', stars: 0.15 },
  { top: '#0e1442', hor: '#3c418a', sun: '#a9c1ff', sunI: 0.9, hemiS: '#7383d6', hemiG: '#2c3256', hemiI: 0.85, fog: '#2f3474', dir: [0.3, 0.55, -1], cloud: '#8f97cb', stars: 1 },
  { top: '#06102e', hor: '#21507f', sun: '#cfe6ff', sunI: 1.0, hemiS: '#94b9ff', hemiG: '#d6e6ff', hemiI: 1.0, fog: '#1e426c', dir: [-0.3, 0.55, -1], cloud: '#a3b6db', stars: 1 },
].map((p) => ({ ...p, top: new THREE.Color(p.top), hor: new THREE.Color(p.hor), sun: new THREE.Color(p.sun), hemiS: new THREE.Color(p.hemiS), hemiG: new THREE.Color(p.hemiG), fog: new THREE.Color(p.fog), cloud: new THREE.Color(p.cloud), dir: new THREE.Vector3(...p.dir).normalize() }))

const skyVert = `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`
const skyFrag = `
uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uSun; uniform vec3 uSunDir;
varying vec3 vP;
void main(){
  vec3 d = normalize(vP);
  float h = d.y;
  vec3 col = mix(uHor, uTop, pow(clamp(h, 0.0, 1.0), 0.55));
  col = mix(col, uHor * 0.92, clamp(-h * 4.0, 0.0, 1.0));
  float s = max(dot(d, normalize(uSunDir)), 0.0);
  col += uSun * (pow(s, 28.0) * 0.55 + pow(s, 4.0) * 0.18);
  gl_FragColor = vec4(col, 1.0);
}`

const auroraVert = `
uniform float uTime; varying vec2 vUv;
void main(){
  vUv = uv; vec3 p = position;
  p.y += sin(p.x * 0.04 + uTime * 0.4) * 4.0;
  p.z += sin(p.x * 0.03 - uTime * 0.3) * 12.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`
const auroraFrag = `
uniform float uTime; uniform float uOpacity; varying vec2 vUv;
void main(){
  float band = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.45, vUv.y);
  float streak = 0.55 + 0.45 * sin(vUv.x * 90.0 + sin(vUv.x * 7.0 + uTime) * 3.0);
  float wave = 0.6 + 0.4 * sin(vUv.x * 9.0 + uTime * 0.6);
  vec3 col = mix(vec3(0.24, 1.0, 0.69), vec3(0.55, 0.36, 1.0), clamp(vUv.y * 1.2 + 0.2 * sin(vUv.x * 4.0 + uTime * 0.2), 0.0, 1.0));
  gl_FragColor = vec4(col, band * streak * wave * uOpacity * 0.75);
}`

/* ---------- toy-building kit ---------- */
const M = (c, r = 0.7, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...extra })
function box(g, w, h, d, c, x, y, z, r) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c, r)); m.position.set(x, y, z); g.add(m); return m }
function cyl(g, rt, rb, h, c, x, y, z, seg = 20) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), M(c)); m.position.set(x, y, z); g.add(m); return m }
function windows(g, cols, rows, w, h, x0, y0, z, c = '#9be7ff') { for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) box(g, w, h, 0.06, c, x0 + i * (w + 0.18), y0 + j * (h + 0.2), z, 0.2) }
function awning(g, w, x, y, z, c1, c2, n = 7) {
  for (let i = 0; i < n; i++) { const m = box(g, w / n, 0.06, 0.6, i % 2 ? c2 : c1, x - w / 2 + (i + 0.5) * (w / n), y, z); m.rotation.x = 0.45 }
}

const BUILD = [
  (g) => { // café
    box(g, 2.2, 1.4, 1.6, '#fff1d6', 0, 0.7, -0.9); box(g, 2.4, 0.18, 1.8, '#8d5a3b', 0, 1.48, -0.9)
    awning(g, 2.2, 0, 1.05, -0.02, '#ff6b6b', '#ffffff'); windows(g, 2, 1, 0.55, 0.45, -0.75, 0.55, -0.08); box(g, 0.45, 0.75, 0.06, '#8d5a3b', 0.65, 0.38, -0.08)
    cyl(g, 0.42, 0.34, 0.6, '#ffffff', 0, 1.9, -0.9); cyl(g, 0.38, 0.38, 0.04, '#6f4428', 0, 2.19, -0.9)
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.05, 10, 20), M('#ffffff')); h.position.set(0.45, 1.9, -0.9); g.add(h)
  },
  (g) => { // clinic
    box(g, 2.0, 1.9, 1.6, '#ffffff', 0, 0.95, -0.9); box(g, 2.15, 0.16, 1.75, '#2ec4b6', 0, 1.95, -0.9)
    windows(g, 3, 2, 0.42, 0.38, -0.6, 0.55, -0.08); box(g, 0.5, 0.8, 0.06, '#2ec4b6', 0, 0.4, -0.06)
    box(g, 0.75, 0.24, 0.12, '#ff4d6d', 0, 2.45, -0.9); box(g, 0.24, 0.75, 0.12, '#ff4d6d', 0, 2.45, -0.9)
  },
  (g) => { // fashion
    box(g, 2.0, 1.5, 1.6, '#ff8fab', 0, 0.75, -0.9); box(g, 2.15, 0.16, 1.75, '#ffffff', 0, 1.55, -0.9)
    awning(g, 2.0, 0, 1.15, -0.02, '#ff4d6d', '#ffe5ec'); box(g, 1.3, 0.7, 0.06, '#bde0fe', -0.2, 0.55, -0.08, 0.2)
    box(g, 0.7, 0.8, 0.2, '#ffc93c', 0, 2.1, -0.9); const sl = box(g, 0.35, 0.25, 0.2, '#ffc93c', -0.45, 2.38, -0.9); sl.rotation.z = 0.5; const sr = box(g, 0.35, 0.25, 0.2, '#ffc93c', 0.45, 2.38, -0.9); sr.rotation.z = -0.5
  },
  (g) => { // school
    box(g, 2.4, 1.4, 1.6, '#e76f51', 0, 0.7, -0.9); windows(g, 3, 1, 0.45, 0.45, -0.75, 0.75, -0.08, '#fff3b0')
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.75, 0.9, 4), M('#5c4033')); roof.rotation.y = Math.PI / 4; roof.position.set(0, 1.85, -0.9); roof.scale.z = 0.7; g.add(roof)
    box(g, 0.5, 0.6, 0.5, '#fff1d6', 0, 2.5, -0.9); const tip = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.5, 4), M('#ff6b6b')); tip.position.set(0, 3.05, -0.9); tip.rotation.y = Math.PI / 4; g.add(tip)
    cyl(g, 0.03, 0.03, 1.4, '#ffffff', 1.3, 2.0, -0.4, 8); box(g, 0.5, 0.3, 0.02, '#ffc93c', 1.56, 2.5, -0.4)
  },
  (g) => { // real estate
    box(g, 1.8, 1.3, 1.5, '#a0c4ff', 0, 0.65, -0.9)
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 1.8, 3), M('#ff6b6b')); roof.rotation.z = Math.PI / 2; roof.rotation.y = Math.PI / 2; roof.position.set(0, 1.65, -0.9); roof.scale.set(1, 1, 0.75); g.add(roof)
    box(g, 0.25, 0.6, 0.25, '#8d5a3b', 0.5, 2.0, -1.0); box(g, 0.45, 0.75, 0.06, '#ffc93c', 0, 0.38, -0.13); windows(g, 2, 1, 0.35, 0.35, -0.65, 0.75, -0.13, '#fffbe0')
    cyl(g, 0.03, 0.03, 0.9, '#ffffff', -1.25, 0.45, 0.2, 6); box(g, 0.6, 0.35, 0.04, '#ffffff', -1.25, 0.85, 0.2)
  },
  (g) => { // startup rocket
    cyl(g, 1.0, 1.1, 0.25, '#adb5bd', 0, 0.12, -0.9, 24)
    const r = new THREE.Group(); r.position.set(0, 0.3, -0.9); g.add(r); g.userData.rocket = r
    cyl(r, 0.42, 0.42, 1.7, '#ffffff', 0, 1.0, 0); const nose = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.75, 20), M('#ff4d6d')); nose.position.y = 2.22; r.add(nose)
    for (let i = 0; i < 3; i++) { const f = box(r, 0.08, 0.6, 0.5, '#ff4d6d', 0, 0.35, 0); f.rotation.y = (i * Math.PI * 2) / 3; f.position.set(Math.sin(f.rotation.y) * 0.45, 0.35, Math.cos(f.rotation.y) * 0.45) }
    const win = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.05, 10, 24), M('#4361ee')); win.position.set(0, 1.35, 0.42); r.add(win)
    const glass = new THREE.Mesh(new THREE.CircleGeometry(0.16, 20), M('#9be7ff', 0.1)); glass.position.set(0, 1.35, 0.43); r.add(glass)
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.8, 16), new THREE.MeshBasicMaterial({ color: '#ffb703' })); flame.rotation.x = Math.PI; flame.position.y = -0.25; r.add(flame); g.userData.flame = flame
  },
  (g) => { // salon & gym
    box(g, 2.0, 1.3, 1.6, '#9b5de5', 0, 0.65, -0.9); box(g, 2.15, 0.16, 1.75, '#ffc93c', 0, 1.36, -0.9)
    windows(g, 2, 1, 0.6, 0.5, -0.4, 0.6, -0.08, '#e0c3fc')
    const db = new THREE.Group(); db.position.set(0, 1.9, -0.9); g.add(db)
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.5, 10), M('#adb5bd', 0.3, { metalness: 0.6 })); bar.rotation.z = Math.PI / 2; db.add(bar)
    ;[-0.65, 0.65].forEach((x) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.22, 20), M('#22223b', 0.4)); p.rotation.z = Math.PI / 2; p.position.x = x; db.add(p) })
    g.userData.dumbbell = db
  },
]

export function createWorld(canvas, { reduced = false } = {}) {
  const isMobile = window.matchMedia('(max-width: 900px)').matches
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.6 : 1.8))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.autoClear = false
  const maxAniso = renderer.capabilities.getMaxAnisotropy()

  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0xcdeaff, 34, 150)
  const camera = new THREE.PerspectiveCamera(isMobile ? 52 : 38, 1, 0.1, 900)

  const state = {
    camX: 0, camY: 0, phase: 0, snow: 0, aurora: 0, fireworks: 0,
    charOff: -0.5, charScale: 1, air: 0, flyY: 0.15, drop: 14, islands: 0, ground: 0,
  }

  // ---- lights
  const hemi = new THREE.HemisphereLight(0xd6ecff, 0x97cf6f, 1.25); scene.add(hemi)
  const sun = new THREE.DirectionalLight(0xfff1cf, 2.4); scene.add(sun); scene.add(sun.target)
  const fill = new THREE.DirectionalLight(0xffffff, 1.3); scene.add(fill); scene.add(fill.target)

  // ---- sky dome, sun/moon, stars
  const skyU = { uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uSun: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3() } }
  const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), new THREE.ShaderMaterial({ vertexShader: skyVert, fragmentShader: skyFrag, uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false }))
  sky.renderOrder = -10
  scene.add(sky)
  const orb = new THREE.Mesh(new THREE.SphereGeometry(16, 32, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false, toneMapped: false }))
  scene.add(orb)
  const starGeo = new THREE.BufferGeometry(), starPos = []
  for (let i = 0; i < 900; i++) { const th = rnd() * Math.PI * 2, ph = rnd() * 1.3; starPos.push(Math.cos(th) * Math.sin(ph) * 500, Math.cos(ph) * 500 * 0.9 + 30, Math.sin(th) * Math.sin(ph) * 500) }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3))
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }))
  scene.add(stars)

  // ---- terrain
  const tGeo = new THREE.PlaneGeometry(330, 150, isMobile ? 220 : 330, isMobile ? 50 : 75)
  tGeo.rotateX(-Math.PI / 2); tGeo.translate(120, 0, -55)
  const tp = tGeo.attributes.position, colors = []
  const cGrass = new THREE.Color('#7cc957'), cGrass2 = new THREE.Color('#5fb14a'), cPath = new THREE.Color('#f0d39b'), cRock = new THREE.Color('#9aa57a')
  const cSnow = new THREE.Color('#f4f8ff'), cSnowPath = new THREE.Color('#dde8f8'), cSand = new THREE.Color('#e9d6a6'), cPeak = new THREE.Color('#ffffff'), tmpC = new THREE.Color()
  for (let i = 0; i < tp.count; i++) {
    const x = tp.getX(i), z = tp.getZ(i), h = terrainH(x, z)
    tp.setY(i, h)
    const az = Math.abs(z - 0.6)
    tmpC.copy(cGrass).lerp(cGrass2, 0.5 + 0.5 * Math.sin(x * 0.7 + z * 0.9))
    if (h < -4) tmpC.copy(cSand)
    if (az < 1.5 && h > -2) tmpC.lerp(cPath, 0.9)
    if (h > 6) tmpC.lerp(cRock, ss(6, 10, h))
    if (h > 11) tmpC.lerp(cPeak, ss(11, 14, h))
    const snow = ss(SNOW_FROM - 6, SNOW_FROM + 6, x)
    if (snow > 0) tmpC.lerp(az < 1.5 ? cSnowPath : cSnow, snow)
    colors.push(tmpC.r, tmpC.g, tmpC.b)
  }
  tGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  tGeo.computeVertexNormals()
  scene.add(new THREE.Mesh(tGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 })))

  // lake under the islands
  const water = new THREE.Mesh(new THREE.PlaneGeometry(95, 80), new THREE.MeshStandardMaterial({ color: '#36c0f2', roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.93 }))
  water.rotation.x = -Math.PI / 2; water.position.set(83, -3.4, -20); scene.add(water)

  // ---- trees (instanced)
  const trees = []
  for (let i = 0; i < (isMobile ? 260 : 420); i++) {
    const front = i % 9 === 0
    const x = -35 + rnd() * 300, z = front ? 4 + rnd() * 5 : -4.5 - Math.pow(rnd(), 1.3) * 60
    const h = terrainH(x, z)
    if (h < -2.5) continue
    if (front && x > 40 && x < 125) continue
    const snowy = x > SNOW_FROM - 4
    trees.push({ x, z, h, s: 0.7 + rnd() * 0.9, pine: snowy || rnd() < 0.35, snowy, hue: rnd() })
  }
  const roundT = trees.filter((t) => !t.pine), pineT = trees.filter((t) => t.pine)
  const dummy = new THREE.Object3D()
  const canopy = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), M('#ffffff', 0.85), roundT.length)
  const pineGeo = mergeGeometries([new THREE.ConeGeometry(1.0, 1.4, 10).translate(0, 0.7, 0), new THREE.ConeGeometry(0.8, 1.2, 10).translate(0, 1.4, 0), new THREE.ConeGeometry(0.55, 1.0, 10).translate(0, 2.1, 0)])
  const pines = new THREE.InstancedMesh(pineGeo, M('#ffffff', 0.85), pineT.length)
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.14, 0.2, 1, 8).translate(0, 0.5, 0), M('#8d5a3b'), trees.length)
  const greens = ['#4caf50', '#66bb6a', '#81c784', '#43a047', '#ffb3c6', '#ffd166'].map((c) => new THREE.Color(c))
  roundT.forEach((t, i) => {
    dummy.position.set(t.x, t.h + 1.5 * t.s, t.z); dummy.scale.set(t.s, t.s * 1.1, t.s); dummy.rotation.set(0, t.hue * 6, 0); dummy.updateMatrix()
    canopy.setMatrixAt(i, dummy.matrix); canopy.setColorAt(i, greens[Math.floor(t.hue * (t.hue > 0.85 ? 6 : 4))])
  })
  pineT.forEach((t, i) => {
    dummy.position.set(t.x, t.h + 0.6 * t.s, t.z); dummy.scale.setScalar(t.s); dummy.rotation.set(0, 0, 0); dummy.updateMatrix()
    pines.setMatrixAt(i, dummy.matrix); pines.setColorAt(i, tmpC.set(t.snowy ? (t.hue > 0.5 ? '#e8f1ff' : '#3f7d5c') : '#2e7d4f'))
  })
  trees.forEach((t, i) => { dummy.position.set(t.x, t.h, t.z); dummy.scale.set(t.s, t.s * (t.pine ? 0.7 : 1.1), t.s); dummy.updateMatrix(); trunks.setMatrixAt(i, dummy.matrix) })
  scene.add(canopy, pines, trunks)

  // flowers along the path
  const flowerSpots = []
  for (let i = 0; i < 420; i++) {
    const x = -20 + rnd() * 200, side = rnd() < 0.5 ? -1 : 1, z = 0.6 + side * (1.7 + rnd() * 3)
    if ((x > 43 && x < 122) || x > SNOW_FROM - 8) continue
    flowerSpots.push([x, z])
  }
  const flowers = new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 8, 6), M('#ffffff', 0.5), flowerSpots.length)
  const fCols = ['#ff6b6b', '#ffd166', '#ffffff', '#c77dff', '#ff9ebb'].map((c) => new THREE.Color(c))
  flowerSpots.forEach(([x, z], i) => { dummy.position.set(x, terrainH(x, z) + 0.12, z); dummy.scale.setScalar(0.7 + rnd()); dummy.updateMatrix(); flowers.setMatrixAt(i, dummy.matrix); flowers.setColorAt(i, fCols[i % 5]) })
  scene.add(flowers)

  // ---- clouds
  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.7, fog: false })
  const cloudGeos = [0, 1, 2, 3].map(() => {
    const parts = []
    const n = 5 + Math.floor(rnd() * 3)
    for (let i = 0; i < n; i++) { const r = 0.7 + rnd() * 0.8; parts.push(new THREE.IcosahedronGeometry(r, 3).translate((i - n / 2) * 0.9 + rnd() * 0.3, rnd() * 0.5 + (r - 0.7) * 0.4, rnd() * 0.6)) }
    return mergeGeometries(parts)
  })
  const clouds = []
  const addCloud = (x, y, z, s) => { const m = new THREE.Mesh(cloudGeos[clouds.length % 4], cloudMat); m.position.set(x, y, z); m.scale.set(s, s * 0.8, s * 0.7); m.userData = { y, sp: 0.2 + rnd() * 0.4 }; scene.add(m); clouds.push(m) }
  for (let i = 0; i < 46; i++) addCloud(-40 + rnd() * 320, 9 + rnd() * 14, -25 - rnd() * 70, 2 + rnd() * 3.5)
  for (let i = 0; i < 14; i++) addCloud(110 + rnd() * 36, 9 + rnd() * 9, -16 - rnd() * 20, 1.2 + rnd() * 1.6) // sky section
  for (let i = 0; i < 4; i++) addCloud(116 + i * 7 + rnd() * 2, 6 + rnd() * 2, 4 + rnd() * 2, 0.6 + rnd() * 0.3) // fly-by below
  for (let i = 0; i < 6; i++) addCloud(130 + i * 4.5, 15 + rnd() * 1.5, -14 - rnd() * 6, 1.6 + rnd()) // behind the flight

  // ---- floating islands with toy buildings
  const islands = []
  for (let i = 0; i < ISLANDS.count; i++) {
    const g = new THREE.Group()
    const rock = new THREE.Mesh(new THREE.ConeGeometry(2.3, 3.4, 9), new THREE.MeshStandardMaterial({ color: '#a47f5f', roughness: 1, flatShading: true }))
    rock.rotation.x = Math.PI; rock.position.y = -2.1; g.add(rock)
    cyl(g, 2.3, 2.25, 0.35, '#8d6e4f', 0, -0.55, 0, 24)
    cyl(g, 2.45, 2.32, 0.42, '#7cc957', 0, -0.21, 0, 28)
    for (let k = 0; k < 6; k++) { const a = k * 1.1 + i, f = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), M(fCols[(k + i) % 5].getStyle())); f.position.set(Math.cos(a) * 1.8, 0.05, Math.sin(a) * 1.2 + 0.4); g.add(f) }
    const b = new THREE.Group(); b.scale.setScalar(1.05); g.add(b); BUILD[i](b)
    g.userData = { base: 1.0 + (i % 2) * 0.9, b }
    g.position.set(ISLANDS.x0 + i * ISLANDS.gap, 0, 0.1)
    scene.add(g); islands.push(g)
  }
  const islandTop = (i, t) => islands[i].userData.base + Math.sin(t * 0.8 + i * 1.7) * 0.12

  // ground height for the character, including jumps between islands
  function groundAt(x, t) {
    const { x0, gap, count } = ISLANDS
    const first = x0 - gap, last = x0 + (count - 1) * gap
    if (x < first + gap * 0.3 || x > last + gap * 0.7) return terrainH(x, 0.6)
    const k = Math.floor((x - first) / gap) // 0 = cliff, 1..count = islands
    const xa = first + k * gap
    const top = (j) => (j === 0 ? terrainH(first, 0.6) : j > count ? terrainH(last + gap, 0.6) : islandTop(j - 1, t))
    const u = (x - xa) / gap
    if (u < 0.3) return top(k)
    if (u > 0.7) return top(k + 1)
    const s = (u - 0.3) / 0.4
    return { y: mix(top(k), top(k + 1), s) + 4 * 2.4 * s * (1 - s), air: true }
  }

  // ---- aurora, snow, fireworks
  const auroraU = { uTime: { value: 0 }, uOpacity: { value: 0 } }
  const aurora = new THREE.Mesh(new THREE.PlaneGeometry(260, 46, 120, 1), new THREE.ShaderMaterial({ vertexShader: auroraVert, fragmentShader: auroraFrag, uniforms: auroraU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }))
  aurora.position.set(0, 52, -170); scene.add(aurora)

  const SN = isMobile ? 900 : 1800
  const snowPos = new Float32Array(SN * 3), snowSeed = new Float32Array(SN)
  for (let i = 0; i < SN; i++) { snowPos.set([rnd() * 60 - 30, rnd() * 24 - 4, rnd() * 34 - 22], i * 3); snowSeed[i] = rnd() }
  const snowGeo = new THREE.BufferGeometry(); snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3))
  const sc = document.createElement('canvas'); sc.width = sc.height = 32; const sx = sc.getContext('2d'); const sg = sx.createRadialGradient(16, 16, 0, 16, 16, 16); sg.addColorStop(0, 'rgba(255,255,255,1)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); sx.fillStyle = sg; sx.fillRect(0, 0, 32, 32)
  const dotTex = new THREE.CanvasTexture(sc)
  const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ size: 0.22, map: dotTex, transparent: true, opacity: 0, depthWrite: false }))
  snow.frustumCulled = false; scene.add(snow)

  const FW = 4, FP = 110
  const fwPos = new Float32Array(FW * FP * 3), fwCol = new Float32Array(FW * FP * 3)
  const fwGeo = new THREE.BufferGeometry(); fwGeo.setAttribute('position', new THREE.BufferAttribute(fwPos, 3)); fwGeo.setAttribute('color', new THREE.BufferAttribute(fwCol, 3))
  const fwMat = new THREE.PointsMaterial({ size: 0.4, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 1 })
  const fireworks = new THREE.Points(fwGeo, fwMat); fireworks.frustumCulled = false; scene.add(fireworks)
  const bursts = Array.from({ length: FW }, () => ({ age: 99, o: new THREE.Vector3(), dirs: Array.from({ length: FP }, () => new THREE.Vector3().randomDirection().multiplyScalar(0.6 + rnd() * 0.6)), c: new THREE.Color() }))
  const fwPalette = ['#ffd166', '#ff6b6b', '#4cc9f0', '#c77dff', '#80ffdb'].map((c) => new THREE.Color(c))
  let fwTimer = 0, fwNext = 0

  // ---- the character anchor: the real (image) Fasal is drawn in the DOM at this point's screen position
  const hero = new THREE.Object3D(); scene.add(hero)
  const shc = document.createElement('canvas'); shc.width = shc.height = 128
  const shx = shc.getContext('2d'); const shg = shx.createRadialGradient(64, 64, 4, 64, 64, 62)
  shg.addColorStop(0, 'rgba(20,33,61,0.55)'); shg.addColorStop(1, 'rgba(20,33,61,0)'); shx.fillStyle = shg; shx.fillRect(0, 0, 128, 128)
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.9), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shc), transparent: true, depthWrite: false }))
  shadow.rotation.x = -Math.PI / 2; scene.add(shadow)
  let airborne = false

  // ---- the ID badge lives in its own overlay scene (hero only)
  const badgeScene = new THREE.Scene()
  const badgeCam = new THREE.PerspectiveCamera(45, 1, 0.1, 100); badgeCam.position.set(0, 0, 6)
  badgeScene.add(new THREE.AmbientLight(0xffffff, 1.2))
  const bl = new THREE.DirectionalLight(0xffffff, 1.6); bl.position.set(2, 3, 5); badgeScene.add(bl)
  const bView = { halfW: 4, halfH: 2.5 }
  const bHome = isMobile ? { x: 0.42, y: 0.46, scale: 0.62 } : { x: 0.6, y: 0.02, scale: 1.15 }
  const badgeState = { ...bHome }
  if (!reduced) badgeState.y = 2.2
  const badge = createBadge({ scene: badgeScene, renderer, state: badgeState, view: bView, reduced, isMobile })
  badge.bindPointer(badgeCam)

  // ---- input
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 }
  window.addEventListener('pointermove', (e) => { mouse.tx = (e.clientX / innerWidth) * 2 - 1; mouse.ty = -((e.clientY / innerHeight) * 2 - 1) }, { passive: true })

  let halfW = 8, halfH = 4.5
  const lookOffset = isMobile ? -1.6 : 0 // phones: aim lower so Fasal stands above the content panels
  function resize() {
    const w = innerWidth, h = innerHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h; camera.updateProjectionMatrix()
    badgeCam.aspect = w / h; badgeCam.updateProjectionMatrix()
    halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (13 - 0.6)
    halfW = halfH * camera.aspect
    bView.halfH = Math.tan(THREE.MathUtils.degToRad(badgeCam.fov / 2)) * 6
    bView.halfW = bView.halfH * badgeCam.aspect
  }
  resize(); addEventListener('resize', resize)

  // ---- frame loop
  const timer = new THREE.Timer()
  const pa = new THREE.Color(), dirV = new THREE.Vector3()
  let prevCamX = state.camX, speed = 0, velocity = 0, running = true
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) { timer.reset(); tick() } })

  function applyPhase(p) {
    const i = Math.min(PHASES.length - 2, Math.floor(p)), f = p - i
    const A = PHASES[i], B = PHASES[i + 1]
    skyU.uTop.value.lerpColors(A.top, B.top, f)
    skyU.uHor.value.lerpColors(A.hor, B.hor, f)
    skyU.uSun.value.lerpColors(A.sun, B.sun, f)
    dirV.lerpVectors(A.dir, B.dir, f).normalize(); skyU.uSunDir.value.copy(dirV)
    scene.fog.color.lerpColors(A.fog, B.fog, f)
    hemi.color.lerpColors(A.hemiS, B.hemiS, f); hemi.groundColor.lerpColors(A.hemiG, B.hemiG, f); hemi.intensity = mix(A.hemiI, B.hemiI, f)
    sun.color.lerpColors(A.sun, B.sun, f); sun.intensity = mix(A.sunI, B.sunI, f)
    pa.lerpColors(A.cloud, B.cloud, f); cloudMat.color.copy(pa); cloudMat.emissive.copy(pa).multiplyScalar(0.75)
    stars.material.opacity = mix(A.stars, B.stars, f)
    orb.material.color.lerpColors(A.sun, B.sun, f)
  }

  function tick() {
    if (!running) return
    timer.update()
    const raw = Math.min(timer.getDelta(), 0.25), dt = Math.min(raw, 1 / 30), t = timer.getElapsed()
    mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05
    velocity *= 0.9

    applyPhase(state.phase)

    // camera rail
    const cx = state.camX
    camera.position.set(cx + mouse.x * 0.5, 3.2 + state.camY + mouse.y * 0.3, 13)
    camera.lookAt(cx, 1.7 + state.camY + lookOffset, 0)
    sky.position.copy(camera.position)
    orb.position.copy(camera.position).addScaledVector(dirV, 420)
    stars.position.copy(camera.position)
    sun.position.copy(camera.position).addScaledVector(dirV, 50); sun.target.position.set(cx, 0, 0)
    aurora.position.x = cx; auroraU.uTime.value = t; auroraU.uOpacity.value = state.aurora

    // character placement
    const dx = cx - prevCamX; prevCamX = cx
    speed += (Math.abs(dx) / Math.max(dt, 1e-3) - speed) * 0.15
    const charX = cx + state.charOff * halfW
    const g = state.islands > 0.5 ? groundAt(charX, t) : terrainH(charX, 0.6)
    const groundY = typeof g === 'number' ? g : g.y
    airborne = typeof g === 'object'
    const flyY = 1.7 + state.camY + lookOffset + state.flyY * halfH
    hero.position.set(charX, mix(groundY, flyY, state.air) + state.drop, 0.6)
    const hAbove = Math.max(0, hero.position.y - groundY)
    shadow.visible = state.ground > 0.5 && state.air < 0.5
    shadow.position.set(charX, groundY + 0.04, 0.6)
    shadow.scale.setScalar(state.charScale * Math.max(0.35, 1 - hAbove * 0.12))
    shadow.material.opacity = Math.max(0, 1 - hAbove * 0.15)

    // islands bob, rocket flame, spinning dumbbell
    islands.forEach((isl, i) => {
      isl.position.y = islandTop(i, t)
      const u = isl.userData.b.userData
      if (u.flame) { u.flame.scale.set(1, 0.8 + Math.sin(t * 30) * 0.25, 1); u.rocket.position.y = 0.3 + Math.abs(Math.sin(t * 2)) * 0.08 }
      if (u.dumbbell) u.dumbbell.rotation.x = t * 1.5
    })
    clouds.forEach((c, i) => { c.position.y = c.userData.y + Math.sin(t * c.userData.sp + i) * 0.3 })

    // snow
    if (state.snow > 0.01) {
      snow.material.opacity = state.snow
      for (let i = 0; i < SN; i++) {
        let y = snowPos[i * 3 + 1] - dt * (0.8 + snowSeed[i] * 1.2)
        if (y < -4) y += 24
        snowPos[i * 3 + 1] = y
        snowPos[i * 3] += Math.sin(t + snowSeed[i] * 20) * dt * 0.3
      }
      snowGeo.attributes.position.needsUpdate = true
      snow.position.set(cx, state.camY, 0)
      snow.visible = true
    } else snow.visible = false

    // fireworks
    fireworks.visible = state.fireworks > 0.01
    if (fireworks.visible) {
      fwTimer += dt
      if (fwTimer > fwNext) {
        fwTimer = 0; fwNext = 0.5 + rnd() * 0.8
        const b = bursts.reduce((a, c) => (c.age > a.age ? c : a))
        b.age = 0; b.o.set(cx + (rnd() * 2 - 1) * halfW * 0.9, 6 + state.camY + rnd() * 5, -8 - rnd() * 6); b.c.copy(fwPalette[Math.floor(rnd() * 5)])
      }
      bursts.forEach((b, k) => {
        b.age += dt
        const life = Math.max(0, 1 - b.age / 1.8), e = 1 - Math.pow(1 - Math.min(1, b.age / 1.2), 3)
        for (let i = 0; i < FP; i++) {
          const d = b.dirs[i], j = (k * FP + i) * 3
          fwPos[j] = b.o.x + d.x * e * 4.5; fwPos[j + 1] = b.o.y + d.y * e * 4.5 - b.age * b.age * 0.8; fwPos[j + 2] = b.o.z + d.z * e * 4.5
          fwCol[j] = b.c.r * life * state.fireworks; fwCol[j + 1] = b.c.g * life * state.fireworks; fwCol[j + 2] = b.c.b * life * state.fireworks
        }
      })
      fwGeo.attributes.position.needsUpdate = true; fwGeo.attributes.color.needsUpdate = true
    }

    renderer.clear()
    renderer.render(scene, camera)
    if (badgeState.y < 2.1) {
      badge.update(raw, t, mouse, velocity)
      renderer.clearDepth()
      renderer.render(badgeScene, badgeCam)
    }
    requestAnimationFrame(tick)
  }
  tick()

  const hv = new THREE.Vector3()
  return {
    state, badgeState, badge, isMobile,
    get airborne() { return airborne },
    get speed() { return speed },
    // screen position of the feet + pixels per world unit at that depth
    actorScreen() {
      hv.copy(hero.position).project(camera)
      const x = (hv.x * 0.5 + 0.5) * innerWidth, y = (-hv.y * 0.5 + 0.5) * innerHeight
      hv.copy(hero.position); hv.y += 1; hv.project(camera)
      return { x, y, ppu: Math.abs((-hv.y * 0.5 + 0.5) * innerHeight - y) }
    },
    setVelocity(v) { velocity = v },
    playIntro() { if (!reduced) gsap.to(badgeState, { y: bHome.y, duration: 1.6, ease: 'power2.out' }) },
    badgeHome: bHome,
    get halfW() { return halfW },
  }
}
