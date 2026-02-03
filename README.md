# Savoa Wellness App (PWA)

**A comprehensive wellness and meditation Progressive Web App (PWA) built with Next.js.**

This application serves as a personal mental health companion, featuring guided meditations, breathwork exercises, gratitude journaling, and progress tracking. Engineered as a PWA for an app-like experience on mobile devices with offline capabilities.

![Status](https://img.shields.io/badge/Status-Production-success)
![PWA](https://img.shields.io/badge/PWA-Supported-purple?style=flat&logo=pwa&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-black?style=flat&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)

## 📱 Key Features

* **Offline-First PWA:** Fully installable via `next-pwa`, with service workers (`sw.js`) and caching strategies for offline access.
* **Media & Meditation:** Custom audio players (`ProPlayer`, `MeditationPlayer`) for streaming guided sessions.
* **Interactive Tools:**
    * 🌬️ **Breathwork:** Interactive UI for breathing exercises (`/app/breath`).
    * ✨ **Affirmations:** Daily positive affirmations (`/app/affirmation`).
    * 📖 **Gratitude Journal:** Built-in journaling interface (`/app/gratitude`).
* **Progress Tracking:** Local-first state management with cloud synchronization (`useProgressSync`, `useLocalStorage`).
* **Secure Auth:** Protected routes via `AuthGate` component and proxy-based API communication.

## 🛠 Tech Stack

* **Framework:** Next.js (App Router)
* **Language:** TypeScript
* **PWA:** `next-pwa`, Workbox
* **State Management:** Zustand (implied by `store` structure)
* **Styling:** Tailwind CSS / PostCSS
* **API Strategy:** Next.js API Routes for secure proxying (`/api/proxy`)

## 📂 Project Structure

```bash
├── public/             # Static assets, PWA manifest, and service workers
├── src/
│   ├── api/proxy/      # Secure API proxy to backend services
│   ├── app/            # App Router: logic for specific features
│   │   ├── affirmation # Daily affirmations logic
│   │   ├── breath/     # Breathwork interface
│   │   ├── gratitude/  # Journaling feature
│   │   ├── program/    # Educational course structure
│   │   ├── tracker/    # User progress dashboard
│   │   └── ...auth     # Login/Reset flow
│   ├── components/     # Reusable UI (Players, AuthGate, Navigation)
│   ├── hooks/          # Custom hooks (Sync, LocalStorage)
│   ├── lib/            # Utilities (Auth, API clients)
│   └── store/          # Global state management
└── ...config files
```

##⚠️ Disclaimer

**This project is part of a commercial educational product. Source code is published for portfolio demonstration purposes only. Content and methodologies are proprietary.**
