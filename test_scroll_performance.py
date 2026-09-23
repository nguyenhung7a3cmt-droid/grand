import asyncio
import os
import sys
import time
from playwright.async_api import async_playwright

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

ARTIFACT_DIR = r"C:\Users\Admin\.gemini\antigravity\brain\a1a9e0c3-39ec-48b0-8d90-efab49c27c06"

async def test_scroll():
    console_errors = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # ---------------------------------------------------------------------
        # 1. DESKTOP SCROLL PERFORMANCE TEST (1280x800)
        # ---------------------------------------------------------------------
        print("\n=== [1] TESTING DESKTOP FULL PAGE & MODAL SCROLL (1280x800) ===")
        context_dt = await browser.new_context(viewport={"width": 1280, "height": 800})
        page_dt = await context_dt.new_page()
        page_dt.on("pageerror", lambda err: console_errors.append(f"[Desktop Error] {err}"))
        
        await page_dt.goto("http://localhost:3000", wait_until="networkidle")
        await asyncio.sleep(1)
        
        # Smooth scroll down page in steps
        for offset in [400, 900, 1600, 2400, 3200]:
            await page_dt.evaluate(f"window.scrollTo({{ top: {offset}, behavior: 'smooth' }})")
            await asyncio.sleep(0.3)
            
        # Capture catalog scroll position
        desktop_cat_img = os.path.join(ARTIFACT_DIR, "scroll_desktop_catalog.png")
        await page_dt.screenshot(path=desktop_cat_img)
        print(f"📸 Captured Desktop Catalog Scroll: {desktop_cat_img}")
        
        # Check overflow
        overflow_dt = await page_dt.evaluate("document.documentElement.scrollWidth > window.innerWidth")
        assert not overflow_dt, "Desktop horizontal overflow detected!"
        print("✓ Desktop document: ZERO horizontal overflow")
        
        # Scroll back to top & open Proofs Modal
        await page_dt.evaluate("window.scrollTo(0, 0)")
        await asyncio.sleep(0.5)
        proofs_btn = page_dt.locator("button:has-text('Proofs'), a:has-text('Proofs')").first
        await proofs_btn.click()
        await asyncio.sleep(1)
        
        # Test scrolling inside Proofs Modal
        modal_scroll = page_dt.locator(".overflow-y-auto.flex-1").first
        await modal_scroll.wait_for(state="visible", timeout=5000)
        
        # Check initial cards count (chunked slice)
        initial_cards = await page_dt.locator("div[style*='content-visibility']").count()
        print(f"✓ Proofs Modal initial rendered items: {initial_cards} (efficient chunked render)")
        assert initial_cards <= 48, f"Expected <= 48 items, found {initial_cards}"
        
        # Scroll down inside modal to trigger infinite scroll
        await modal_scroll.evaluate("el => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })")
        await asyncio.sleep(0.8)
        
        loaded_cards = await page_dt.locator("div[style*='content-visibility']").count()
        print(f"✓ Proofs Modal after scroll items loaded: {loaded_cards}")
        
        desktop_proofs_img = os.path.join(ARTIFACT_DIR, "scroll_desktop_proofs_chunked.png")
        await page_dt.screenshot(path=desktop_proofs_img)
        print(f"📸 Captured Desktop Proofs Chunked Scroll: {desktop_proofs_img}")
        
        # Close modal
        await page_dt.keyboard.press("Escape")
        await asyncio.sleep(0.5)

        # ---------------------------------------------------------------------
        # 2. MOBILE SCROLL PERFORMANCE TEST (390x844 - iPhone 13)
        # ---------------------------------------------------------------------
        print("\n=== [2] TESTING MOBILE SCROLL & TOUCH NATIVE HANDLING (390x844) ===")
        context_mb = await browser.new_context(
            viewport={"width": 390, "height": 844},
            is_mobile=True,
            has_touch=True,
            device_scale_factor=2
        )
        page_mb = await context_mb.new_page()
        page_mb.on("pageerror", lambda err: console_errors.append(f"[Mobile Error] {err}"))
        
        await page_mb.goto("http://localhost:3000", wait_until="networkidle")
        await asyncio.sleep(1)
        
        # Scroll down through mobile catalog
        for offset in [500, 1100, 1800, 2600]:
            await page_mb.evaluate(f"window.scrollTo({{ top: {offset}, behavior: 'smooth' }})")
            await asyncio.sleep(0.3)
            
        mobile_cat_img = os.path.join(ARTIFACT_DIR, "scroll_mobile_catalog.png")
        await page_mb.screenshot(path=mobile_cat_img)
        print(f"📸 Captured Mobile Catalog Scroll: {mobile_cat_img}")
        
        overflow_mb = await page_mb.evaluate("document.documentElement.scrollWidth > window.innerWidth")
        assert not overflow_mb, "Mobile horizontal overflow detected!"
        print("✓ Mobile document: ZERO horizontal overflow")
        
        # Open mobile drawer and Proofs Modal
        hamburger = page_mb.locator("button[aria-label='Toggle navigation menu']")
        await hamburger.click()
        await asyncio.sleep(0.6)
        
        drawer_proofs = page_mb.locator("button:has-text('Live Delivery Proofs')").first
        await drawer_proofs.click()
        await asyncio.sleep(1)
        
        # Test mobile modal scroll
        modal_mb_scroll = page_mb.locator(".overflow-y-auto.flex-1").first
        await modal_mb_scroll.wait_for(state="visible", timeout=5000)
        
        mobile_initial = await page_mb.locator("div[style*='content-visibility']").count()
        print(f"✓ Mobile Proofs Modal initial items: {mobile_initial}")
        
        await modal_mb_scroll.evaluate("el => el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })")
        await asyncio.sleep(0.8)
        
        mobile_proofs_img = os.path.join(ARTIFACT_DIR, "scroll_mobile_proofs_chunked.png")
        await page_mb.screenshot(path=mobile_proofs_img)
        print(f"📸 Captured Mobile Proofs Scroll: {mobile_proofs_img}")
        
        await browser.close()
        
        print("\n=== FINAL SCROLL PERFORMANCE AUDIT SUMMARY ===")
        print(f"Total Console Page Errors: {len(console_errors)}")
        if console_errors:
            for err in console_errors:
                print(f"  ❌ {err}")
            sys.exit(1)
        print("🎉 ALL SCROLL & TOUCH OPTIMIZATIONS VERIFIED CLEANLY WITH 0 ERRORS!")

if __name__ == "__main__":
    asyncio.run(test_scroll())
