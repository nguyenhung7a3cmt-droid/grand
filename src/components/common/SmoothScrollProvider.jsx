import React, { createContext, useContext, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { soundFx } from '../../utils/soundFx';

const SmoothScrollContext = createContext(null);

// Quintic easing for heavy, silky glide
function easeInOutQuint(x) {
  return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
}

export function SmoothScrollProvider({ children }) {
  const lenisRef = useRef(null);

  useEffect(() => {
    // 1. Initialize Lenis Virtual Scroll with optimized parameters
    const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    const lenis = new Lenis({
      duration: isTouch ? 0 : 0.9,
      lerp: isTouch ? 1 : 0.1,
      smoothWheel: !isTouch,
      syncTouch: false,
      touchMultiplier: 1.0,
      wheelMultiplier: 1.0,
      infinite: false,
      prevent: (node) => {
        if (!node) return false;
        // 1. Explicit data-lenis-prevent flag
        if (
          node.hasAttribute?.('data-lenis-prevent') ||
          (node.closest && node.closest('[data-lenis-prevent]') !== null)
        ) {
          return true;
        }
        // 2. Any fixed/absolute modal, dialog, drawer, dropdown, or scrollable container
        if (node.closest) {
          const isInsideOverlayOrModal = node.closest(
            '[role="dialog"], [data-modal], .fixed, .drawer, .modal, .overflow-y-auto, .overflow-y-scroll, .overflow-auto'
          );
          if (isInsideOverlayOrModal && isInsideOverlayOrModal !== document.body && isInsideOverlayOrModal !== document.documentElement) {
            return true;
          }
        }
        return false;
      }
    });

    lenisRef.current = lenis;

    // Attach to window for global access
    if (typeof window !== 'undefined') {
      window.__lenis = lenis;
    }

    // 2. RequestAnimationFrame Loop
    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // 3. Cleanup
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
      if (typeof window !== 'undefined') {
        window.__lenis = null;
      }
    };
  }, []);

  // Butter-Smooth Gliding Function
  const smoothGlideTo = (targetY, duration = 850) => {
    const startY = window.pageYOffset || document.documentElement.scrollTop;
    const distance = targetY - startY;
    if (Math.abs(distance) < 5) return;

    let startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = easeInOutQuint(progress);
      const currentPos = startY + distance * easedProgress;

      window.scrollTo(0, currentPos);

      // Keep Lenis synced with manual scroll
      if (lenisRef.current) {
        lenisRef.current.scrollTo(currentPos, { immediate: true });
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  };

  const scrollTo = (target, options = {}) => {
    let targetElement = null;
    if (typeof target === 'string') {
      targetElement = document.querySelector(target);
    } else if (target instanceof HTMLElement) {
      targetElement = target;
    }

    if (targetElement) {
      const offset = options.offset !== undefined ? options.offset : -80;
      const rect = targetElement.getBoundingClientRect();
      const targetY = rect.top + window.pageYOffset + offset;

      // Play subtle glide whoosh sound
      soundFx.glideWhoosh();

      // Trigger quintic glide
      smoothGlideTo(targetY, options.duration || 900);
    } else if (typeof target === 'number') {
      smoothGlideTo(target, options.duration || 900);
    }
  };

  return (
    <SmoothScrollContext.Provider value={{ lenis: lenisRef.current, scrollTo, smoothGlideTo }}>
      {children}
    </SmoothScrollContext.Provider>
  );
}

export function useSmoothScroll() {
  const context = useContext(SmoothScrollContext);
  if (!context) {
    return {
      lenis: null,
      scrollTo: (target) => {
        const el = typeof target === 'string' ? document.querySelector(target) : target;
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
      smoothGlideTo: (y) => window.scrollTo({ top: y, behavior: 'smooth' })
    };
  }
  return context;
}

export default SmoothScrollProvider;
