# Muhammed Fasal · Portfolio

A cartoon-film style 3D portfolio built with **Vite + Three.js + GSAP ScrollTrigger + Lenis**.

```bash
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
```

Deploy the `dist/` folder to any static host (Vercel, Netlify, Cloudflare Pages, Hostinger…).

## Two modes
The site has a **professional mode** (`index.html`, the homepage: an editorial site with 3D motion, no WebGL world) and a **creative mode** (`creative.html`, the 3D world).
Every visit to `https://fasalmuhammed.in` opens professional mode. The toggle in the nav switches to the creative world and back with a full-screen wipe (`src/mode.js`).

- `https://fasalmuhammed.in/creative.html` (or `/?mode=creative`) opens the creative world directly.
- Old `/pro.html` links redirect to the homepage (`vercel.json`).

| File | What it does |
|---|---|
| `index.html` | Professional page (homepage): editorial hero (wall, circle, portrait, FASAL), about, experience (timeline, toolkit, certifications), 3D project coverflow, services, FAQ, contact |
| `src/pro/pro.css` | Its styles: beige/stone/charcoal, Gloock + Manrope (self-hosted via `@fontsource`) |
| `src/pro/pro.js` | Lenis + GSAP ScrollTrigger: hero 3D intro and mouse depth, scroll scenes, coverflow, cube cursor, contact form (emails leads via `src/lead.js`) |
| `public/images/fasal-hero.webp` | The hero cut-out. Replace with a transparent WebP of the same framing to update it |
| `PRODUCT.md`, `.impeccable/` | Product notes and design records used by the Impeccable skill |

## How it works
| File | What it does |
|---|---|
| `src/world.js` | The 3D world: sky + day-to-night cycle, hills, trees, clouds, floating business islands, lake, snow, aurora, fireworks, camera rail |
| `src/actor.js` | The real Fasal: cut-out poses in `public/fasal/`. Full-body poses (stand, walk, sit) stand on the 3D world; head-and-shoulder poses rise from the bottom of the screen (desktop) or peek over the panel (phones). The `SCENES` list maps each section to a pose; `REACTIONS` are shown on click |
| `src/badge.js` | The hanging ID card in the hero (rope physics, drag & fling) |
| `src/main.js` | Scroll choreography (search "Each segment only reports scroll progress"), section actions, island speech bubble, form |
| `src/chat.js` | AI assistant widget (talks to the existing FastAPI backend) |

The journey: meadow (hero, about) → running path (services) → island hopping (industries) → flying through the sky (work)
→ sunset walk (process) → evening juggling (toolkit) → night (FAQ) → snowy aurora night with fireworks (contact).

## Images
- `public/fasal/*.png` – your character poses (transparent cut-outs). Replace a file with the same name to update a pose.
- `public/photos/*.jpg` – real photos used in the About polaroids and the Contact sticker.

## Contact form leads
Both contact forms email each enquiry to fasalmuhammed387@gmail.com through [Web3Forms](https://web3forms.com) (`src/lead.js`).
Put the access key in `WEB3FORMS_KEY` at the top of that file. It is public by design and can only send to the address it was created for.
Until the key is set, or if sending fails, the visitor's email app opens with the message already written.
Each form has a hidden spam-trap checkbox (`botcheck`), so messages from bots that tick it are dropped.

## AI assistant
Calls `https://portfolio-website-4ahq.onrender.com/api/chat`. To change it, create `.env` with
`VITE_API_BASE_URL=https://your-backend.com`.

## Still to do
- Swap the SmartWear and i-Dine "GitHub" links (currently the profile URL) for the real repo URLs. The two freelance projects are private client code and show "Client project" instead.
- Update the AI assistant's knowledge on the backend: it still describes the old projects (Kidney Allocation, Hostel Allocation) and doesn't know about Finprov or the freelance work.
