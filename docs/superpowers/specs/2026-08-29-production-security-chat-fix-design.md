# Design Spec: Zero-Exposure Production Build & Unblocked Chat Engine

**Date:** 2026-08-29  
**Target:** GrandStock (`grandstock.net`)

---

## 1. Overview & Problem Statement

Currently, the dev server is executing in Vite Development Mode (`npm run dev`), which exposes development virtual folders (`@vite`, `node_modules`, `src`, `@react-refresh`) over HTTP for Hot Module Reloading. Additionally, `securityShield.js` contains a `debugger;` statement inside a 300ms interval which freezes the browser's JavaScript execution thread whenever DevTools is opened, preventing user input, typing, and chat form submission (`onSubmit`).

This design spec addresses:
1. **Chat Unblocking**: Eliminating browser-freezing `debugger;` loops so typing, message sending, and screenshot attachments execute with 0ms latency.
2. **Zero-Exposure Production Mode**: Serving the application via Vite Production Preview (`npm run build` + `npm run preview`) with `sourcemap: false`, completely hiding `@vite`, `node_modules`, `src`, and `@react-refresh` from the DevTools Sources tab.
3. **Zero-Trust Server Validation**: Retaining server-side REST endpoints (`/api/chat/send`, `/api/tickets/*`, `/api/reviews/*`) to validate and persist state on the backend.

---

## 2. Architecture & Components

```
+-----------------------------------------------------------------------+
|                             BROWSER CLIENT                            |
|  - Renders Production Bundle (dist/assets/index-[hash].js)            |
|  - Zero source folders exposed (@vite, node_modules, src, etc. GONE)  |
|  - Non-blocking keyboard traps (F12, Ctrl+U, Ctrl+Shift+I)             |
|  - Unblocked 2-way live chat input & screenshot attachments           |
+-----------------------------------------------------------------------+
                                   |
                                   v HTTP REST API
+-----------------------------------------------------------------------+
|                          EXPRESS / VITE SERVER                        |
|  - POST /api/chat/send         (Server chat validation)                |
|  - POST /api/tickets/create    (Escrow ticket generation)              |
|  - POST /api/tickets/claim     (Staff agent assignment)                |
|  - POST /api/tickets/deliver   (Screenshot trade proof audit)          |
|  - POST /api/reviews/create    (Verified voucher ledger)               |
|  - Database: src/server/db.json                                       |
+-----------------------------------------------------------------------+
```

---

## 3. Component Details

### A. Security & Unblocked Chat (`src/utils/securityShield.js`)
* Remove the `setInterval(() => { debugger; }, 300)` loop.
* Retain non-blocking keyboard traps (`F12`, `Ctrl+U`, `Ctrl+Shift+I/J/C`, `Ctrl+S`, `Ctrl+P`) and `DisableDevtool` configuration.
* Ensure all form submissions (`onSubmit`) and input events (`onChange`) execute unhindered on the main JavaScript thread.

### B. Production Build & Server Mode (`vite.config.js`)
* Enforce production build settings:
  ```javascript
  build: {
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'framer-motion', 'lucide-react']
        }
      }
    }
  }
  ```
* Launch server in Production Mode: `npm run build` followed by `npm run preview -- --port 3000 --host`.
* Result in DevTools: All source folders (`@vite`, `node_modules`, `src`, `@react-refresh`) vanish completely.

### C. Zero-Trust Server Endpoints (`src/server/catalogServerPlugin.js`)
* Server receives `/api/chat/send` payloads `{ ticketId, sender, senderName, text, attachment }`.
* Server validates ticket existence and updates `src/server/db.json`.

---

## 4. Verification Plan

### Automated Verification:
- Execute `npm run build` and verify exit code 0.
- Verify `dist/` bundle contains only `dist/index.html` and `dist/assets/*.js`.

### Manual Verification:
- Open `http://localhost:3000` (or tunnel URL).
- Open DevTools -> Sources tab: Verify `@vite`, `node_modules`, `src`, and `@react-refresh` are 100% absent.
- Open **"My Orders"** -> **Live Chat** -> Type `"Hello"` and hit **Send**: Verify message appears immediately in chat feed and updates server `db.json`.
