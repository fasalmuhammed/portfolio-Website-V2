import './pro.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { initChat } from '../chat.js'
import { initModeSwitch } from '../mode.js'
import { sendLead, mailtoFallback } from '../lead.js'

gsap.registerPlugin(ScrollTrigger)

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
const phone = () => innerWidth <= 700
const $ = (s, el = document) => el.querySelector(s)
const $$ = (s, el = document) => [...el.querySelectorAll(s)]
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const EXPO = 'expo.out'

// always open at the top: the hero assembles itself on load, and a restored mid-page scroll position would freeze it
// half-built. A #section in the address is honoured once the hero has finished.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
const startHash = location.hash
window.scrollTo(0, 0)
initModeSwitch('pro', { arrive: true })

/* ---------------- Smooth scroll ---------------- */
let lenis = null
// ?nosmooth (dev server only) turns smooth scrolling off for automated screenshots
const smooth = !(import.meta.env.DEV && new URLSearchParams(location.search).has('nosmooth'))
if (!reduced && smooth) {
  lenis = new Lenis({ duration: 1.25, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
}
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href')
  const target = id === '#top' ? 0 : $(id)
  if (target === null) return
  e.preventDefault()
  closeMenu()
  if (lenis) lenis.scrollTo(target, { duration: 1.8 })
  else window.scrollTo({ top: target === 0 ? 0 : target.getBoundingClientRect().top + scrollY })
}))

/* ---------------- Menu ---------------- */
const menu = $('#menu'), menuBtn = $('#menuBtn')
function closeMenu() {
  if (!menu.classList.contains('is-open')) return
  menu.classList.remove('is-open'); menu.setAttribute('aria-hidden', 'true'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.textContent = 'Menu'; lenis?.start()
}
menuBtn.addEventListener('click', () => {
  if (menu.classList.contains('is-open')) return closeMenu()
  menu.classList.add('is-open'); menu.setAttribute('aria-hidden', 'false'); menuBtn.setAttribute('aria-expanded', 'true'); menuBtn.textContent = 'Close'; lenis?.stop()
  if (!reduced) gsap.from('.menu__links a', { y: 50, rotationX: -60, opacity: 0, transformPerspective: 600, duration: 1, ease: EXPO, stagger: 0.07, delay: 0.25 })
})
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu() })

/* ---------------- Contact form, assistant ---------------- */
initContactForm()
initChat({ lenis })

// the enquiry is emailed to Fasal through Web3Forms (src/lead.js); if that fails, the visitor's email app opens with it instead
function initContactForm() {
  const form = $('#contactForm'), send = $('.mailform__send', form), label = $('#sendLabel'), status = $('#formStatus')
  const fail = (input, text) => { const f = input.closest('.field'); f.classList.toggle('is-bad', !!text); $('.field__err', f).textContent = text; input.setAttribute('aria-invalid', String(!!text)) }
  form.addEventListener('input', (e) => { if (e.target.closest('.is-bad')) fail(e.target, '') })
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (send.disabled) return
    const { name, email, phone, subject, message, botcheck } = form.elements
    let first = null
    const check = (input, bad, text) => { fail(input, bad ? text : ''); if (bad && !first) first = input }
    check(name, !name.value.trim(), 'Please add your name.')
    const noContact = !email.value.trim() && !phone.value.trim()
    check(email, noContact || !email.checkValidity(), noContact ? 'Add an email or a phone number so I can reply.' : 'That email address looks incomplete.')
    check(message, !message.value.trim(), 'Please write a short message.')
    if (first) return first.focus()

    const who = name.value.trim(), title = `${subject.value} from ${who} (portfolio)`
    send.disabled = true; label.textContent = 'Sending…'; status.textContent = ''
    const ok = await sendLead({
      subject: title, fromName: 'Portfolio · professional mode', replyTo: email.value.trim(), botcheck: botcheck.checked,
      // the email address itself arrives as the reply-to ("email") row
      fields: { Name: who, Phone: phone.value.trim() || '-', Subject: subject.value, Message: message.value.trim() },
    })
    send.disabled = false; label.textContent = 'Send message'
    if (ok) {
      form.reset()
      status.textContent = `Thanks, ${who.split(' ')[0]}. Your message reached me, and I'll reply within a day.`
      return
    }
    status.textContent = "It couldn't send from here, so your email app is opening with the message ready."
    const lines = [`Hi Fasal, I'm ${who}.`, '', message.value.trim(), '']
    if (email.value.trim()) lines.push(`Email: ${email.value.trim()}`)
    if (phone.value.trim()) lines.push(`Phone: ${phone.value.trim()}`)
    mailtoFallback(title, lines.join('\n'))
  })
}

