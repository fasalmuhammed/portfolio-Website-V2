import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/* The real Fasal (cut-out renders in /public/fasal) acting through the page.
   - "ground" poses stand on the 3D world: placed every frame at the world anchor's screen position.
   - "bust" poses rise from the bottom of the screen beside the content (desktop),
     or peek over the top edge of the section's panel (phones). */

const POSES = ['stand', 'walk', 'sit', 'smile', 'kiss', 'laugh', 'surprised', 'cool', 'selfie', 'point', 'think', 'shrug', 'laptop', 'cheer']
const src = (p) => `/fasal/${p}.png`

// world-unit heights for full-body poses (matches the scale of the 3D world)
const GROUND_H = { stand: 3.4, walk: 3.3, sit: 2.25 }

export const SCENES = [
  { sel: '#hero', mode: 'none' },
  { sel: '#about', mode: 'ground', pose: 'stand' },
  { sel: '#services', mode: 'bust', pose: 'point', side: 'right', flip: true },
  { sel: '#industries', mode: 'ground', pose: 'walk', pinned: true },
  { sel: '#work', mode: 'bust', pose: 'laptop', side: 'right' },
  { sel: '#process', mode: 'ground', pose: 'sit' },
  { sel: '#stack', mode: 'bust', pose: 'cool', side: 'right' },
  { sel: '#faq', mode: 'bust', pose: 'think', side: 'left' },
  { sel: '#contact', mode: 'bust', pose: 'cheer', side: 'right' },
]
const REACTIONS = ['laugh', 'kiss', 'selfie', 'surprised', 'smile']

function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild }

