// Floating AI assistant. It talks to the site's own serverless function (api/chat.js), which answers from Fasal's CV.
// The Vite dev server has no /api, so for local testing set VITE_API_BASE_URL=https://www.fasalmuhammed.in in .env.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export function initChat({ lenis } = {}) {
  const chat = document.getElementById('chat')
  const fab = document.getElementById('chatFab')
  const body = document.getElementById('chatBody')
  const form = document.getElementById('chatForm')
  const input = document.getElementById('chatInput')
  const chips = document.getElementById('chatChips')
  const history = []
  let busy = false

  const open = () => {
    chat.classList.add('is-open'); chat.setAttribute('aria-hidden', 'false'); fab.classList.add('is-hidden')
    setTimeout(() => input.focus(), 300)
  }
  const close = () => {
    chat.classList.remove('is-open'); chat.setAttribute('aria-hidden', 'true'); fab.classList.remove('is-hidden')
  }
  fab.addEventListener('click', open)
  document.getElementById('chatClose').addEventListener('click', close)
  document.querySelectorAll('[data-open-chat]').forEach((b) => b.addEventListener('click', open))
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && chat.classList.contains('is-open')) close() })
  // keep wheel scrolling inside the chat instead of the page
  body.setAttribute('data-lenis-prevent', '')

  function add(text, who) {
    const m = document.createElement('div')
    m.className = `msg msg--${who}`
    m.textContent = text
    body.append(m)
    body.scrollTop = body.scrollHeight
    return m
  }

  async function send(text) {
    text = text.trim()
    if (!text || busy) return
    busy = true
    chips.hidden = true
    add(text, 'me')
    input.value = ''
    const typing = add('', 'bot')
    typing.classList.add('msg--typing')
    typing.innerHTML = '<span></span><span></span><span></span>'
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      })
      const data = (res.headers.get('content-type') || '').includes('application/json') ? await res.json() : null
      if (!res.ok || !data) throw new Error(data?.detail || `Status ${res.status}`)
      const reply = data.reply || "That's one for Fasal himself: email fasalmuhammed387@gmail.com or WhatsApp +91 75101 17309."
      typing.remove()
      add(reply, 'bot')
      history.push({ role: 'user', content: text }, { role: 'assistant', content: reply })
    } catch (err) {
      typing.remove()
      add("I can't answer right now, but Fasal can: email fasalmuhammed387@gmail.com or WhatsApp +91 75101 17309, or use the contact form on this page.", 'bot')
      console.warn('Chat error:', err)
    } finally {
      busy = false
    }
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); send(input.value) })
  chips.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => send(b.textContent)))
}