/* ---------------- Split text for 3D ---------------- */
const letters = $('.hero__letters')
letters.innerHTML = [...letters.textContent].map((c) => `<span class="l">${c}</span>`).join('')

// group the statement's words into the lines the browser actually draws, so each line can flip on its own
function splitLines(el) {
  const words = el.textContent.trim().split(/\s+/)
  // words never break inside ("real-world"), so measured lines match the lines that get drawn
  el.innerHTML = words.map((w) => `<span class="w" style="white-space:nowrap">${w}</span>`).join(' ')
  const lines = []
  let top = null
  $$('.w', el).forEach((w) => {
    if (w.offsetTop !== top) { lines.push([]); top = w.offsetTop }
    lines[lines.length - 1].push(w.textContent)
  })
  el.innerHTML = lines.map((l) => `<span class="line"><span class="line__in">${l.join(' ')}</span></span>`).join('')
}

// the role caption is spaced out to end exactly where the name ends
function fitRole() {
  const role = $('.hero__role'), name = $('.hero__letters')
  role.style.letterSpacing = '0px'
  const chars = role.textContent.length
  const extra = (name.getBoundingClientRect().width - role.getBoundingClientRect().width) / Math.max(1, chars - 1)
  role.style.letterSpacing = Math.max(1, extra) + 'px'
  role.style.marginRight = -Math.max(1, extra) + 'px'
}

/* ---------------- Hero: layers at their depths ---------------- */
const P = 1400
const layers = $$('.hero .layer').map((el) => ({ el, depth: +el.dataset.depth || 0 }))
// each layer is pushed to its depth and scaled back up, so it keeps its drawn size but moves with real parallax
const placeLayers = () => layers.forEach(({ el, depth }) => gsap.set(el, { z: depth, scale: (P - depth) / P }))

function heroIntro() {
  // opened part-way down the page: show the finished hero rather than an assembly that would be cut short
  if (scrollY > 10) return
  lenis?.stop()
  gsap.timeline({ defaults: { ease: EXPO }, onComplete: () => lenis?.start() })
    .from('.wall', { opacity: 0, duration: 1.6, ease: 'power2.out' }, 0)
    // the circle tilts up into place and he rises out of the depth in front of it
    .from('.disc', { scale: 0.2, rotationX: 70, opacity: 0, duration: 2.2 }, 0.15)
    .from('.hero__photo', { z: -700, y: 140, rotationY: 20, opacity: 0, duration: 2.4 }, 0.3)
    .from('.hero__role', { x: -60, rotationY: 40, opacity: 0, duration: 1.4 }, 0.7)
    .from('.hero__letters .l', { rotationX: -100, z: -260, y: 60, opacity: 0, duration: 1.6, stagger: 0.09 }, 0.75)
    .from('.hero__lede, .hero__actions', { x: -50, rotationY: 30, opacity: 0, duration: 1.4, stagger: 0.1 }, 1.15)
    .from('.plant', { x: '-12vw', rotation: -12, opacity: 0, duration: 2.2 }, 0.6)
    .from('.nav > *', { y: -30, opacity: 0, duration: 1.2, stagger: 0.08 }, 1.0)
    .from('.marker', { opacity: 0, y: 30, duration: 1.2 }, 1.5)
    .call(() => {
      lenis?.start()
      const target = startHash && $(startHash)
      if (target) lenis ? lenis.scrollTo(target, { duration: 1.8 }) : target.scrollIntoView()
    }, null, 2.1)
}

function heroTilt() {
  const stage = $('#heroStage')
  if (!finePointer) {
    gsap.to(stage, { rotationY: 4, rotationX: -2.5, duration: 4.5, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2.2 })
    return
  }
  const ry = gsap.quickTo(stage, 'rotationY', { duration: 1.4, ease: 'power3.out' })
  const rx = gsap.quickTo(stage, 'rotationX', { duration: 1.4, ease: 'power3.out' })
  $('.hero').addEventListener('pointermove', (e) => {
    ry((e.clientX / innerWidth - 0.5) * 6)
    rx(-(e.clientY / innerHeight - 0.5) * 4)
  })
  $('.hero').addEventListener('pointerleave', () => { ry(0); rx(0) })
}

