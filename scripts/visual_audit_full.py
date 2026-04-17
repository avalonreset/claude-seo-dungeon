"""
Comprehensive Visual & Mobile Rendering Audit
Captures screenshots at multiple viewports and extracts rendering metrics.
"""

import json
import sys
from playwright.sync_api import sync_playwright

URL = "https://claude-github.com"
OUT_DIR = str(__import__("pathlib").Path(__file__).resolve().parent.parent / "screenshots")

VIEWPORTS = [
    {"name": "desktop",  "width": 1920, "height": 1080},
    {"name": "laptop",   "width": 1366, "height": 768},
    {"name": "tablet",   "width": 768,  "height": 1024},
    {"name": "mobile",   "width": 375,  "height": 812},
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
                is_mobile=(name == "mobile"),
                has_touch=(name in ("mobile", "tablet")),
            )
            page = context.new_page()

            try:
                page.goto(URL, wait_until="networkidle", timeout=30000)
            except Exception as e:
                print(f"  Warning on load: {e}")

            # Above-the-fold screenshot
            atf_path = f"{OUT_DIR}/{name}_above_fold.png"
            page.screenshot(path=atf_path, full_page=False)
            print(f"  Saved: {atf_path}")

            # Full page screenshot
            full_path = f"{OUT_DIR}/{name}_full_page.png"
            page.screenshot(path=full_path, full_page=True)
            print(f"  Saved: {full_path}")

            # Run in-page audit
            metrics = page.evaluate("""() => {
                const results = {};

                // 1. Viewport meta tag
                const vpMeta = document.querySelector('meta[name="viewport"]');
                results.viewport_meta = vpMeta ? vpMeta.getAttribute('content') : null;

                // 2. Document dimensions vs viewport (horizontal overflow check)
                results.document_width = document.documentElement.scrollWidth;
                results.viewport_width = window.innerWidth;
                results.has_horizontal_overflow = document.documentElement.scrollWidth > window.innerWidth;
                results.overflow_px = Math.max(0, document.documentElement.scrollWidth - window.innerWidth);

                // 3. H1 analysis
                const h1 = document.querySelector('h1');
                if (h1) {
                    const rect = h1.getBoundingClientRect();
                    const style = window.getComputedStyle(h1);
                    results.h1 = {
                        text: h1.textContent.trim().substring(0, 100),
                        visible_above_fold: rect.top < window.innerHeight && rect.bottom > 0,
                        top: rect.top,
                        font_size: style.fontSize,
                        font_weight: style.fontWeight,
                    };
                } else {
                    results.h1 = null;
                }

                // 4. CTA / primary links above the fold
                const links = document.querySelectorAll('a, button');
                const ctas_above_fold = [];
                links.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.top < window.innerHeight && rect.bottom > 0 && rect.width > 0) {
                        const style = window.getComputedStyle(el);
                        ctas_above_fold.push({
                            tag: el.tagName,
                            text: el.textContent.trim().substring(0, 60),
                            href: el.href || null,
                            width: Math.round(rect.width),
                            height: Math.round(rect.height),
                            top: Math.round(rect.top),
                            font_size: style.fontSize,
                        });
                    }
                });
                results.ctas_above_fold = ctas_above_fold;

                // 5. Touch target analysis (all interactive elements)
                const interactive = document.querySelectorAll('a, button, input, select, textarea, [role="button"]');
                const small_targets = [];
                interactive.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        if (rect.width < 48 || rect.height < 48) {
                            small_targets.push({
                                tag: el.tagName,
                                text: (el.textContent || el.getAttribute('aria-label') || '').trim().substring(0, 50),
                                width: Math.round(rect.width),
                                height: Math.round(rect.height),
                                top: Math.round(rect.top),
                            });
                        }
                    }
                });
                results.small_touch_targets = small_targets;
                results.total_interactive = interactive.length;

                // 6. Font size analysis
                const textElements = document.querySelectorAll('p, span, li, td, th, label, div');
                const fontSizes = {};
                let smallTextCount = 0;
                textElements.forEach(el => {
                    const style = window.getComputedStyle(el);
                    const size = parseFloat(style.fontSize);
                    if (el.textContent.trim().length > 0 && el.children.length === 0) {
                        const key = Math.round(size) + 'px';
                        fontSizes[key] = (fontSizes[key] || 0) + 1;
                        if (size < 16) smallTextCount++;
                    }
                });
                results.font_size_distribution = fontSizes;
                results.small_text_elements = smallTextCount;

                // 7. Image analysis
                const images = document.querySelectorAll('img');
                const imageData = [];
                images.forEach(img => {
                    const rect = img.getBoundingClientRect();
                    imageData.push({
                        src: (img.src || '').substring(0, 100),
                        alt: img.alt || '',
                        natural_width: img.naturalWidth,
                        natural_height: img.naturalHeight,
                        rendered_width: Math.round(rect.width),
                        rendered_height: Math.round(rect.height),
                        loading: img.loading || 'eager',
                        has_explicit_dimensions: img.hasAttribute('width') && img.hasAttribute('height'),
                        above_fold: rect.top < window.innerHeight,
                    });
                });
                results.images = imageData;

                // 8. Layout shift indicators (elements with position issues)
                const allElements = document.querySelectorAll('*');
                const overflowing = [];
                allElements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.right > window.innerWidth + 5 && rect.width > 0) {
                        const tag = el.tagName;
                        const cls = el.className ? el.className.toString().substring(0, 50) : '';
                        overflowing.push({
                            tag: tag,
                            class: cls,
                            right_edge: Math.round(rect.right),
                            width: Math.round(rect.width),
                        });
                    }
                });
                results.overflowing_elements = overflowing.slice(0, 20);

                // 9. Navigation analysis
                const nav = document.querySelector('nav') || document.querySelector('[role="navigation"]');
                results.has_nav = !!nav;
                if (nav) {
                    const navRect = nav.getBoundingClientRect();
                    results.nav_visible = navRect.height > 0;
                    results.nav_items = nav.querySelectorAll('a').length;
                }

                // 10. Hero / main content area
                const main = document.querySelector('main') || document.querySelector('[role="main"]') || document.querySelector('.hero') || document.querySelector('#hero');
                if (main) {
                    const rect = main.getBoundingClientRect();
                    results.main_content = {
                        top: Math.round(rect.top),
                        height: Math.round(rect.height),
                        above_fold: rect.top < window.innerHeight,
                    };
                }

                // 11. CSS media queries check (rough)
                const stylesheets = document.styleSheets;
                let mediaQueryCount = 0;
                try {
                    for (let i = 0; i < stylesheets.length; i++) {
                        try {
                            const rules = stylesheets[i].cssRules || [];
                            for (let j = 0; j < rules.length; j++) {
                                if (rules[j].type === CSSRule.MEDIA_RULE) {
                                    mediaQueryCount++;
                                }
                            }
                        } catch(e) {} // CORS
                    }
                } catch(e) {}
                results.css_media_queries_count = mediaQueryCount;

                // 12. Page title and meta
                results.title = document.title;
                const desc = document.querySelector('meta[name="description"]');
                results.meta_description = desc ? desc.getAttribute('content') : null;

                return results;
            }""")

            results[name] = metrics
            context.close()

        browser.close()

    return results


