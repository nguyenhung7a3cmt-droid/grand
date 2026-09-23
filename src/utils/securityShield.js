export function initSecurityShield() {
  if (typeof window === 'undefined') return;

  // Multi-Target Keyboard Trap for F12, Ctrl+U, Ctrl+Shift+I, etc.
  function trapKey(e) {
    const k = e.keyCode || e.which;
    const isCtrl = e.ctrlKey || e.metaKey;

    // F12
    if (k === 123 || e.key === 'F12') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+U (View Source)
    if (isCtrl && (k === 85 || e.key === 'u' || e.key === 'U')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+Shift+I / J / C (Inspect / Console)
    if (isCtrl && e.shiftKey && (k === 73 || k === 74 || k === 67 || e.key === 'I' || e.key === 'J' || e.key === 'C')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+S / Ctrl+P (Save / Print Page)
    if (isCtrl && (k === 83 || k === 80 || e.key === 's' || e.key === 'p')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }

  try {
    window.addEventListener('keydown', trapKey, { capture: true, passive: false });
    document.addEventListener('keydown', trapKey, { capture: true, passive: false });
  } catch(e) {}
}