/* ---------------- 3D buttons: each one leans toward the pointer ---------------- */
function initButtons() {
  if (!finePointer) return
  $$('.btn').forEach((b) => {
    const rx = gsap.quickTo(b, 'rotationX', { duration: 0.5, ease: 'power3.out' }), ry = gsap.quickTo(b, 'rotationY', { duration: 0.5, ease: 'power3.out' })
    gsap.set(b, { transformPerspective: 500 })
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect()
      rx(-((e.clientY - r.top) / r.height - 0.5) * 18)
      ry(((e.clientX - r.left) / r.width - 0.5) * 14)
    })
    b.addEventListener('pointerleave', () => { rx(0); ry(0) })
  })
}

/* ---------------- FAQ accordion ---------------- */
// one answer open at a time; it unfolds downward from its hinge like a page folding open
function initFaq() {
  const items = $$('.faq__item'), head = $('.faq__head')
  const measure = () => head.style.setProperty('--head-h', head.offsetHeight + 'px')
  measure(); addEventListener('resize', measure)
  const set = (item, open, instant) => {
    const q = $('.faq__q', item), a = $('.faq__a', item), inner = $('.faq__in', item)
    item.classList.toggle('is-open', open)
    q.setAttribute('aria-expanded', String(open))
    gsap.killTweensOf([a, inner])
    if (reduced || instant) { gsap.set(a, { height: open ? 'auto' : 0 }); a.hidden = !open; return }
    if (open) {
      a.hidden = false
      gsap.fromTo(a, { height: a.offsetHeight }, { height: 'auto', duration: 0.7, ease: 'expo.out' })
      gsap.fromTo(inner, { rotationX: -75, y: -12, opacity: 0, transformPerspective: 900 }, { rotationX: 0, y: 0, opacity: 1, duration: 0.9, ease: 'expo.out' })
    } else {
      gsap.to(inner, { rotationX: -60, opacity: 0, duration: 0.35, ease: 'power2.in', transformPerspective: 900 })
      gsap.to(a, { height: 0, duration: 0.5, ease: 'expo.inOut', onComplete: () => { a.hidden = true } })
    }
  }
  items.forEach((item, i) => {
    set(item, i === 0, true)
    $('.faq__q', item).addEventListener('click', () => {
      const open = !item.classList.contains('is-open')
      items.forEach((other) => other !== item && other.classList.contains('is-open') && set(other, false))
      set(item, open)
      // the page below has moved, so the pinned scenes after it re-measure
      setTimeout(() => ScrollTrigger.refresh(), 800)
    })
  })
}

/* ---------------- Work coverflow ---------------- */
function initFlow() {
  const flow = $('#flow')
  flow.classList.add('flow--live')
  const cards = $$('.card', flow)
  const state = { p: -0.35 }
  const lay = () => {
    // short screens shrink the cards so the facing one always fits whole below the title
    const fit = Math.min(1, flow.clientHeight / Math.max(...cards.map((c) => c.offsetHeight)))
    const w = cards[0].offsetWidth * fit, gap = phone() ? w * 0.9 : w * 0.82
    cards.forEach((c, i) => {
      const d = i - state.p, a = Math.abs(d)
      gsap.set(c, {
        xPercent: -50, yPercent: -50, x: d * gap, z: -a * 260, scale: fit, rotationY: clamp(-d * 38, -62, 62),
        opacity: clamp(1.9 - a, 0, 1), zIndex: 100 - Math.round(a * 10), transformPerspective: 1600,
      })
    })
  }
  lay()
  gsap.to(state, {
    p: cards.length - 1, ease: 'none', onUpdate: lay,
    scrollTrigger: { trigger: '.work__pin', start: 'top top', end: () => '+=' + innerHeight * (cards.length - 0.6), pin: true, scrub: 0.8, invalidateOnRefresh: true },
  })
  addEventListener('resize', lay)
  // the facing card leans toward the pointer
  if (finePointer) cards.forEach((c) => {
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect()
      gsap.to(c, { rotationX: -((e.clientY - r.top) / r.height - 0.5) * 8, duration: 0.6, ease: 'power3.out' })
    })
    c.addEventListener('pointerleave', () => gsap.to(c, { rotationX: 0, duration: 0.8 }))
  })
}

