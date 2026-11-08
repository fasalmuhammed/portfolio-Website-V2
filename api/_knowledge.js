// Everything the AI assistant is allowed to know. It answers only from this text.
// Source: Fasal's CV (public/cv/Muhammed-Fasal-V-CV.pdf, November 2026) plus the facts published on the site.
// When the CV changes, update this file and the PDF together. (Files starting with _ in /api are not routes.)
export const KNOWLEDGE = `
# Muhammed Fasal V ("Fasal")
Junior Software Developer, full-stack development. From Kozhikode, Kerala, India. Works remotely with clients anywhere.
Portfolio: https://fasalmuhammed.in. The CV can be downloaded from the "Download CV" button on the site.

## Contact
- Email: fasalmuhammed387@gmail.com (the quickest way to start)
- Phone and WhatsApp: +91 75101 17309
- LinkedIn: https://www.linkedin.com/in/muhammed-fasal-v-4389b6267/
- GitHub: https://github.com/fasalmuhammed
- The contact form at the bottom of the site sends a message straight to his inbox. He replies within a day.

## Summary
MCA graduate and Junior Software Developer with professional experience developing and maintaining web applications, and delivering freelance software for real business needs. Skilled in Python, JavaScript, TypeScript, React, FastAPI, Node.js and SQL, with hands-on experience in full-stack development, cloud-based application architecture, REST APIs, Firebase and AI/LLM integration. Interested in building scalable, user-focused applications that solve practical business problems through software engineering and intelligent automation.

## Availability
Works full time as a Junior Software Developer at Finprov Learning, and takes on freelance projects alongside. Open to freelance projects and happy to hear about the right opportunity. The best first step is an email.

## Professional experience
### Junior Software Developer, Finprov Learning (Kerala), August 2026 to present
- Develops, maintains and improves the company's websites and web applications.
- Builds frontend features, content management workflows and administrative interfaces.
- Enhances website SEO management panels, including live content previews and synchronised content editing.
- Works on AI-powered chatbot features and application integrations.
- Does website testing, debugging, accessibility improvements and performance analysis.

## Freelance projects (client work; client names are kept private)
### Hostel Administration System, for a boys' hostel
Stack: React Native, Expo, TypeScript, Firebase, Node.js.
- A cross-platform app for Android and the web, supporting multiple hostels, buildings and staff roles.
- Role-based access control with Firebase Authentication, Cloud Firestore security rules and Cloud Functions.
- Modules for room allocation, resident (inmate) management, automated monthly billing, fee collection, complaints and admin reporting.
- QR-based admissions, PDF and Excel reports, WhatsApp messaging workflows and encrypted data backups.
- Offline-first data handling, queued updates and real-time sync across devices.

### Turf Booking System, Kochi (in progress)
Stack: Node.js, TypeScript, Express.js, SQLite, WhatsApp Cloud API.
- An automated WhatsApp-based turf booking platform: check availability, pick time slots and manage reservations.
- Booking workflows, dynamic pricing and temporary booking holds.
- An admin dashboard for bookings, schedules, pricing, customers and payments.
- Validation and availability safeguards that prevent double bookings.
- UPI payment integration and automated booking notifications (in progress).

## Academic and personal projects
### SmartWear, AI smart wardrobe and outfit planner (2026)
Stack: FastAPI, React, MySQL, Groq LLaMA.
- Generates personalised outfit recommendations from the user's clothing inventory, the weather and their preferences.
- LLM-based styling recommendations, weather APIs and outfit planning.
- REST APIs, JWT authentication and database management.

### i-Dine, smart restaurant ordering system (2025)
Stack: Django, React, SQL.
- A QR-based restaurant ordering platform with digital menus, cart management and order processing.
- Backend APIs for order management and restaurant operations.

## Technical skills
- Programming languages: Python, JavaScript, TypeScript, Dart, SQL
- Frontend: React.js, React Native, Expo, HTML5, CSS3, Flutter
- Backend: Django, FastAPI, Flask, Node.js, Express.js, REST APIs
- Databases and backend services: MySQL, SQLite, Firebase Authentication, Cloud Firestore, Firebase Storage
- AI and machine learning: LLM integration, Groq API, LLaMA, RAG concepts, Scikit-learn, decision trees, random forest
- Cloud, hosting and deployment: Firebase Hosting, Cloud Functions, VPS management, Hostinger, cPanel
- Development tools: Git, GitHub, VS Code, DB Browser for SQLite
- AI development tools: Cursor, Claude, OpenAI Codex
- Integrations: WhatsApp Cloud API, UPI payment workflows, OpenWeather API

## Education
- Master of Computer Applications (MCA), Pondicherry University, Puducherry, 2024 to 2026. CGPA 7.4.
- BSc Computer Science, MAMO College, Kozhikode, 2021 to 2024.

## Certifications
- NPTEL: Joy of Computing Using Python (Elite, 85%), IIT Madras
- NPTEL: Data Analytics with Python, IIT Roorkee
- IIRS: Overview of GIS, ISRO

## Languages spoken
English (fluent), Malayalam (fluent), Hindi (intermediate), Tamil (basic).

## What he builds for clients (services)
- Websites: fast, mobile-first business sites built to rank on Google and turn visitors into enquiries.
- Web and mobile apps: booking, billing, ordering and admin systems for web and Android, built around how a team works.
- AI chatbots: an assistant trained on a business's menu, services or FAQs that answers customers day and night.
- Automation: invoices, reports, reminders and data entry that run on their own (for example WhatsApp workflows).
- E-commerce: online stores and ordering with menus, carts and order tracking.
He can also extend, fix or modernise an existing website or system, or connect new tools to it, instead of rebuilding from scratch.
Typical clients: restaurants and cafés, clinics, shops, schools, hostels, sports venues and startups.

## How he works with clients
- A short call first, then a fixed quote agreed in writing before any work starts. There is no public price list: the price depends on the features, and the quote lists every one.
- A business website usually takes one to three weeks. Larger systems are split into milestones, with working software demoed every week.
- Clients own 100% of the code, hosting and domain, and get the notes needed to run it.
- One point of contact from start to finish. Replies within a day.
- After launch: deployment, training for the client's team, and support for fixes, updates and new features.
`
