
# Home Service Provider (HSP) — React Client Application

This repository contains the decoupled, highly interactive frontend single-page application (SPA) for the Home Service Provider marketplace platform. The UI is built to guide users through discovery, real-time messaging, dynamic scheduling, and transactional lifecycles.

## 🛠️ Technology Stack & Ecosystem
* **Core Engine:** React.js (Vite Build Pipeline)
* **Global State Management:** Redux Toolkit (Modular, slice-based state management)
* **Styling Layer:** Tailwind CSS
* **Network Client:** Axios (Centralized instances with interceptors for JWT injection)
* **Iconography:** Lucide React

## 📦 Key UI Module Implementations
* **Polymorphic Polling Chat Engine:** A single reusable view (`MessagesPage.jsx`) that supports both Customer and Provider layouts, utilizing a custom hook (`usePolling.js`) to sync inbox lists and active threads without memory leaks or stale-state traps.
* **Interactive AI Matching Discovery Canvas:** Captures natural language complaints and geolocates search fields, sending payload descriptors to the API before rendering dynamic provider response profiles.
* **Geospatial Weekly Availability Grid:** A visual checkbox and time-range calendar component allowing providers to configure working blocks with inline validation guards preventing temporal sequence inversions (`endTime <= startTime`).
* **Profile & Document Compliance Dashboard:** Dynamic profile editing views for both customers and providers, featuring an administrative compliance engine supporting image URL uploads for credential tracking (CNIC, Trade License).

## 🚀 Local Installation & Setup

1. **Clone the repository and install dependencies:**
   ```bash
   cd hsp-frontend
   npm install

```

2. **Configure Environment Variables:**
Create a file named `.env.local` directly in the root directory:
```env
VITE_API_BASE_URL=https://localhost:7055/api
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com

```


3. **Fire up the hot-reloading development server:**
```bash
npm run dev

```