// the service you are reading lights up, and the paper panel turns over like a page to show a sample of it
function initServices() {
  const items = $$('.svc__item'), specs = $$('.spec'), panel = $('#svcPanel')
  let cur = 0, want = 0, busy = false
  const assemble = (spec) => gsap.fromTo($$('[data-in]', spec), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: EXPO, stagger: 0.09, overwrite: true })
  const turn = () => {
    if (busy || want === cur) return
    busy = true
    const next = want, dir = next > cur ? 1 : -1
    gsap.timeline({ onComplete: () => { busy = false; turn() } })
      .to(panel, { rotationY: -80 * dir, rotationX: 6, z: -120, duration: 0.32, ease: 'power2.in' })
      .add(() => { specs[cur].classList.remove('is-on'); specs[next].classList.add('is-on'); cur = next; assemble(specs[next]) })
      .fromTo(panel, { rotationY: 80 * dir, rotationX: 6, z: -120 }, { rotationY: 0, rotationX: 0, z: 0, duration: 0.9, ease: EXPO })
  }
  items.forEach((item, i) => ScrollTrigger.create({
    trigger: item, start: phone() ? 'top 78%' : 'top 60%', end: phone() ? 'bottom 78%' : 'bottom 60%',
    onToggle: (st) => {
      if (!st.isActive) return
      items.forEach((it, k) => it.classList.toggle('is-on', k === i))
      want = i
      turn()
    },
  }))
  gsap.from(panel, { rotationY: -30, rotationX: 18, z: -500, opacity: 0, duration: 1.6, ease: EXPO, scrollTrigger: { trigger: '.svc', start: 'top 75%', once: true } })
}

