import * as THREE from 'three'
import gsap from 'gsap'

/* Expressions shown on the badge. `img` lives in /public/avatar. */
export const POSES = {
  smile:  { img: 'smile',  mood: 'Hello',    caption: 'Available for new projects' },
  calm:   { img: 'calm',   mood: 'Focused',  caption: 'Calm code, happy clients' },
  chef:   { img: 'chef',   mood: 'Perfect',  caption: 'Built just right, every time' },
  laugh:  { img: 'laugh',  mood: 'Excited',  caption: 'Every business is welcome' },
  love:   { img: 'love',   mood: 'Proud',    caption: 'Proud of these projects' },
  phew:   { img: 'phew',   mood: 'Relaxed',  caption: 'Smooth from call to launch' },
  selfie: { img: 'selfie', mood: 'Curious',  caption: 'Always shipping something new' },
  plead:  { img: 'plead',  mood: 'Listening', caption: 'Ask me anything' },
  wink:   { img: 'wink',   mood: 'Ready',    caption: "Let's build something" },
  tickle: { img: 'laugh',  mood: 'Ticklish', caption: 'Haha, that tickles!' },
  leave:  { img: 'plead',  mood: 'Sad',      caption: "Wait, don't go yet!" },
}

const C = { ink: '#0b0a09', ink2: '#14120f', ink3: '#1d1a16', bone: '#f3ecdf', muted: '#a39a8a', gold: '#e3cf9c', goldDeep: '#b89a5b', green: '#7ddc9a' }
const CARD_W = 1.5, CARD_H = 2.1, DEPTH = 0.035, CLIP_GAP = 0.16
const TEX_W = 1024, TEX_H = Math.round(TEX_W * CARD_H / CARD_W)

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath()
}

const images = {}
// badge expressions -> cut-out poses in /public/fasal
const FILE = { smile: 'smile', calm: 'cool', chef: 'point', laugh: 'laugh', love: 'kiss', phew: 'shrug', selfie: 'selfie', plead: 'surprised', wink: 'laugh' }
function loadImages() {
  const names = [...new Set(Object.values(POSES).map((p) => p.img))]
  return Promise.all(names.map((n) => new Promise((res) => {
    const im = new Image()
    im.onload = () => { images[n] = im; res() }
    im.onerror = res
    im.src = `/fasal/${FILE[n] || n}.png`
  })))
}

