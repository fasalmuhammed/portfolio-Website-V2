import './style.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { createWorld, ISLANDS } from './world.js'
import { initChat } from './chat.js'
import { createActor } from './actor.js'
import { sendLead, mailtoFallback, EMAIL } from './lead.js'
import { initModeSwitch } from './mode.js'

gsap.registerPlugin(ScrollTrigger)

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
const $ = (s, el = document) => el.querySelector(s)
const $$ = (s, el = document) => [...el.querySelectorAll(s)]

document.documentElement.classList.add('css-ready')
document.body.classList.add('is-loading')
$('#year').textContent = new Date().getFullYear()

const INDUSTRIES = [
  ['Restaurants & Cafés', 'Online menus, table ordering and kitchen screens.'],
  ['Clinics & Healthcare', 'Appointment booking, patient records and smart matching.'],
  ['Fashion & Retail', 'Online stores, stock control and AI product picks.'],
  ['Schools, Colleges & Hostels', 'Admissions, room allocation, fees and attendance.'],
  ['Real Estate & Builders', 'Property listings, lead forms and quick follow-ups.'],
  ['Startups & SaaS', 'MVPs, APIs and AI features shipped in weeks.'],
  ['Salons, Gyms & Local Services', 'Slot booking, memberships and reminders.'],
]

/* ---------------- 3D world ---------------- */
let W = null
try { W = createWorld($('#world'), { reduced }) } catch (err) { console.warn('WebGL unavailable, continuing without 3D', err) }
if (import.meta.env.DEV) { window.__world = W; window.__ST = ScrollTrigger }
let actor = null

/* ---------------- Smooth scroll ---------------- */
let lenis = null
if (!reduced) {
  lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true })
  lenis.on('scroll', (e) => { ScrollTrigger.update(); W?.setVelocity(e.velocity) })
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
  lenis.stop()
}

$$('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href')
    const target = id === '#top' ? 0 : $(id)
    if (target === null) return
    e.preventDefault()
    closeMenu()
    if (lenis) lenis.scrollTo(target, { duration: 1.8 })
    else window.scrollTo({ top: target === 0 ? 0 : target.getBoundingClientRect().top + window.scrollY })
  })
})

/* ---------------- Loader + intro ---------------- */
function runLoader() {
  return new Promise((resolve) => {
    const c = { v: 0 }
    gsap.timeline({ onComplete: resolve })
      .to(c, { v: 100, duration: reduced ? 0.2 : 2, ease: 'power2.inOut', onUpdate: () => { $('#loaderCount').textContent = Math.round(c.v); $('#loaderBar').style.transform = `scaleX(${c.v / 100})` } })
      .to('.loader__face', { scale: 0, rotate: 200, duration: 0.5, ease: 'back.in(2)' }, '+=0.1')
      .to('#loader', { clipPath: 'circle(0% at 50% 50%)', duration: 0.9, ease: 'expo.inOut' }, '-=0.1')
      .set('#loader', { display: 'none' })
  })
}

const badgeIntro = { y: reduced ? 0 : 2.2 }
function heroIntro() {
  if (W) { badgeIntro.y = reduced ? W.badgeHome.y : 2.2; gsap.to(badgeIntro, { y: W.badgeHome.y, duration: 1.7, ease: 'power2.out' }) }
  // the headline stickers slap onto the scene one after another
  gsap.timeline()
    .from('.hero__title .line', { scale: 0.3, rotate: (i) => (i % 2 ? 14 : -14), opacity: 0, transformOrigin: '20% 50%', duration: 0.9, ease: 'back.out(2.2)', stagger: 0.16, clearProps: 'transform,opacity' })
    .from('[data-hero]', { y: 30, opacity: 0, duration: 0.8, ease: 'back.out(1.6)', stagger: 0.1 }, '-=0.6')
    .from('.nav > *', { y: -60, opacity: 0, duration: 0.8, ease: 'back.out(1.6)', stagger: 0.08 }, '-=0.8')
    .from('.chat-fab', { scale: 0, rotate: -90, duration: 0.8, ease: 'back.out(2)' }, '-=0.5')
}