/* ---------------- Scroll scenes ---------------- */
function scenes() {
  // HERO: you dolly in, his name flies past the camera, and the circle grows into the next room
  const stoneScale = () => (Math.hypot(innerWidth, innerHeight) * 2.2) / $('.disc').offsetWidth
  // every tween states where it starts, so scrolling back up always restores the finished hero exactly
  const discRest = (P + 120) / P
  const once = { immediateRender: false }
  gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=110%', pin: true, scrub: 0.6, invalidateOnRefresh: true } })
    .fromTo('.hero__letters .l', { z: 0, y: 0, rotationX: 0, rotationY: 0, opacity: 1 }, { z: 900, rotationY: (i) => (i - 2) * 24, opacity: 0, ease: 'power2.in', stagger: 0.05, duration: 0.6, ...once }, 0)
    .fromTo('.hero__role, .hero__lede, .hero__actions', { x: 0, rotationY: 0, opacity: 1 }, { x: '-14vw', rotationY: -40, opacity: 0, ease: 'power2.in', stagger: 0.04, duration: 0.5, ...once }, 0)
    .fromTo('.hero__photo', { scale: 1, x: 0, y: 0, rotationY: 0 }, { scale: 1.12, x: '-8vw', rotationY: -10, ease: 'none', duration: 1, ...once }, 0)
    .fromTo('.plant', { x: 0, y: 0 }, { x: '-18vw', y: '8vh', ease: 'none', duration: 1, ...once }, 0)
    .fromTo('.disc', { scale: discRest, rotationX: 0, opacity: 1 }, { scale: stoneScale, ease: 'power2.in', duration: 0.7, ...once }, 0.35)
    .fromTo('.hero__photo', { opacity: 1 }, { opacity: 0, ease: 'power1.in', duration: 0.3, ...once }, 0.72)
    // the circle never quite reaches the corners in perspective, so the wall and room behind it turn to the about colour as it lands
    .fromTo('.wall', { opacity: 1 }, { opacity: 0, ease: 'power1.in', duration: 0.3, ...once }, 0.7)
    .fromTo('.hero', { backgroundColor: '#e6ddcf' }, { backgroundColor: '#d3cbbf', ease: 'none', duration: 0.3, ...once }, 0.7)

  // ABOUT: each line of the statement flips up into place
  splitLines($('#statement'))
  gsap.from('#statement .line__in', {
    rotationX: -88, y: 40, opacity: 0, transformOrigin: '50% 0% -60px', stagger: 0.12, ease: 'power3.out',
    scrollTrigger: { trigger: '#statement', start: 'top 98%', end: 'bottom 62%', scrub: 0.8 },
  })
  gsap.from('.about__title', { y: 20, opacity: 0, duration: 1, ease: EXPO, scrollTrigger: { trigger: '.about', start: 'top 90%', once: true } })

  // EXPERIENCE: the title rises and each entry flips down from its rule, like the FAQ board
  gsap.from('.exp__title, .exp__sub', { rotationX: -80, y: 60, opacity: 0, transformOrigin: '50% 100%', transformPerspective: 1000, duration: 1.4, ease: EXPO, stagger: 0.1, scrollTrigger: { trigger: '.exp', start: 'top 70%', once: true } })
  $$('.exp__item').forEach((item) => gsap.from(item, { rotationX: -70, y: 30, opacity: 0, transformPerspective: 1200, duration: 1.2, ease: EXPO, scrollTrigger: { trigger: item, start: 'top 88%', once: true } }))
  gsap.from('.kit', { y: 50, opacity: 0, duration: 1.3, ease: EXPO, stagger: 0.12, scrollTrigger: { trigger: '.exp__extra', start: 'top 85%', once: true } })

  // WORK
  gsap.from('.work__title', { rotationX: -70, y: 60, opacity: 0, transformOrigin: '50% 100%', transformPerspective: 900, duration: 1.4, ease: EXPO, scrollTrigger: { trigger: '.work', start: 'top 75%', once: true } })
  gsap.from('.work__sub', { x: 40, opacity: 0, duration: 1.2, ease: EXPO, scrollTrigger: { trigger: '.work', start: 'top 70%', once: true } })
  initFlow()

  // SERVICES: the list scrolls past a panel that turns to show each one
  gsap.from('.services__title', { z: -600, opacity: 0, duration: 1.6, ease: EXPO, scrollTrigger: { trigger: '.services', start: 'top 70%', once: true } })
  initServices()

  // FAQ: the questions flip down one after another like a departures board
  gsap.from('.faq__title, .faq__lede', { rotationX: -80, y: 60, opacity: 0, transformOrigin: '50% 100%', transformPerspective: 1000, duration: 1.4, ease: EXPO, stagger: 0.1, scrollTrigger: { trigger: '.faq', start: 'top 70%', once: true } })
  gsap.from('.faq__item', { rotationX: -95, opacity: 0, transformPerspective: 1200, duration: 1.1, ease: 'back.out(1.4)', stagger: 0.09, scrollTrigger: { trigger: '.faq__list', start: 'top 78%', once: true } })

  // CONTACT: the invitation rises, and the ways to reach him flip up one by one
  gsap.from('.contact__title', { rotationX: -80, y: 80, opacity: 0, transformOrigin: '50% 100%', transformPerspective: 1000, duration: 1.5, ease: EXPO, scrollTrigger: { trigger: '.contact', start: 'top 70%', once: true } })
  gsap.from('.contact__note, .contact__lede, .assist', { y: 30, opacity: 0, duration: 1.2, ease: EXPO, stagger: 0.1, scrollTrigger: { trigger: '.contact', start: 'top 65%', once: true } })
  gsap.from('.reach li', { rotationX: -90, y: 30, opacity: 0, transformOrigin: '50% 0%', duration: 1.2, ease: EXPO, stagger: 0.09, scrollTrigger: { trigger: '#reach', start: 'top 85%', once: true } })
  // the message card swings in from the depth like a door closing toward you
  gsap.from('.mailform', { z: -500, rotationY: -28, x: 80, opacity: 0, transformOrigin: '100% 50%', transformPerspective: 1600, duration: 1.8, ease: EXPO, scrollTrigger: { trigger: '.mailform', start: 'top 85%', once: true } })
}

/* ---------------- Marker, nav state, assistant button ---------------- */
function chrome() {
  const fill = $('#markerFill'), label = $('#markerLabel'), nav = $('#nav'), fab = $('#chatFab'), marker = $('.marker')
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (s) => {
      fill.style.transform = `scaleY(${s.progress})`
      nav.classList.toggle('is-solid', s.scroll() > innerHeight * 0.6)
    },
  })
  // a refresh replays updates from the top, so the bar is re-read from the real scroll position afterwards
  ScrollTrigger.addEventListener('refresh', () => nav.classList.toggle('is-solid', scrollY > innerHeight * 0.6))
  // the marker sits mid-screen: light over the dark services room and footer, ink everywhere else
  ;['.services'].forEach((sel) => ScrollTrigger.create({ trigger: sel, start: 'top center', end: 'bottom center', onToggle: (s) => marker.classList.toggle('on-dark', s.isActive) }))
  const names = [['#top', 'Scroll'], ['#about', 'About'], ['#experience', 'Experience'], ['#work', 'Work'], ['#services', 'Services'], ['#faq', 'FAQ'], ['#contact', 'Contact']]
  names.forEach(([sel, name]) => ScrollTrigger.create({ trigger: sel, start: 'top center', end: 'bottom center', onToggle: (s) => { if (s.isActive) label.textContent = name } }))
  $$('.nav__links a').forEach((a) => {
    const sec = $(a.getAttribute('href'))
    if (sec) ScrollTrigger.create({ trigger: sec, start: 'top center', end: 'bottom center', onToggle: (s) => a.classList.toggle('is-active', s.isActive) })
  })
  // it steps aside on the hero, in contact, and on phones while the project cards fill the screen
  const park = () => fab.classList.toggle('is-parked', scrollY < innerHeight * 0.9 || ScrollTrigger.isInViewport($('.contact'), 0.3) || (phone() && ScrollTrigger.isInViewport($('#flow'), 0.4)))
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: park })
  park()
}

