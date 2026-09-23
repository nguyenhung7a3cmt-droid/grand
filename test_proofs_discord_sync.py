import asyncio
import os
import sys
from playwright.async_api import async_playwright

try:
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
except Exception:
    pass

ARTIFACT_DIR = r"C:\Users\Admin\.gemini\antigravity\brain\a1a9e0c3-39ec-48b0-8d90-efab49c27c06"

async def run_tests():
    console_errors = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # -------------------------------------------------------------
        # 1. DESKTOP TEST (1280x800)
        # -------------------------------------------------------------
        print("\n=== [1] TESTING DESKTOP PROOFS MODAL (1280x800) ===")
        context_dt = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            device_scale_factor=1
        )
        page_dt = await context_dt.new_page()
        page_dt.on("pageerror", lambda err: console_errors.append(f"[Desktop Error] {err}"))
        
        await page_dt.goto("http://localhost:3000", wait_until="networkidle")
        await asyncio.sleep(1)
        
        # Click Proofs in Navbar
        proofs_btn = page_dt.locator("button:has-text('Proofs'), a:has-text('Proofs')").first
        await proofs_btn.wait_for(state="visible", timeout=5000)
        await proofs_btn.click()
        await asyncio.sleep(1)
        
        # Verify Proofs Modal is visible
        modal_title = page_dt.locator("h2:has-text('Public Proofs')")
        assert await modal_title.is_visible(), "Proofs Modal title not visible!"
        print("✓ Proofs Modal is open and visible on Desktop")
        
        # Verify "+ Add Proof" button is completely REMOVED
        add_proof_btn = page_dt.locator("button:has-text('+ Add Proof'), button:has-text('Add Proof')")
        add_proof_count = await add_proof_btn.count()
        assert add_proof_count == 0, f"Found {add_proof_count} manual 'Add Proof' buttons, expected 0!"
        print("✓ Confirmed: Manual '+ Add Proof' button is GONE from Proofs Modal")
        
        # Verify Discord Auto-Synced status badge is present
        discord_badge = page_dt.locator("text='AUTO-SYNCED'")
        assert await discord_badge.is_visible(), "Discord Auto-Synced badge not visible!"
        print("✓ Confirmed: 'DISCORD BOT: AUTO-SYNCED' badge is clearly rendered")
        
        # Verify items loaded
        proof_cards = page_dt.locator("div[class*='border-gs-border']:has-text('VERIFIED')")
        cards_count = await proof_cards.count()
        print(f"✓ Total verified proof cards visible on Desktop: {cards_count}")
        assert cards_count > 0, "No proof items rendered!"
        
        # Check horizontal overflow
        overflow = await page_dt.evaluate("document.documentElement.scrollWidth > window.innerWidth")
        assert not overflow, "Horizontal overflow detected on Desktop!"
        print("✓ Desktop document horizontal overflow: NONE (scrollWidth <= innerWidth)")
        
        # Screenshot Desktop Proofs Modal
        desktop_img = os.path.join(ARTIFACT_DIR, "proofs_discord_auto_desktop.png")
        await page_dt.screenshot(path=desktop_img, full_page=False)
        print(f"📸 Captured Desktop Screenshot: {desktop_img}")
        
        # Test clicking a card to open Receipt Lightbox
        first_card = page_dt.locator("div.cursor-pointer:has-text('Details')").first
        if await first_card.is_visible():
            await first_card.click()
            await asyncio.sleep(1)
            receipt_modal = page_dt.locator("text='IN-GAME TRADE RECEIPT', text='DELIVERY AUDIT CERTIFICATE'")
            if await receipt_modal.count() > 0:
                print("✓ Verified PhotoProofReceipt Lightbox opens cleanly")
                receipt_img = os.path.join(ARTIFACT_DIR, "proofs_receipt_lightbox.png")
                await page_dt.screenshot(path=receipt_img, full_page=False)
                print(f"📸 Captured Receipt Lightbox Screenshot: {receipt_img}")
                # Close receipt
                close_rec = page_dt.locator("button:has-text('Close Receipt')")
                if await close_rec.is_visible():
                    await close_rec.click()
                    await asyncio.sleep(0.5)
        
        # -------------------------------------------------------------
        # 2. MOBILE TEST (390x844 - iPhone 13)
        # -------------------------------------------------------------
        print("\n=== [2] TESTING MOBILE PROOFS MODAL (390x844) ===")
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
        
        # Open Hamburger menu on Mobile
        hamburger = page_mb.locator("button[aria-label='Toggle navigation menu']")
        await hamburger.wait_for(state="visible", timeout=5000)
        await hamburger.click()
        await asyncio.sleep(0.8)
        
        # Click Live Delivery Proofs in mobile drawer
        drawer_proofs = page_mb.locator("button:has-text('Live Delivery Proofs')").first
        await drawer_proofs.wait_for(state="visible", timeout=5000)
        await drawer_proofs.click()
        await asyncio.sleep(1)
        
        # Verify Proofs Modal opens on Mobile
        modal_mb = page_mb.locator("h2:has-text('Public Proofs')")
        assert await modal_mb.is_visible(), "Mobile Proofs Modal title not visible!"
        print("✓ Mobile Proofs Modal is open and visible")
        
        # Verify "+ Add Proof" button is completely absent on Mobile
        add_proof_mb = page_mb.locator("button:has-text('+ Add Proof'), button:has-text('Add Proof')")
        assert await add_proof_mb.count() == 0, "Found Add Proof button on mobile!"
        print("✓ Confirmed: Manual '+ Add Proof' button is absent on Mobile")
        
        # Verify auto-synced badge
        badge_mb = page_mb.locator("text='AUTO-SYNCED'")
        assert await badge_mb.is_visible(), "Discord Auto-Synced badge not visible on Mobile!"
        print("✓ Confirmed: Discord Auto-Synced badge renders responsively on Mobile")
        
        # Check horizontal overflow on Mobile
        overflow_mb = await page_mb.evaluate("document.documentElement.scrollWidth > window.innerWidth")
        assert not overflow_mb, "Horizontal overflow detected on Mobile!"
        print("✓ Mobile document horizontal overflow: NONE (scrollWidth <= innerWidth)")
        
        # Screenshot Mobile Proofs Modal
        mobile_img = os.path.join(ARTIFACT_DIR, "proofs_discord_auto_mobile.png")
        await page_mb.screenshot(path=mobile_img, full_page=False)
        print(f"📸 Captured Mobile Screenshot: {mobile_img}")
        
        await browser.close()
        
        print("\n=== SUMMARY ===")
        print(f"Total Console Page Errors: {len(console_errors)}")
        if console_errors:
            for err in console_errors:
                print(f"  ❌ {err}")
            sys.exit(1)
        else:
            print("🎉 ALL ASSERTIONS PASSED WITH ZERO CONSOLE ERRORS!")

if __name__ == "__main__":
    asyncio.run(run_tests())