/* ---------- Card faces (2D canvas) ---------- */
const F = '"Poppins", "Segoe UI", sans-serif'
function drawFront(ctx, pose) {
  const W = TEX_W, H = TEX_H, pad = 70
  ctx.clearRect(0, 0, W, H)
  ctx.save()
  roundRect(ctx, 0, 0, W, H, 90); ctx.clip()
  ctx.fillStyle = '#fffaf0'; ctx.fillRect(0, 0, W, H)
  // sunny header band
  ctx.fillStyle = '#ffc93c'; ctx.fillRect(0, 0, W, 210)
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.arc(80 + i * 75, 210, 26, Math.PI, 0); ctx.fill() }
  ctx.fillStyle = '#14213d'; roundRect(ctx, W / 2 - 95, 40, 190, 36, 18); ctx.fill()
  ctx.font = `800 70px ${F}`; ctx.textBaseline = 'alphabetic'
  ctx.fillText('Fasal', pad, 172); const mw = ctx.measureText('Fasal').width
  ctx.fillStyle = '#ff6b6b'; ctx.fillText('.', pad + mw + 2, 172)
  ctx.fillStyle = '#14213d'; ctx.font = `700 30px ${F}`; ctx.textAlign = 'right'
  ctx.fillText('PORTFOLIO PASS', W - pad, 150); ctx.textAlign = 'left'

  // portrait window: bright sky with the avatar
  const wx = pad, wy = 250, ww = W - pad * 2, wh = 640
  ctx.save(); roundRect(ctx, wx, wy, ww, wh, 56); ctx.clip()
  const g = ctx.createLinearGradient(0, wy, 0, wy + wh)
  g.addColorStop(0, '#7cc8ff'); g.addColorStop(1, '#cdeeff')
  ctx.fillStyle = g; ctx.fillRect(wx, wy, ww, wh)
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ;[[wx + 120, wy + 110, 46], [wx + 180, wy + 95, 60], [wx + 245, wy + 115, 42], [wx + ww - 170, wy + 170, 40], [wx + ww - 120, wy + 155, 52]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill() })
  ctx.fillStyle = '#7cc957'; ctx.beginPath(); ctx.ellipse(W / 2, wy + wh + 60, ww * 0.75, 170, 0, 0, Math.PI * 2); ctx.fill()
  const im = images[pose.img]
  if (im) { let h = wh * 0.94, w = h * im.width / im.height; if (w > ww * 0.98) { w = ww * 0.98; h = w * im.height / im.width } ctx.drawImage(im, W / 2 - w / 2, wy + wh - h + 2, w, h) }
  ctx.restore()
  ctx.strokeStyle = '#14213d'; ctx.lineWidth = 10; roundRect(ctx, wx, wy, ww, wh, 56); ctx.stroke()

  // mood sticker
  ctx.font = `700 28px ${F}`
  const moodTxt = pose.mood.toUpperCase()
  const mwid = ctx.measureText(moodTxt).width + 56
  ctx.save(); ctx.translate(wx + ww - mwid - 10, wy + 30); ctx.rotate(0.06)
  ctx.fillStyle = '#ff6b6b'; roundRect(ctx, 0, 0, mwid, 60, 30); ctx.fill(); ctx.strokeStyle = '#14213d'; ctx.lineWidth = 6; ctx.stroke()
  ctx.fillStyle = '#ffffff'; ctx.fillText(moodTxt, 28, 41); ctx.restore()

  // name + role
  ctx.fillStyle = '#14213d'; ctx.font = `800 86px ${F}`
  ctx.fillText('Muhammed Fasal', pad, 1010)
  ctx.font = `600 34px ${F}`; ctx.fillStyle = '#e63946'
  ctx.fillText('Full-stack & AI Engineer', pad, 1062)

  // status pill
  ctx.fillStyle = '#d8f8e4'; roundRect(ctx, pad, 1110, W - pad * 2, 92, 46); ctx.fill()
  ctx.fillStyle = '#22b35e'; ctx.beginPath(); ctx.arc(pad + 46, 1156, 14, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#14213d'; ctx.font = `600 40px ${F}`
  ctx.fillText(pose.caption, pad + 80, 1170)

  // barcode + domain
  let x = pad; const rnd = mulberry(7)
  ctx.fillStyle = '#14213d'
  while (x < pad + 380) { const w = 3 + Math.floor(rnd() * 9); ctx.fillRect(x, 1250, w, 74); x += w + 4 + Math.floor(rnd() * 8) }
  ctx.font = `600 30px ${F}`; ctx.textAlign = 'right'
  ctx.fillText('fasalmuhammed.in', W - pad, 1282)
  ctx.fillStyle = '#5c677d'; ctx.fillText('Kozhikode · India', W - pad, 1320)
  ctx.textAlign = 'left'
  ctx.restore()
  // cartoon outline
  ctx.strokeStyle = '#14213d'; ctx.lineWidth = 18; roundRect(ctx, 9, 9, W - 18, H - 18, 82); ctx.stroke()
}