export function createActor({ W, isMobile, reduced }) {
  POSES.forEach((p) => { const i = new Image(); i.src = src(p) })

  const ground = el(`<div class="actor actor--ground" aria-hidden="true"><div class="actor__in"><img alt="" draggable="false"></div></div>`)
  const bust = el(`<div class="actor actor--bust" aria-hidden="true"><div class="actor__in"><img alt="" draggable="false"></div></div>`)
  document.body.append(ground, bust)
  const gIn = ground.firstChild, gImg = gIn.firstChild
  const bIn = bust.firstChild, bImg = bIn.firstChild
  gsap.set([gIn], { scale: 0, transformOrigin: '50% 100%' })
  gsap.set(bIn, { yPercent: 115, transformOrigin: '50% 100%' })

  let scene = SCENES[0], groundOn = false, bustOn = false, bustPose = null, override = null
  let lastCamX = W.state.camX, phase = 0, dir = 1, wasAir = false, prevDrop = W.state.drop

  /* ---------- ground figure ---------- */
  function showGround(pose) {
    gImg.src = src(pose)
    ground.dataset.pose = pose
    if (!groundOn) gsap.to(gIn, { scale: 1, duration: 0.7, ease: 'back.out(2)', overwrite: true })
    else squash(gIn)
    groundOn = true
  }
  function hideGround() {
    if (!groundOn) return
    groundOn = false
    gsap.to(gIn, { scale: 0, duration: 0.35, ease: 'back.in(2)', overwrite: true })
  }
  function squash(node, amt = 0.86) {
    gsap.timeline({ overwrite: true })
      .to(node, { scaleY: amt, scaleX: 2 - amt, duration: 0.09, ease: 'power2.out' })
      .to(node, { scaleY: 1, scaleX: 1, duration: 0.7, ease: 'elastic.out(1, 0.35)' })
  }

  /* ---------- bust figure ---------- */
  function placeBust(cfg) {
    if (isMobile) {
      // peek over the top edge of this section's panel
      const panel = document.querySelector(`${cfg.sel} .panel`)
      if (panel && bust.parentElement !== panel) panel.prepend(bust)
      bust.classList.add('is-peek')
    } else {
      if (bust.parentElement !== document.body) document.body.append(bust)
      bust.classList.toggle('is-left', cfg.side === 'left')
      bust.classList.toggle('is-right', cfg.side !== 'left')
    }
    bImg.style.transform = cfg.flip ? 'scaleX(-1)' : ''
  }
  function showBust(cfg) {
    const enter = () => {
      placeBust(cfg)
      bImg.src = src(cfg.pose); bustPose = cfg.pose
      gsap.fromTo(bIn, { yPercent: 115, rotate: cfg.side === 'left' ? -8 : 8 }, { yPercent: 0, rotate: 0, duration: 0.9, ease: 'back.out(1.6)', overwrite: true })
      bustOn = true
    }
    if (bustOn) gsap.to(bIn, { yPercent: 115, duration: 0.3, ease: 'power2.in', overwrite: true, onComplete: enter })
    else enter()
  }
  function hideBust() {
    if (!bustOn) return
    bustOn = false
    gsap.to(bIn, { yPercent: 115, duration: 0.4, ease: 'power2.in', overwrite: true })
  }
  // swap to a reaction pose for a moment
  function react(pose, ms = 1600) {
    if (!bustOn || reduced) return
    const back = scene.pose
    clearTimeout(override)
    gsap.timeline()
      .to(bIn, { scaleY: 0.9, scaleX: 1.06, duration: 0.08 })
      .call(() => { bImg.src = src(pose) })
      .to(bIn, { scaleY: 1, scaleX: 1, duration: 0.8, ease: 'elastic.out(1, 0.35)' })
    override = setTimeout(() => {
      if (bustOn && scene.pose === back) { bImg.src = src(back); squash(bIn, 0.94) }
    }, ms)
  }

  function setScene(cfg) {
    if (cfg === scene) return
    scene = cfg
    clearTimeout(override)
    if (cfg.mode === 'ground') { hideBust(); showGround(cfg.pose) }
    else if (cfg.mode === 'bust') { hideGround(); showBust(cfg) }
    else { hideGround(); hideBust() }
  }
  SCENES.forEach((cfg) => {
    ScrollTrigger.create({
      trigger: cfg.sel, start: 'top 55%',
      // a pinned section scrolls for several screens while its element stays 100vh tall
      end: cfg.pinned ? () => '+=' + innerHeight * ((isMobile ? 3 : 4) + 0.5) : 'bottom 45%',
      invalidateOnRefresh: true,
      onToggle: (st) => { if (st.isActive) setScene(cfg) },
    })
  })

  /* ---------- per-frame motion ---------- */
  const mouse = { x: 0, y: 0 }
  addEventListener('pointermove', (e) => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5 }, { passive: true })
  let head = { x: 0, y: 0 }

  gsap.ticker.add((time) => {
    const S = W.state
    const dx = S.camX - lastCamX; lastCamX = S.camX
    if (Math.abs(dx) > 0.002) dir = dx > 0 ? 1 : -1

    if (groundOn || gsap.getProperty(gIn, 'scaleX') > 0.01) {
      const p = W.actorScreen()
      const pose = ground.dataset.pose || 'stand'
      const h = p.ppu * (GROUND_H[pose] || 3.3) * S.charScale
      let bob = 0, rot = 0, flip = 1

      if (pose === 'walk') {
        phase += Math.abs(dx) * 2.4
        flip = dir
        if (W.airborne) { rot = 8 * dir; bob = 0 }
        else { bob = Math.abs(Math.sin(phase)) * h * 0.035; rot = Math.sin(phase) * 2 }
        if (wasAir && !W.airborne) squash(gIn, 0.88)
        wasAir = W.airborne
      } else if (pose === 'stand') {
        if (S.drop > 0.3) rot = Math.sin(time * 14) * 6          // flailing on the way down
        else rot = Math.sin(time * 1.6) * 1.2
        if (prevDrop > 0.3 && S.drop <= 0.3) squash(gIn, 0.8)    // landing
      } else if (pose === 'sit') {
        rot = Math.sin(time * 1.2) * 1.5
      }
      prevDrop = S.drop
      ground.style.height = h + 'px'
      ground.style.transform = `translate3d(${p.x}px, ${p.y - bob}px, 0) translate(-50%, -100%) rotate(${rot}deg)`
      gImg.style.transform = flip < 0 ? 'scaleX(-1)' : ''
      head = { x: p.x, y: p.y - h - bob }
    }

    if (bustOn && !isMobile) {
      // idle sway + breathing + a little lean toward the cursor
      const sway = Math.sin(time * 1.3) * 1.4 + mouse.x * 4
      const breathe = 1 + Math.sin(time * 2.1) * 0.012
      bImg.style.transform = `${scene.flip ? 'scaleX(-1) ' : ''}rotate(${scene.flip ? -sway : sway}deg) scaleY(${breathe})`
    }
  })

  /* ---------- interactions ---------- */
  // click on the figure (it sits under the content layer, so test its box)
  addEventListener('click', (e) => {
    if (e.target.closest('a, button, input, textarea, label, summary, .chat, .nav, .menu')) return
    const hit = (node) => { const r = node.getBoundingClientRect(); return r.width && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom }
    if (bustOn && hit(bImg)) react(REACTIONS[Math.floor(Math.random() * REACTIONS.length)])
    else if (groundOn && hit(gImg)) gsap.timeline().to(gIn, { y: -60, duration: 0.25, ease: 'power2.out' }).to(gIn, { y: 0, duration: 0.5, ease: 'bounce.out' })
  })
  document.documentElement.addEventListener('mouseleave', (e) => { if (e.clientY <= 0) react('surprised', 2200) })

  return {
    react, setScene,
    get headScreen() { return head },
  }
}
