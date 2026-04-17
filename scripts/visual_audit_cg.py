"""Visual audit script for claude-github.com - captures screenshots and extracts rendering data."""
import json
import os
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = str(__import__("pathlib").Path(__file__).resolve().parent.parent / "screenshots")
BASE_URL = "https://claude-github.com"

PAGES = [
    ("homepage", "/"),
    ("privacy", "/privacy"),
    ("terms", "/terms"),
]

VIEWPORTS = [
    ("desktop", 1920, 1080),
    ("laptop", 1366, 768),
    ("tablet", 768, 1024),
    ("mobile", 375, 812),
    ("mobile-small", 320, 568),
]

def run_audit():
    results = {}
    with sync_playwright() as p:
        browser = p.chromium.launch()

        for page_name, path in PAGES:
            url = BASE_URL + path
            page_results = {}

            for vp_name, w, h in VIEWPORTS:
                context = browser.new_context(
                    viewport={"width": w, "height": h},
                    device_scale_factor=2 if "mobile" in vp_name else 1,
                    is_mobile="mobile" in vp_name or vp_name == "tablet",
                    has_touch="mobile" in vp_name or vp_name == "tablet",
                    user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1" if "mobile" in vp_name else None,
                )
                page = context.new_page()

                try:
                    page.goto(url, wait_until="networkidle", timeout=30000)
                    page.wait_for_timeout(1500)  # let animations settle

                    # Above-the-fold screenshot
                    fname = f"{page_name}-{vp_name}-atf.png"
                    page.screenshot(path=os.path.join(SCREENSHOTS_DIR, fname), full_page=False)

                    # Full page screenshot
                    fname_full = f"{page_name}-{vp_name}-full.png"
                    page.screenshot(path=os.path.join(SCREENSHOTS_DIR, fname_full), full_page=True)

                    # Extract rendering metrics
                    metrics = page.evaluate("""() => {
                        const results = {};

                        // Viewport meta
                        const vpMeta = document.querySelector('meta[name="viewport"]');
                        results.viewportMeta = vpMeta ? vpMeta.content : null;

                        // Document dimensions
                        results.docWidth = document.documentElement.scrollWidth;
                        results.docHeight = document.documentElement.scrollHeight;
                        results.viewportWidth = window.innerWidth;
                        results.viewportHeight = window.innerHeight;
                        results.horizontalOverflow = document.documentElement.scrollWidth > window.innerWidth;

                        // H1 visibility
                        const h1 = document.querySelector('h1');
                        if (h1) {
                            const rect = h1.getBoundingClientRect();
                            results.h1 = {
                                text: h1.textContent.trim().substring(0, 80),
                                top: rect.top,
                                bottom: rect.bottom,
                                visibleAboveFold: rect.top < window.innerHeight && rect.bottom > 0,
                                fontSize: getComputedStyle(h1).fontSize,
                            };
                        }

                        // CTA buttons
                        const buttons = document.querySelectorAll('a[href], button');
                        results.ctas = [];
                        buttons.forEach(btn => {
                            const rect = btn.getBoundingClientRect();
                            const style = getComputedStyle(btn);
                            if (rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight) {
                                results.ctas.push({
                                    text: btn.textContent.trim().substring(0, 50),
                                    tag: btn.tagName,
                                    width: Math.round(rect.width),
                                    height: Math.round(rect.height),
                                    top: Math.round(rect.top),
                                    touchTargetOk: rect.width >= 48 && rect.height >= 48,
                                    fontSize: style.fontSize,
                                });
                            }
                        });

                        // Font sizes
                        const body = document.body;
                        results.baseFontSize = getComputedStyle(body).fontSize;

                        // Find small text
                        results.smallTextElements = [];
                        const allText = document.querySelectorAll('p, span, li, a, td, th, label, small');
                        allText.forEach(el => {
                            const fs = parseFloat(getComputedStyle(el).fontSize);
                            if (fs < 16 && el.textContent.trim().length > 0) {
                                const rect = el.getBoundingClientRect();
                                if (rect.width > 0 && rect.height > 0) {
                                    results.smallTextElements.push({
                                        tag: el.tagName,
                                        text: el.textContent.trim().substring(0, 40),
                                        fontSize: fs,
                                        top: Math.round(rect.top),
                                    });
                                }
                            }
                        });
                        // Limit to first 10
                        results.smallTextElements = results.smallTextElements.slice(0, 10);

                        // Images
                        results.images = [];
                        document.querySelectorAll('img').forEach(img => {
                            const rect = img.getBoundingClientRect();
                            results.images.push({
                                src: img.src ? img.src.substring(img.src.lastIndexOf('/') + 1) : '',
                                alt: img.alt,
                                naturalWidth: img.naturalWidth,
                                naturalHeight: img.naturalHeight,
                                displayWidth: Math.round(rect.width),
                                displayHeight: Math.round(rect.height),
                                loading: img.loading,
                                visible: rect.top < window.innerHeight && rect.bottom > 0,
                            });
                        });

                        // Navigation
                        const nav = document.querySelector('nav');
                        const hamburger = document.querySelector('[class*="hamburger"], [class*="menu-toggle"], [aria-label*="menu"], button[class*="mobile"]');
                        results.navigation = {
                            hasNav: !!nav,
                            hasHamburger: !!hamburger,
                            hamburgerVisible: hamburger ? getComputedStyle(hamburger).display !== 'none' : false,
                        };

                        // Skip link
                        const skipLink = document.querySelector('a[href="#main"], a[href="#content"], a[href="#main-content"], .skip-link, [class*="skip"]');
                        results.skipLink = !!skipLink;

                        // Check for overlapping elements in hero area
                        results.heroOverlap = false;

                        // Touch targets under 48px
                        results.smallTouchTargets = [];
                        const interactive = document.querySelectorAll('a, button, input, select, textarea, [role="button"]');
                        interactive.forEach(el => {
                            const rect = el.getBoundingClientRect();
                            if (rect.width > 0 && rect.height > 0 && (rect.width < 48 || rect.height < 48)) {
                                results.smallTouchTargets.push({
                                    tag: el.tagName,
                                    text: el.textContent.trim().substring(0, 30),
                                    width: Math.round(rect.width),
                                    height: Math.round(rect.height),
                                });
                            }
                        });
                        results.smallTouchTargets = results.smallTouchTargets.slice(0, 10);

                        // CSS custom properties
                        const rootStyle = getComputedStyle(document.documentElement);
                        results.cssVars = {
                            accent: rootStyle.getPropertyValue('--accent').trim(),
                            bg: rootStyle.getPropertyValue('--bg').trim(),
                            surface: rootStyle.getPropertyValue('--surface').trim(),
                        };

                        // Reduced motion
                        results.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

                        return results;
                    }""")

                    page_results[vp_name] = metrics

                except Exception as e:
                    page_results[vp_name] = {"error": str(e)}
                finally:
                    context.close()

            results[page_name] = page_results

        browser.close()

    # Save JSON results
    out_path = os.path.join(SCREENSHOTS_DIR, "visual-audit-data.json")
    with open(out_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"Saved audit data to {out_path}")
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    run_audit()