/* ---------------- Cursor: a spinning wireframe cube with a trail ---------------- */
function initCursor() {
  if (!finePointer || reduced) return
  document.documentElement.classList.add('has-cursor')
  const wrap = document.createElement('div')
  wrap.className = 'cursor'
  wrap.setAttribute('aria-hidden', 'true')
  wrap.innerHTML = '<div class="cursor__cube"><i></i><i></i><i></i><i></i><i></i><i></i></div><span class="cursor__label"></span>'
  const trail = document.createElement('canvas')
  trail.className = 'trail'
  trail.setAttribute('aria-hidden', 'true')
  document.body.append(trail, wrap)
  const cube = $('.cursor__cube', wrap), label = $('.cursor__label', wrap), ctx = trail.getContext('2d')
  const fit = () => { const r = Math.min(devicePixelRatio, 2); trail.width = innerWidth * r; trail.height = innerHeight * r; ctx.setTransform(r, 0, 0, r, 0, 0) }
  fit(); addEventListener('resize', fit)
  const pos = { x: innerWidth / 2, y: innerHeight / 2 }, last = { x: 0, y: 0 }, points = []
  const qx = gsap.quickTo(wrap, 'x', { duration: 0.26, ease: 'power3.out' }), qy = gsap.quickTo(wrap, 'y', { duration: 0.26, ease: 'power3.out' })
  let speed = 0, rx = 20, ry = 30
  addEventListener('pointermove', (e) => { pos.x = e.clientX; pos.y = e.clientY; qx(pos.x); qy(pos.y); wrap.classList.add('is-on'); points.push({ x: pos.x, y: pos.y, t: performance.now() }) })
  document.addEventListener('pointerleave', () => wrap.classList.remove('is-on'))
  addEventListener('pointerdown', () => wrap.classList.add('is-down'))
  addEventListener('pointerup', () => wrap.classList.remove('is-down'))
  document.addEventListener('pointerover', (e) => {
    const t = e.target instanceof Element ? e.target.closest('a, button, [data-cursor], input') : null
    wrap.classList.toggle('is-link', !!t && !t.matches('input'))
    label.textContent = t ? t.dataset.cursor || (t.matches('a') ? 'Open' : '') : ''
  })
  gsap.ticker.add(() => {
    const dx = pos.x - last.x, dy = pos.y - last.y
    last.x = pos.x; last.y = pos.y
    speed += (Math.hypot(dx, dy) - speed) * 0.2
    rx += 0.7 + speed * 0.35 + dy * 0.4
    ry += 1 + speed * 0.45 + dx * 0.4
    cube.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`
    const now = performance.now()
    while (points.length && now - points[0].t > 320) points.shift()
    ctx.clearRect(0, 0, innerWidth, innerHeight)
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i], life = 1 - (now - b.t) / 320
      ctx.strokeStyle = `rgba(233, 227, 217, ${(life * 0.8).toFixed(3)})`
      ctx.lineWidth = Math.max(0.4, life * 2.4)
      ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
    }
  })
}

/* ---------------- Boot ---------------- */
const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve()
fontsReady.then(() => {
  fitRole()
  addEventListener('resize', fitRole)
  initFaq()
  if (!reduced) {
    placeLayers()
    heroIntro()
    heroTilt()
    scenes()
    initCursor()
    initButtons()
  }
  // created after the pinned scenes, so their positions include the pin spacing
  chrome()
  ScrollTrigger.refresh()
})
window.addEventListener('load', () => { if (!startHash && scrollY > 0 && scrollY < innerHeight * 3) window.scrollTo(0, 0); ScrollTrigger.refresh() })