function drawBack(ctx) {
  const W = TEX_W, H = TEX_H, pad = 76
  ctx.clearRect(0, 0, W, H)
  ctx.save(); roundRect(ctx, 0, 0, W, H, 90); ctx.clip()
  ctx.fillStyle = '#ff6b6b'; ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc((i * 137) % W, (i * 251) % H, 30 + (i % 4) * 14, 0, Math.PI * 2); ctx.fill() }
  ctx.fillStyle = '#14213d'; roundRect(ctx, W / 2 - 95, 40, 190, 36, 18); ctx.fill()
  ctx.fillStyle = '#ffffff'; ctx.font = `800 200px ${F}`; ctx.fillText('Fasal.', pad - 10, 380)
  ctx.font = `800 96px ${F}`; ctx.fillText('Let’s build', pad, 560)
  ctx.fillStyle = '#ffc93c'; ctx.fillText('something!', pad, 668)
  const q = 300, qx = pad, qy = 800, cell = q / 21, r = mulberry(42)
  ctx.fillStyle = '#ffffff'; roundRect(ctx, qx - 20, qy - 20, q + 40, q + 40, 24); ctx.fill()
  ctx.fillStyle = '#14213d'
  for (let i = 0; i < 21; i++) for (let j = 0; j < 21; j++) {
    if ((i < 7 && j < 7) || (i > 13 && j < 7) || (i < 7 && j > 13)) continue
    if (r() > 0.52) ctx.fillRect(qx + i * cell, qy + j * cell, cell, cell)
  }
  ;[[0, 0], [14, 0], [0, 14]].forEach(([i, j]) => {
    ctx.fillStyle = '#14213d'; ctx.fillRect(qx + i * cell, qy + j * cell, cell * 7, cell * 7)
    ctx.fillStyle = '#ffffff'; ctx.fillRect(qx + (i + 1) * cell, qy + (j + 1) * cell, cell * 5, cell * 5)
    ctx.fillStyle = '#14213d'; ctx.fillRect(qx + (i + 2) * cell, qy + (j + 2) * cell, cell * 3, cell * 3)
  })
  ctx.fillStyle = '#ffffff'; ctx.font = `700 34px ${F}`
  ctx.fillText('fasalmuhammed.in', qx + q + 60, qy + 50)
  ctx.font = `500 30px ${F}`
  ctx.fillText('fasalmuhammed387', qx + q + 60, qy + 120); ctx.fillText('@gmail.com', qx + q + 60, qy + 160)
  ctx.font = `700 28px ${F}`; ctx.fillStyle = '#14213d'; ctx.fillText('DRAG ME · CLICK ME', qx + q + 60, qy + 270)
  ctx.restore()
  ctx.strokeStyle = '#14213d'; ctx.lineWidth = 18; roundRect(ctx, 9, 9, W - 18, H - 18, 82); ctx.stroke()
}

function drawStrap() {
  const c = document.createElement('canvas')
  c.width = 128; c.height = 1024
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#ff6b6b'; ctx.fillRect(0, 0, 128, 1024)
  ctx.fillStyle = '#14213d'; ctx.fillRect(0, 0, 10, 1024); ctx.fillRect(118, 0, 10, 1024)
  ctx.save(); ctx.translate(64, 0); ctx.rotate(Math.PI / 2)
  ctx.fillStyle = '#ffffff'; ctx.font = `800 58px ${F}`; ctx.textBaseline = 'middle'
  ctx.fillText('FASALMUHAMMED.IN ★ FASAL ★', 20, 0)
  ctx.restore()
  return c
}

