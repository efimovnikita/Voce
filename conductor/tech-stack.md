# Tech Stack: Mistral Speaker

## 1. Frontend Core
- **Framework:** **React (v18+)**. A component-based library for building a dynamic and responsive player interface.
- **Build Tool:** **Vite**. A modern, high-performance build tool for fast development and optimized production builds.
- **Language:** **JavaScript (ES6+)**. Standard modern JavaScript for robust and clear application logic.

## 2. Styling & UI
- **CSS Framework:** **Tailwind CSS**. A utility-first CSS framework for rapid UI development with a clean and maintainable aesthetic.
- **Visual Effects:** Standard HTML5 Canvas or CSS animations for the waveform visualization.

## 3. PWA & Mobile Integration
- **PWA Features:**
  - **Service Worker:** For offline capabilities and resource caching.
  - **Web App Manifest:** Defining app identity and the `share_target` for system "Share" integration.
- **OS Integration:** Utilization of the `navigator.share` (if needed) and the PWA `share_target` API to receive text content.

## 4. APIs & Services
- **Speech Generation:** **Mistral AI TTS API**.
  - `/v1/audio/speech/voices` (to fetch available voices).
  - `/v1/audio/speech` (to generate the actual audio streams).
- **Audio Handling:** Standard HTML5 `Audio` element for playback management.

## 5. Storage & State Management
- **Local State:** React Hooks (e.g., `useState`, `useEffect`) and potentially React Context for application-wide player state.
- **Persistent Storage:** **`localStorage`**. For storing user preferences like the Mistral API key and the last selected voice ID.

## 6. Deployment & Infrastructure
- **Hosting:** **GitHub Pages**. For reliable and free static file hosting directly from the project repository.
- **CI/CD:** **GitHub Actions**. To automate the build and deployment process on every push to the `main` branch.
