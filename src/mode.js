// Switches between the professional site (index.html, the homepage) and the creative world (creative.html).
// A full-screen curtain wipes in on the page being left and lifts on the page being entered.
const WIPE = 'fasal-wipe'
const LOOK = {
  pro: { bg: '#e9e3d9', ink: '#1d1b18', label: 'Professional mode' },
  creative: { bg: '#ffc93c', ink: '#14213d', label: 'Creative mode' },
}
const EASE = 'cubic-bezier(0.76, 0, 0.24, 1)'

function curtain(mode) {
  const { bg, ink, label } = LOOK[mode]
  const el = document.createElement('div')
  el.className = 'mode-curtain'
  el.setAttribute('aria-hidden', 'true')
  el.textContent = label
  Object.assign(el.style, {
    position: 'fixed', inset: '0', zIndex: '1000', display: 'grid', placeItems: 'center',
    background: bg, color: ink, font: '400 clamp(40px, 7vw, 110px)/1 "Bodoni Moda Variable", Didot, Georgia, serif',
    textTransform: 'uppercase', letterSpacing: '-0.005em',
  })
  document.body.append(el)
  return el
}

export function initModeSwitch(current, { arrive = false } = {}) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let wipe = null
  try { wipe = sessionStorage.getItem(WIPE); sessionStorage.removeItem(WIPE) } catch {}
  if (arrive && wipe === current && !reduced) {
    const el = curtain(current)
    document.documentElement.classList.remove('is-arriving')
    el.animate([{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 100% 0)' }], { duration: 900, delay: 120, easing: EASE, fill: 'forwards' })
      .finished.then(() => el.remove())
  }
  document.documentElement.classList.remove('is-arriving')

  document.querySelectorAll('[data-mode-switch]').forEach((link) => link.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return
    const mode = link.dataset.modeSwitch
    if (reduced) return
    e.preventDefault()
    try { sessionStorage.setItem(WIPE, mode) } catch {}
    curtain(mode).animate([{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 700, easing: EASE, fill: 'forwards' })
      .finished.then(() => { window.location.href = link.href })
  }))

  // coming back with the browser's back button restores the old page with its curtain still down
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return
    document.querySelectorAll('.mode-curtain').forEach((c) => c.remove())
  })
}