/* ---------------- Scroll choreography ---------------- */
function initScroll() {
  const nav = $('#nav'), bar = $('#progress')
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      bar.style.transform = `scaleX(${self.progress})`
      nav.classList.toggle('is-hidden', self.direction === 1 && self.scroll() > 500 && !$('#menu').classList.contains('is-open'))
    },
  })
  $$('.nav__links a').forEach((a) => {
    const sec = $(a.getAttribute('href'))
    if (sec) ScrollTrigger.create({ trigger: sec, start: 'top center', end: 'bottom center', onToggle: (s) => a.classList.toggle('is-active', s.isActive) })
  })

  // panels pop in like comic frames
  ScrollTrigger.batch('[data-panel]', { start: 'top 85%', onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, rotate: 0, scale: 1, duration: 1, ease: 'back.out(1.5)', stagger: 0.1, overwrite: true }) })
  ScrollTrigger.batch('[data-reveal]', { start: 'top 90%', onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: 'back.out(1.7)', stagger: 0.08, overwrite: true }) })

  gsap.from('.polaroid', {
    x: (i) => (1.5 - i) * 90, y: 60, rotation: 0, scale: 0.7, opacity: 0, duration: 1, ease: 'back.out(1.6)', stagger: 0.1,
    clearProps: 'transform,opacity', scrollTrigger: { trigger: '#polaroids', start: 'top 85%' },
  })
  gsap.from('.svc', { scale: 0.5, opacity: 0, y: 30, duration: 0.7, ease: 'back.out(2)', stagger: 0.07, clearProps: 'transform,opacity', scrollTrigger: { trigger: '.services', start: 'top 85%' } })
  gsap.from('.step', { x: 60, opacity: 0, duration: 0.7, ease: 'back.out(1.8)', stagger: 0.12, scrollTrigger: { trigger: '#steps', start: 'top 80%' } })
  gsap.from('.qa', { y: 30, opacity: 0, duration: 0.6, ease: 'back.out(1.8)', stagger: 0.08, scrollTrigger: { trigger: '.faq', start: 'top 85%' } })
  gsap.from('.skill', { x: -40, opacity: 0, duration: 0.6, ease: 'back.out(1.8)', stagger: 0.08, scrollTrigger: { trigger: '.skills', start: 'top 85%' } })

  $$('.counter').forEach((el) => {
    const to = +el.dataset.to, suffix = el.dataset.suffix || '', o = { v: 0 }
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => gsap.fromTo(o, { v: 0 }, { v: to, duration: 1.6, ease: 'expo.out', onUpdate: () => { el.textContent = Math.round(o.v) + suffix } }) })
  })

  // project cards stack and tuck behind each other
  const projects = $$('.project')
  projects.forEach((card, i) => {
    if (i === projects.length - 1) return
    gsap.to(card, { scale: 0.9, rotate: i % 2 ? 2 : -2, ease: 'none', scrollTrigger: { trigger: projects[i + 1], start: 'top bottom', end: 'top 25%', scrub: true } })
  })

  if (!W) return
  const S = W.state, m = W.isMobile
  const off = (d) => (m ? 0 : d)
  S.charScale = m ? 0.9 : 1.0

  // Each segment only reports scroll progress; every frame the world state is rebuilt by layering
  // the segments in scroll order, then smoothed. No tweens fight over the same values.
  const BASE = { camX: 0, camY: 0, phase: 0, snow: 0, aurora: 0, fireworks: 0, charOff: off(-0.5), air: 0, flyY: 0.15, drop: 14, islands: 0 }
  const segs = []
  const seg = (trigger, to, { start = 'top bottom', end = 'bottom bottom', ease = 'none' } = {}) => {
    const st = ScrollTrigger.create({ trigger, start, end, invalidateOnRefresh: true })
    segs.push({ st, to, ease: gsap.parseEase(ease) })
    return st
  }
  // place: where Fasal stands / flies, settled early so he is in position while the section is read
  const place = (trigger, to, opts = {}) => seg(trigger, to, { end: 'top 35%', ease: 'power1.inOut', ...opts })

  seg('#about', { drop: 0 }, { start: 'top 95%', end: 'top 25%', ease: 'bounce.out' })
  seg('#about', { camX: 12 }); place('#about', { charOff: off(-0.52) })
  seg('#services', { camX: 44 }); place('#services', { charOff: off(0.55) })
  seg('#industries', { camX: 47, phase: 0.4 }, { end: 'top top' }); place('#industries', { charOff: 0, islands: 1, camY: 0.6 }, { end: 'top top' })
  const pinLen = () => innerHeight * (m ? 3 : 4)
  ScrollTrigger.create({ trigger: '#industries', start: 'top top', end: () => '+=' + pinLen(), pin: true, invalidateOnRefresh: true, anticipatePin: 1 })
  const indST = seg('#industries', { camX: 112, phase: 1 }, { start: 'top top', end: () => '+=' + pinLen() })
  seg('#work', { camX: 140 }); place('#work', { camY: 9, air: 1, islands: 0, charOff: off(0.58), flyY: m ? 0.35 : 0.05 })
  seg('#process', { camX: 165, phase: 2 }); place('#process', { camY: 0, air: 0, charOff: off(-0.55) })
  seg('#stack', { camX: 172, phase: 2.6 }); place('#stack', { charOff: off(0.55) })
  seg('#faq', { camX: 182, phase: 3.3 }); place('#faq', { charOff: off(-0.55) })
  seg('#contact', { camX: 196, phase: 4, snow: 1, aurora: 1, fireworks: 1 }, { end: 'top top' }); place('#contact', { charOff: off(0.6) })

  // hero badge: drops in on intro, goes back up on its lanyard as we leave the hero
  const badgeExit = ScrollTrigger.create({ trigger: '#hero', start: 'top top', end: 'bottom 35%' })
  const T = { ...BASE }
  Object.assign(S, BASE)
  gsap.ticker.add((time, deltaMs) => {
    Object.assign(T, BASE)
    for (const s of segs) {
      const p = s.ease(s.st.progress)
      if (p <= 0) continue
      for (const k in s.to) T[k] += (s.to[k] - T[k]) * p
    }
    const k = 1 - Math.exp(-(deltaMs / 1000) * 5)
    for (const key in T) S[key] += (T[key] - S[key]) * (key === 'drop' ? 1 : k)
    W.badgeState.y = badgeIntro.y + Math.pow(badgeExit.progress, 1.6) * (2.6 - W.badgeHome.y)
  })

  actor = createActor({ W, isMobile: m, reduced })
  S.ground = 1
  // little reactions from the real Fasal
  $$('.qa').forEach((q) => q.addEventListener('toggle', () => { if (q.open) actor.react('surprised', 1200) }))
  ;['#emailText', '#copyEmail'].forEach((s) => $(s).addEventListener('pointerenter', () => actor.react('kiss', 1400)))
  $$('.chips input').forEach((c) => c.addEventListener('change', () => c.checked && actor.react('smile', 1000)))

  // speech bubble that follows Fasal across the islands
  const speech = $('#speech'), dots = $$('#indDots li')
  let current = -1, shown = false
  gsap.ticker.add(() => {
    const active = indST.isActive
    if (active !== shown) { shown = active; gsap.to(speech, { opacity: active ? 1 : 0, scale: active ? 1 : 0.6, duration: 0.35, ease: 'back.out(2)' }) }
    if (!active) return
    const x = S.camX + S.charOff * W.halfW
    const i = Math.max(0, Math.min(ISLANDS.count - 1, Math.round((x - ISLANDS.x0) / ISLANDS.gap)))
    if (i !== current) {
      current = i
      $('#speechTitle').textContent = INDUSTRIES[i][0]
      $('#speechText').textContent = INDUSTRIES[i][1]
      dots.forEach((d, k) => d.classList.toggle('is-on', k === i))
      gsap.fromTo(speech, { scale: 0.7 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' })
    }
    const p = actor.headScreen
    const w = speech.offsetWidth, h = speech.offsetHeight
    const x0 = Math.max(12, Math.min(innerWidth - w - 12, p.x - w / 2))
    speech.style.left = x0 + 'px'
    speech.style.top = Math.max(80, p.y - h - 26) + 'px'
  })
}

/* ---------------- Card tilt ---------------- */
function initTilt() {
  if (!finePointer || reduced) return
  $$('[data-tilt]').forEach((card) => {
    const rx = gsap.quickTo(card, 'rotateX', { duration: 0.5, ease: 'power3.out' })
    const ry = gsap.quickTo(card, 'rotateY', { duration: 0.5, ease: 'power3.out' })
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect()
      rx(((e.clientY - r.top) / r.height - 0.5) * -16); ry(((e.clientX - r.left) / r.width - 0.5) * 16)
    })
    card.addEventListener('pointerleave', () => { rx(0); ry(0) })
  })
}