function mulberry(a) { return () => { a |= 0; a = a + 0x6d2b79f5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }

/* ---------- Badge ---------- */
export function createBadge({ scene, renderer, state, view, reduced, isMobile, portraits }) {
  const aniso = renderer.capabilities.getMaxAnisotropy()
  const frontCanvas = document.createElement('canvas'); frontCanvas.width = TEX_W; frontCanvas.height = TEX_H
  const backCanvas = document.createElement('canvas'); backCanvas.width = TEX_W; backCanvas.height = TEX_H
  const fctx = frontCanvas.getContext('2d'), bctx = backCanvas.getContext('2d')
  const frontTex = new THREE.CanvasTexture(frontCanvas), backTex = new THREE.CanvasTexture(backCanvas)
  ;[frontTex, backTex].forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso })

  const faceMat = (map) => new THREE.MeshBasicMaterial({ map, transparent: true, alphaTest: 0.5, toneMapped: false })

  // card body
  const shape = new THREE.Shape()
  const r = 0.12, w = CARD_W, h = CARD_H
  shape.moveTo(-w / 2 + r, -h / 2); shape.lineTo(w / 2 - r, -h / 2); shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r)
  shape.lineTo(w / 2, h / 2 - r); shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); shape.lineTo(-w / 2 + r, h / 2)
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); shape.lineTo(-w / 2, -h / 2 + r); shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2)
  const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 3, curveSegments: 10 })
  bodyGeo.translate(0, 0, -DEPTH / 2)
  const body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color: 0x14213d, roughness: 0.5 }))
  const front = new THREE.Mesh(new THREE.PlaneGeometry(CARD_W - 0.004, CARD_H - 0.004), faceMat(frontTex))
  front.position.z = DEPTH / 2 + 0.0095
  const back = new THREE.Mesh(new THREE.PlaneGeometry(CARD_W - 0.004, CARD_H - 0.004), faceMat(backTex))
  back.rotation.y = Math.PI; back.position.z = -DEPTH / 2 - 0.0095

  // metal clip + ring at the top
  const metal = new THREE.MeshStandardMaterial({ color: 0xd9d4cc, metalness: 1, roughness: 0.22 })
  const clip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.05), metal)
  clip.position.y = CARD_H / 2 + 0.02
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.016, 12, 32), metal)
  ring.position.y = CARD_H / 2 + 0.11

  const inner = new THREE.Group(); inner.add(body, front, back, clip, ring)
  const card = new THREE.Group(); card.add(inner)
  scene.add(card)

  // lanyard strap (ribbon rebuilt every frame from the rope points)
  const N = 22
  const strapTex = new THREE.CanvasTexture(drawStrap())
  strapTex.wrapT = THREE.RepeatWrapping; strapTex.colorSpace = THREE.SRGBColorSpace; strapTex.anisotropy = aniso
  const strapGeo = new THREE.BufferGeometry()
  const sPos = new Float32Array(N * 2 * 3), sUv = new Float32Array(N * 2 * 2), idx = []
  for (let i = 0; i < N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2) }
  strapGeo.setIndex(idx)
  strapGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3))
  strapGeo.setAttribute('uv', new THREE.BufferAttribute(sUv, 2))
  const strap = new THREE.Mesh(strapGeo, new THREE.MeshStandardMaterial({
    map: strapTex, roughness: 0.7, side: THREE.DoubleSide, toneMapped: false,
  }))
  strap.frustumCulled = false
  scene.add(strap)

  // ---- Verlet rope
  const pts = Array.from({ length: N }, (_, i) => ({ x: 0, y: 3 - i * 0.1, z: 0, px: 0, py: 3 - i * 0.1, pz: 0 }))
  const anchorY = () => view.halfH + 0.6
  let seg = 0.1
  let dragging = false, dragTarget = new THREE.Vector3(), dragOffset = new THREE.Vector3()
  let initialised = false

  // ---- Faces + flip
  let current = 'smile', next = 'smile', flipping = false, override = null
  const spin = { v: 0 }
  let ready = false
  const fontsReady = Promise.all([
    document.fonts?.load('800 64px "Poppins"'), document.fonts?.load('700 30px "Poppins"'),
    document.fonts?.load('600 40px "Poppins"'), document.fonts?.load('500 30px "Poppins"'),
  ].filter(Boolean)).catch(() => {})
  Promise.all([loadImages(), fontsReady]).then(() => {
    drawFront(fctx, POSES[current]); drawBack(bctx)
    frontTex.needsUpdate = backTex.needsUpdate = true
    strap.material.map.image = drawStrap(); strap.material.map.needsUpdate = true
    ready = true
  })

  function show(key) {
    drawFront(fctx, POSES[key]); frontTex.needsUpdate = true; current = key
  }
  function flip() {
    if (reduced || !ready) { show(next); return }
    flipping = true
    let swapped = false
    gsap.to(spin, {
      v: spin.v + Math.PI * 2, duration: 1.15, ease: 'power3.inOut',
      onUpdate() { if (!swapped && this.progress() > 0.45) { swapped = true; show(next) } },
      onComplete() { flipping = false; if (next !== current) flip() },
    })
    // a little hop on the rope while it spins
    const last = pts[N - 1]
    last.py += 0.06
  }
  function setPose(key) {
    if (!POSES[key]) return
    if (override) { override.after = key; return }
    next = key
    if (!flipping && next !== current) flip()
  }
  function flash(key, ms = 2200) {
    if (override) return
    override = { after: next }
    next = key; if (!flipping) flip()
    setTimeout(() => { const a = override.after; override = null; setPose(a) }, ms)
  }

  // ---- Pointer: drag + click
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
  const hitMeshes = [body, front, back]
  let onHover = () => {}, hovering = false
  function bindPointer(camera) {
    const toNdc = (e) => ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
    const hit = (e) => { toNdc(e); ray.setFromCamera(ndc, camera); return ray.intersectObjects(hitMeshes, false).length > 0 }
    const worldAt = (e, out) => { toNdc(e); ray.setFromCamera(ndc, camera); ray.ray.intersectPlane(plane, out); return out }
    let downAt = null
    window.addEventListener('pointerdown', (e) => {
      if (e.target.closest('a, button, input, textarea, select, label, summary, .chat')) return
      if (!hit(e)) return
      downAt = { x: e.clientX, y: e.clientY }
      if (e.pointerType === 'mouse') {
        e.preventDefault()
        dragging = true
        const last = pts[N - 1]
        worldAt(e, dragTarget)
        dragOffset.set(last.x - dragTarget.x, last.y - dragTarget.y, 0)
        document.documentElement.classList.add('is-dragging')
      }
    }, { capture: true })
    window.addEventListener('pointermove', (e) => {
      if (dragging) { worldAt(e, dragTarget); return }
      if (e.pointerType !== 'mouse') return
      const h = hit(e)
      if (h !== hovering) { hovering = h; onHover(h) }
    }, { passive: true })
    window.addEventListener('pointerup', (e) => {
      if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 6) flash('tickle')
      downAt = null
      if (dragging) { dragging = false; document.documentElement.classList.remove('is-dragging') }
    })
    document.documentElement.addEventListener('mouseleave', (e) => { if (e.clientY <= 0) flash('leave', 2600) })
  }

  // ---- Per-frame physics + layout
  const tmp = new THREE.Vector3()
  let stepAcc = 0
  const H = 1 / 60
  let ax = null
  function step(t, velocity) {
    // the hook glides to its new spot so the card swings instead of whipping around
    const tx = state.x * view.halfW, ay = anchorY()
    ax = ax === null ? tx : ax + gsap.utils.clamp(-0.06, 0.06, (tx - ax) * 0.05)
    const clipY = state.y * view.halfH + (CARD_H / 2 + CLIP_GAP) * state.scale
    const targetSeg = Math.max(0.02, (ay - clipY) / (N - 1))
    if (!initialised) {
      seg = targetSeg
      pts.forEach((p, i) => { p.x = p.px = ax; p.y = p.py = ay - i * seg })
      initialised = true
    }
    seg += (targetSeg - seg) * 0.08

    const g = -22 * H * H
    const damp = 0.982
    const kick = gsap.utils.clamp(-60, 60, velocity)
    for (let i = 1; i < N; i++) {
      const p = pts[i]
      const vx = (p.x - p.px) * damp, vy = (p.y - p.py) * damp, vz = (p.z - p.pz) * damp
      p.px = p.x; p.py = p.y; p.pz = p.z
      const f = i / (N - 1)
      p.x += vx + Math.sin(t * 1.3 + i * 0.4) * 0.00035 * f            // gentle breeze
      p.y += vy + g + kick * 0.0009 * f                                  // scroll gives it a bounce
      p.z += vz - p.z * 0.02
    }
    if (dragging) {
      const last = pts[N - 1]
      last.x = dragTarget.x + dragOffset.x; last.y = dragTarget.y + dragOffset.y
    }
    pts[0].x = pts[0].px = ax; pts[0].y = pts[0].py = ay
    for (let k = 0; k < 18; k++) {
      for (let i = 0; i < N - 1; i++) {
        const a = pts[i], b = pts[i + 1]
        const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z
        const d = Math.hypot(dx, dy, dz) || 1e-6
        const diff = (d - seg) / d
        const wa = i === 0 ? 0 : 1
        const wb = i + 1 === N - 1 ? (dragging ? 0 : 0.35) : 1
        const sum = wa + wb || 1
        a.x += dx * diff * (wa / sum); a.y += dy * diff * (wa / sum); a.z += dz * diff * (wa / sum)
        b.x -= dx * diff * (wb / sum); b.y -= dy * diff * (wb / sum); b.z -= dz * diff * (wb / sum)
      }
    }
  }

  function update(dt, t, mouse, velocity) {
    // fixed 60 Hz physics steps, so slow devices don't play it in slow motion
    stepAcc = Math.min(stepAcc + dt, 0.25)
    let n = 0
    while (stepAcc >= H && n < 15) { step(t, velocity); stepAcc -= H; n++ }
    const s = state.scale

    // card hangs from the last point, tilted along the rope
    const L = pts[N - 1], P = pts[N - 3]
    const ang = Math.atan2(L.x - P.x, -(L.y - P.y))
    const off = (CARD_H / 2 + CLIP_GAP) * s
    card.position.set(L.x + Math.sin(ang) * off, L.y - Math.cos(ang) * off, L.z)
    card.rotation.z += (ang - card.rotation.z) * 0.5
    card.scale.setScalar(s)
    const swayVel = (L.x - L.px) * 14
    inner.rotation.y = spin.v + mouse.x * 0.35 + gsap.utils.clamp(-0.6, 0.6, swayVel) + Math.sin(t * 0.7) * 0.06
    inner.rotation.x = -mouse.y * 0.18

    // strap ribbon, twisting to meet the card's spin
    const width = 0.15 * Math.max(s, 0.55)
    let acc = 0
    const endTwist = inner.rotation.y - spin.v + Math.sin(spin.v) * 0.8
    for (let i = 0; i < N; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N - 1, i + 1)]
      tmp.set(b.x - a.x, b.y - a.y, b.z - a.z).normalize()
      const f = i / (N - 1)
      const tw = endTwist * f * f + Math.sin(t * 0.8 + i * 0.35) * 0.25 * (1 - f)
      const sx = tmp.y, sy = -tmp.x
      const cx = Math.cos(tw) * sx * width / 2, cy = Math.cos(tw) * sy * width / 2, cz = Math.sin(tw) * width / 2
      const p = pts[i]
      if (i > 0) acc += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y)
      sPos.set([p.x - cx, p.y - cy, p.z - cz, p.x + cx, p.y + cy, p.z + cz], i * 6)
      sUv.set([0, acc / 1.4, 1, acc / 1.4], i * 4)
    }
    strapGeo.attributes.position.needsUpdate = true
    strapGeo.attributes.uv.needsUpdate = true
    strapGeo.computeVertexNormals()
  }

  return {
    update, setPose, flash, bindPointer,
    get debug() { return { card: card.position.toArray(), scale: card.scale.x, seg, last: [pts[N - 1].x, pts[N - 1].y], visible: card.visible } },
    set onHover(fn) { onHover = fn },
  }
}