if __name__ == "__main__":
    data = run_audit()
    out_path = f"{OUT_DIR}/audit_metrics.json"
    with open(out_path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"\n[*] Metrics saved to {out_path}")

    # Print summary
    for vp_name, metrics in data.items():
        print(f"\n{'='*60}")
        print(f"  {vp_name.upper()} VIEWPORT")
        print(f"{'='*60}")
        print(f"  Viewport meta: {metrics.get('viewport_meta', 'MISSING')}")
        print(f"  Horizontal overflow: {metrics.get('has_horizontal_overflow')} ({metrics.get('overflow_px', 0)}px)")
        print(f"  H1 above fold: {metrics.get('h1', {}).get('visible_above_fold') if metrics.get('h1') else 'NO H1'}")
        print(f"  CTAs above fold: {len(metrics.get('ctas_above_fold', []))}")
        print(f"  Small touch targets (<48px): {len(metrics.get('small_touch_targets', []))}/{metrics.get('total_interactive', 0)}")
        print(f"  Small text elements (<16px): {metrics.get('small_text_elements', 0)}")
        print(f"  Images: {len(metrics.get('images', []))}")
        print(f"  Overflowing elements: {len(metrics.get('overflowing_elements', []))}")
        print(f"  CSS media queries: {metrics.get('css_media_queries_count', 0)}")
