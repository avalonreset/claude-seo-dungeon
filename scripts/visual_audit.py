"""
Visual and mobile rendering audit script for claude-github.com
Captures screenshots at multiple viewports and performs automated checks.
"""
import json
import sys
from playwright.sync_api import sync_playwright

URL = "https://claude-github.com"
SCREENSHOT_DIR = "E:/hackathon/claude-seo-dungeon/screenshots"

VIEWPORTS = [
    {"name": "desktop", "width": 1920, "height": 1080},
    {"name": "laptop", "width": 1366, "height": 768},
    {"name": "tablet", "width": 768, "height": 1024},
    {"name": "mobile", "width": 375, "height": 812},
]

def run_audit():
    results = {}
    with sync_playwright() as p:
        browser = p.chromium.launch()

        for vp in VIEWPORTS:
            name = vp["name"]
            print(f"[*] Capturing {name} ({vp['width']}x{vp['height']})...")
            context = browser.new_context(
                viewport={"width": vp["width"], "height": vp["height"]},
                device_scale_factor=2 if name == "mobile" else 1,
            )
            page = context.new_page()
            page.goto(URL, wait_until="networkidle", timeout=30000)
            # Wait for animations/fonts to settle
            page.wait_for_timeout(2000)

            # Above-the-fold screenshot
            page.screenshot(
                path=f"{SCREENSHOT_DIR}/{name}_above_fold.png",
                full_page=False,
            )
            # Full page screenshot
            page.screenshot(
                path=f"{SCREENSHOT_DIR}/{name}_full_page.png",
                full_page=True,
            )

            # Run analysis in browser context
            analysis = page.evaluate("""() => {
                const results = {};

                // 1. Viewport meta tag
                const vpMeta = document.querySelector('meta[name="viewport"]');
                results.viewportMeta = vpMeta ? vpMeta.getAttribute('content') : null;

                // 2. Document dimensions - check horizontal overflow
                results.docWidth = document.documentElement.scrollWidth;
                results.viewportWidth = window.innerWidth;
                results.hasHorizontalScroll = document.documentElement.scrollWidth > window.innerWidth;

                // 3. H1 visibility above the fold
                const h1 = document.querySelector('h1');
                if (h1) {
                    const rect = h1.getBoundingClientRect();
                    results.h1 = {
                        text: h1.textContent.trim().substring(0, 100),
                        top: rect.top,
                        bottom: rect.bottom,
                        visibleAboveFold: rect.top < window.innerHeight && rect.bottom > 0,
                    };
                }

                // 4. Primary CTA above the fold
                const ctas = document.querySelectorAll('a[href], button');
                const ctaList = [];
                ctas.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    const text = el.textContent.trim().substring(0, 60);
                    if (text && rect.top < window.innerHeight && rect.height > 0) {
                        ctaList.push({
                            tag: el.tagName,
                            text: text,
                            top: Math.round(rect.top),
                            width: Math.round(rect.width),
                            height: Math.round(rect.height),
                            href: el.getAttribute('href') || '',
                        });
                    }
                });
                results.ctasAboveFold = ctaList.slice(0, 20);

                // 5. Touch target analysis (elements < 44x44)
                const interactives = document.querySelectorAll('a, button, input, select, textarea, [role="button"], [onclick]');
                const smallTargets = [];
                interactives.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        if (rect.width < 44 || rect.height < 44) {
                            const text = el.textContent.trim().substring(0, 40);
                            if (text || el.getAttribute('aria-label')) {
                                smallTargets.push({
                                    tag: el.tagName,
                                    text: text || el.getAttribute('aria-label') || '',
                                    width: Math.round(rect.width),
                                    height: Math.round(rect.height),
                                    top: Math.round(rect.top),
                                });
                            }
                        }
                    }
                });
                results.smallTouchTargets = smallTargets.slice(0, 30);

                // 6. Font size check - find text smaller than 16px
                const allText = document.querySelectorAll('p, span, a, li, td, th, label, div');
                const smallText = [];
                const seen = new Set();
                allText.forEach(el => {
                    const style = window.getComputedStyle(el);
                    const fontSize = parseFloat(style.fontSize);
                    if (fontSize < 14 && el.textContent.trim().length > 5) {
                        const key = el.tagName + fontSize + el.textContent.trim().substring(0, 20);
                        if (!seen.has(key)) {
                            seen.add(key);
                            smallText.push({
                                tag: el.tagName,
                                text: el.textContent.trim().substring(0, 50),
                                fontSize: fontSize,
                            });
                        }
                    }
                });
                results.smallText = smallText.slice(0, 20);

                // 7. Image analysis
                const images = document.querySelectorAll('img');
                const imgList = [];
                images.forEach(img => {
                    const rect = img.getBoundingClientRect();
                    imgList.push({
                        src: (img.getAttribute('src') || '').substring(0, 100),
                        alt: img.getAttribute('alt') || '',
                        width: Math.round(rect.width),
                        height: Math.round(rect.height),
                        naturalWidth: img.naturalWidth,
                        naturalHeight: img.naturalHeight,
                        loading: img.getAttribute('loading') || 'eager',
                        hasExplicitDimensions: img.hasAttribute('width') && img.hasAttribute('height'),
                    });
                });
                results.images = imgList;

                // 8. CLS-prone elements: images without dimensions, iframes, ads
                const clsRisks = [];
                images.forEach(img => {
                    if (!img.hasAttribute('width') || !img.hasAttribute('height')) {
                        const src = (img.getAttribute('src') || '').substring(0, 80);
                        if (src) {
                            clsRisks.push({type: 'img-no-dimensions', src: src});
                        }
                    }
                });
                const iframes = document.querySelectorAll('iframe');
                iframes.forEach(iframe => {
                    if (!iframe.hasAttribute('width') || !iframe.hasAttribute('height')) {
                        clsRisks.push({type: 'iframe-no-dimensions', src: (iframe.src || '').substring(0, 80)});
                    }
                });
                // Check for web fonts that might cause FOUT/FOIT
                const fontLinks = document.querySelectorAll('link[href*="fonts"]');
                fontLinks.forEach(link => {
                    clsRisks.push({type: 'web-font', href: link.href.substring(0, 100), display: link.getAttribute('display') || 'unknown'});
                });
                results.clsRisks = clsRisks;

                // 9. Navigation check
                const nav = document.querySelector('nav');
                const hamburger = document.querySelector('[class*="burger"], [class*="hamburger"], [class*="menu-toggle"], [aria-label*="menu"], [class*="mobile-menu"], button[class*="menu"]');
                results.navigation = {
                    hasNav: !!nav,
                    hasHamburger: !!hamburger,
                    hamburgerVisible: hamburger ? window.getComputedStyle(hamburger).display !== 'none' : false,
                };

                // 10. Overlapping elements check (sample)
                const sections = document.querySelectorAll('section, header, footer, main, [class*="hero"], [class*="banner"]');
                const overlaps = [];
                const sectionRects = [];
                sections.forEach(s => {
                    const rect = s.getBoundingClientRect();
                    const id = s.id || s.className.toString().substring(0, 30);
                    sectionRects.push({id, top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right});
                });
                for (let i = 0; i < sectionRects.length; i++) {
                    for (let j = i + 1; j < sectionRects.length; j++) {
                        const a = sectionRects[i];
                        const b = sectionRects[j];
                        if (a.top < b.bottom && a.bottom > b.top && a.left < b.right && a.right > b.left) {
                            // Check if it's a parent-child relationship (expected overlap)
                            if (Math.abs(a.top - b.top) < 5 && Math.abs(a.bottom - b.bottom) < 5) continue;
                            overlaps.push({a: a.id, b: b.id});
                        }
                    }
                }
                results.overlaps = overlaps.slice(0, 10);

                // 11. Z-index stacking
                const allEls = document.querySelectorAll('*');
                const zIndexes = [];
                allEls.forEach(el => {
                    const z = window.getComputedStyle(el).zIndex;
                    if (z !== 'auto' && parseInt(z) > 10) {
                        zIndexes.push({
                            tag: el.tagName,
                            class: el.className.toString().substring(0, 40),
                            zIndex: parseInt(z),
                        });
                    }
                });
                results.highZIndex = zIndexes.slice(0, 15);

                // 12. Scroll-reveal / animation elements
                const animated = document.querySelectorAll('[class*="reveal"], [class*="animate"], [class*="fade"], [data-aos], [class*="typewriter"]');
                results.animatedElements = animated.length;

                // 13. Check font loading
                results.fontsLoaded = document.fonts ? document.fonts.status : 'unknown';

                return results;
            }""")

            results[name] = analysis
            context.close()

        # Also test mobile hamburger menu interaction
        print("[*] Testing mobile menu interaction...")
        context = browser.new_context(
            viewport={"width": 375, "height": 812},
            device_scale_factor=2,
        )
        page = context.new_page()
        page.goto(URL, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(1500)

        # Try to find and click hamburger menu
        menu_result = page.evaluate("""() => {
            const selectors = [
                '[class*="burger"]', '[class*="hamburger"]', '[class*="menu-toggle"]',
                '[aria-label*="menu"]', '[class*="mobile-menu"]', 'button[class*="menu"]',
                '.nav-toggle', '#nav-toggle', '[class*="nav-icon"]',
                'header button', 'nav button'
            ];
            for (const sel of selectors) {
                const el = document.querySelector(sel);
                if (el && window.getComputedStyle(el).display !== 'none') {
                    return {found: true, selector: sel, text: el.textContent.trim().substring(0, 30)};
                }
            }
            return {found: false};
        }""")

        results["mobile_menu"] = menu_result

        if menu_result.get("found"):
            try:
                sel = menu_result["selector"]
                page.click(sel)
                page.wait_for_timeout(800)
                page.screenshot(
                    path=f"{SCREENSHOT_DIR}/mobile_menu_open.png",
                    full_page=False,
                )
                results["mobile_menu"]["screenshot"] = "captured"
            except Exception as e:
                results["mobile_menu"]["error"] = str(e)

        # Test FAQ accordion
        print("[*] Testing FAQ accordion...")
        faq_result = page.evaluate("""() => {
            const faqItems = document.querySelectorAll('[class*="faq"] summary, [class*="faq"] button, [class*="accordion"] button, details summary');
            return {
                count: faqItems.length,
                items: Array.from(faqItems).slice(0, 5).map(el => ({
                    text: el.textContent.trim().substring(0, 60),
                    tag: el.tagName,
                }))
            };
        }""")
        results["faq"] = faq_result

        context.close()
        browser.close()

    return results


if __name__ == "__main__":
    results = run_audit()
    output_path = f"{SCREENSHOT_DIR}/audit_results.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\n[+] Audit results saved to {output_path}")
    print(json.dumps(results, indent=2))
