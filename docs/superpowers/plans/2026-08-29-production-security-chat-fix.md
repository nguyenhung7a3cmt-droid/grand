# Zero-Exposure Production Build & Unblocked Chat Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unblock the live chat input by removing browser-freezing `debugger;` loops and deploy the application in Vite Production Preview mode (`npm run build` + `npm run preview`) to completely hide `@vite`, `node_modules`, `src`, and `@react-refresh` from DevTools.

**Architecture:** Remove `debugger;` statement from `securityShield.js` so JavaScript thread never pauses. Build production distribution with `sourcemap: false` and launch via `npm run preview -- --port 3000 --host` so DevTools receives only minified `dist/assets/index-[hash].js` bundle without any source folders.

**Tech Stack:** React 18, Vite 6, Node.js, Express/Vite Server Plugin, Tailwind CSS, Lucide Icons.

## Global Constraints

- Sourcemaps: Strictly `false` in production build.
- DevTools Folders: Zero source folders (`@vite`, `node_modules`, `src`, `@react-refresh`) exposed in DevTools Sources tab.
- Chat Latency: 0ms delay on typing (`onChange`), sending (`onSubmit`), and attachment rendering.

---

### Task 1: Clean `securityShield.js` to Unblock Browser Thread & Chat Execution

**Files:**
- Modify: `src/utils/securityShield.js:27-37`

**Interfaces:**
- Consumes: None
- Produces: `initSecurityShield()` without blocking `debugger;` loop

- [ ] **Step 1: Remove blocking `debugger;` loop in `src/utils/securityShield.js`**

```javascript
// Remove lines 27-37 in src/utils/securityShield.js:
// setInterval(() => { debugger; }, 300);
```

- [ ] **Step 2: Verify `securityShield.js` exports clean `initSecurityShield()`**

Ensure `initSecurityShield()` retains `DisableDevtool({ disableMenu: true, clearLog: true })` and `window.addEventListener('keydown', trapKey)` without any `debugger;` calls.

- [ ] **Step 3: Test chat event handler unblocking in Node script**

Run: `node "C:\Users\Admin\.gemini\antigravity\brain\e13f2429-1dda-4af4-a95d-9b488f7cb07e\scratch\test_full_chat_flow.js"`
Expected: Exit code 0, 4 messages in test log.

---

### Task 2: Configure Production Build & Zero-Exposure Preview Server

**Files:**
- Modify: `vite.config.js`
- Create/Overwrites: `dist/` production assets via `npm run build`

**Interfaces:**
- Consumes: `vite.config.js`
- Produces: Obfuscated, sourcemap-free `dist/assets/index-[hash].js`

- [ ] **Step 1: Update `vite.config.js` for production security**

```javascript
export default defineConfig({
  plugins: [react(), catalogPlugin()],
  server: {
    allowedHosts: true
  },
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
});
```

- [ ] **Step 2: Execute Production Build**

Run: `npm run build`
Expected: `✓ built in XXs`, output files in `dist/assets/`.

- [ ] **Step 3: Launch Production Preview Server**

Run: `npm run preview -- --port 3000 --host` (as background daemon)
Expected: Production preview server listening on `http://localhost:3000`.

---

### Task 3: Verify Zero-Exposure DevTools & End-to-End Chat Delivery

**Files:**
- Test: HTTP check on `http://localhost:3000`
- Database: `src/server/db.json`

**Interfaces:**
- Consumes: Production Preview Server at `http://localhost:3000`
- Produces: 100% hidden source folders and persistent chat messages

- [ ] **Step 1: Test HTTP 200 response on port 3000**

Run: `node "C:\Users\Admin\.gemini\antigravity\brain\e13f2429-1dda-4af4-a95d-9b488f7cb07e\scratch\test_http.js"`
Expected: `HTTP STATUS: 200`.

- [ ] **Step 2: Verify DevTools Sources folder concealment**

Inspect HTML output from `http://localhost:3000`: Confirm `index.html` references only `/assets/vendor-[hash].js` and `/assets/index-[hash].js`, with zero references to `/src/` or `/@vite/`.

- [ ] **Step 3: Verify live ticket messaging persistence in `db.json`**

Execute test order and chat send payload: Verify `src/server/db.json` records the ticket and messages array.