/* ---------------- Menu ---------------- */
const burger = $('#burger'), menu = $('#menu')
function closeMenu() {
  if (!menu.classList.contains('is-open')) return
  menu.classList.remove('is-open'); menu.setAttribute('aria-hidden', 'true'); burger.setAttribute('aria-expanded', 'false')
  lenis?.start()
}
burger.addEventListener('click', () => {
  if (menu.classList.contains('is-open')) return closeMenu()
  menu.classList.add('is-open'); menu.setAttribute('aria-hidden', 'false'); burger.setAttribute('aria-expanded', 'true')
  lenis?.stop()
  gsap.from('.menu__links a', { y: 60, opacity: 0, duration: 0.7, ease: 'back.out(1.8)', stagger: 0.05, delay: 0.2 })
})

/* ---------------- Contact form ---------------- */
// the enquiry is emailed to Fasal through Web3Forms (src/lead.js); if that fails, the visitor's email app opens with it instead
$('#contactForm').addEventListener('submit', async (e) => {
  e.preventDefault()
  const f = e.currentTarget, status = $('#formStatus'), btn = $('button[type="submit"]', f)
  if (btn.disabled) return
  let ok = true
  ;['f-name', 'f-email', 'f-msg'].forEach((id) => {
    const el = $('#' + id), bad = !el.value.trim()
    el.closest('.field').classList.toggle('is-invalid', bad)
    if (bad) ok = false
  })
  if (!ok) { status.textContent = 'Add your name, a way to reach you and a short message.'; actor?.react('shrug', 2000); return }
  const d = new FormData(f)
  const name = String(d.get('name')).trim(), contact = String(d.get('email')).trim()
  const fields = { Name: name, Contact: contact, Business: d.get('business') || '-', Needs: d.getAll('need').join(', ') || 'Not specified', Message: d.get('message') }
  const title = `New project enquiry from ${name} (portfolio)`
  btn.disabled = true; status.textContent = 'Sending…'
  const sent = await sendLead({ subject: title, fromName: 'Portfolio · creative mode', replyTo: contact, fields, botcheck: d.get('botcheck') })
  btn.disabled = false
  if (sent) {
    f.reset()
    status.textContent = `Thanks, ${name.split(' ')[0]}! Your enquiry reached me. I'll reply within a day.`
    actor?.react('laugh', 3000)
    return
  }
  status.textContent = "It couldn't send from here, so your email app is opening with the message ready."
  mailtoFallback(title, Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join('\n'))
})
$('#copyEmail').addEventListener('click', async (e) => {
  const btn = e.currentTarget
  try { await navigator.clipboard.writeText(EMAIL); btn.textContent = 'Copied!' }
  catch { const r = document.createRange(); r.selectNodeContents($('#emailText')); getSelection().removeAllRanges(); getSelection().addRange(r); btn.textContent = 'Selected' }
  setTimeout(() => (btn.textContent = 'Copy'), 1800)
})

/* ---------------- Boot ---------------- */
initModeSwitch('creative')
initChat({ lenis })
initTilt()

const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve()
Promise.all([runLoader(), fontsReady]).then(() => {
  document.body.classList.remove('is-loading')
  lenis?.start()
  initScroll()
  heroIntro()
  ScrollTrigger.refresh()
})
window.addEventListener('load', () => ScrollTrigger.refresh())
