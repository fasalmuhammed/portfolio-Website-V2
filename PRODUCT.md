# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences, weighted equally (confirmed):

- **Companies hiring:** recruiters and engineering leads judging Fasal for a full-stack / AI engineer role. They skim for who he is, what he has built, his stack, and how to reach him.
- **Business clients:** owners of restaurants, clinics, shops, schools and startups looking for someone to build a website, web app, AI chatbot or automation. They want to know what he builds, whether he has done it before, and how to start.

## Product Purpose

A personal portfolio for Muhammed Fasal V, a full-stack and AI engineer from Kozhikode, Kerala, working as a Junior Software Developer at Finprov Learning (since August 2026). It exists in two modes on one site:

- **Creative mode** (`index.html`): a playful 3D cartoon world.
- **Professional mode** (`pro.html`): for companies and clients who would judge the creative side as unserious. It must read as polished and senior while staying personal.

Success: a visitor knows within seconds who Fasal is and what he does, sees real work, and emails or messages him.

## Positioning

One person who designs, builds and ships end to end (backend, frontend and AI features), with fixed quotes and full code ownership for clients.

## Operating Context

- The professional mode is sent as a link (`/?mode=pro` or `/pro.html`) in job applications and client conversations.
- A toggle beside the logo switches between creative and professional mode; the choice is remembered (`src/mode.js`).
- An AI assistant (FastAPI backend, `src/chat.js`) answers questions about his work and availability.

## Capabilities and Constraints

- Stack: Vite multi-page, vanilla JS, GSAP + ScrollTrigger, Lenis, Three.js (creative mode only).
- Professional mode must not load the 3D world.
- Status: employed at Finprov Learning; open to freelance projects and the right opportunity (confirmed November 2026). Do not say "open to full-time roles".
- Professional mode content: hero, about, experience (timeline, toolkit, certifications), selected work, services, FAQ, contact. Industries and process stay in creative mode only.

## Brand Commitments

- Name: Muhammed Fasal V ("Fasal").
- Professional mode follows the user's own editorial hero design (confirmed, binding): sunlit beige wall, dark pillar, soft circle behind the portrait, huge high-contrast serif name, spaced capital captions, black "View my work" button, vertical scroll marker; every component moves in 3D.
- Professional-mode hero photograph: the user's cut-out `public/images/fasal-hero.webp` (from their `faz.png`). No stock imagery.

## Evidence on Hand

Source of truth: the user's resume (MuhammedFasal.pdf, November 2026).

- Experience: Junior Software Developer, Finprov Learning, Kerala, August 2026 to present (company websites and web apps, frontend features, CMS and admin interfaces, SEO panels with live preview and synced editing, AI chatbot features, testing, accessibility, performance). Freelance developer alongside.
- Freelance projects. Client names stay generic on the site (confirmed): say "a boys' hostel" and "a turf in Kochi", never the business names.
  - Hostel Administration System: Android and web app for a multi-building boys' hostel. Role-based access (Firebase Auth, Firestore rules, Cloud Functions), room allocation, residents, automated monthly billing, fee collection, complaints, reports, QR admissions, PDF/Excel reports, WhatsApp messaging, encrypted backups, offline-first sync. React Native, Expo, TypeScript, Firebase, Node.js. Private client code.
  - Turf Booking System, Kochi (in progress): WhatsApp booking with availability, slot selection, temporary holds, dynamic pricing, double-booking safeguards, UPI payments, notifications and an admin dashboard. Node.js, TypeScript, Express, SQLite, WhatsApp Cloud API. Private client code.
- Personal projects (on GitHub at github.com/fasalmuhammed; per-project repo links not yet supplied): SmartWear, 2026 (AI wardrobe and outfit planner using inventory, weather and preferences; LLM styling, JWT, REST; FastAPI, React, MySQL, Groq LLaMA), i-Dine, 2025 (QR restaurant ordering with digital menu, cart and order management; Django, React, SQL).
- Retired from the site: Kidney Allocation System and the academic Hostel Allocation System.
- Education: MCA, Pondicherry University, 2024 to 2026, CGPA 7.4; BSc Computer Science, MAMO College, Kozhikode, 2021 to 2024.
- Certifications: NPTEL Joy of Computing Using Python (IIT Madras, Elite, 85%); NPTEL Data Analytics with Python (IIT Roorkee); IIRS Overview of GIS (ISRO).
- Facts used on the site: 2 client apps; 30+ tools and technologies; one point of contact start to finish.
- Toolkit: Python, JavaScript, TypeScript, Dart, SQL; React, React Native, Expo, Flutter, HTML/CSS; Django, FastAPI, Flask, Node.js, Express, REST APIs; MySQL, SQLite, Firebase Auth, Firestore, Firebase Storage, Cloud Functions, Firebase Hosting, VPS, Hostinger, cPanel; LLM integration, Groq, LLaMA, RAG, Scikit-learn; WhatsApp Cloud API, UPI, OpenWeather API; Git, GitHub, VS Code, Cursor, Claude, OpenAI Codex.
- Working terms and timings, from the user's own creative-site copy (`index.html`): fixed quotes agreed in writing; working software demoed every week; clients own 100% of the code, hosting and domain; one point of contact start to finish; a business website usually takes one to three weeks; replies within a day; business sites built to rank on Google; the Hostel Allocation System replaced paper registers.
- Contact: fasalmuhammed387@gmail.com; phone and WhatsApp +91 75101 17309 (shown on the site, confirmed); LinkedIn linkedin.com/in/muhammed-fasal-v-4389b6267; GitHub github.com/fasalmuhammed.
- Absent, must not be fabricated: testimonials, years of experience, prices, metrics beyond the facts above, screenshots of the real projects.

## Product Principles

1. Who and what in the first viewport: a stranger can say "Fasal, full-stack and AI engineer, available" within seconds.
2. Show the work, not adjectives: real project names, what they do, and their stacks.
3. One clear next step everywhere: email him.
4. Professional never means generic: personal, confident, crafted.
