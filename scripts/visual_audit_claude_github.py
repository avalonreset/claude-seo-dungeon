"""
Visual and Mobile Rendering Audit for claude-github.com
Captures screenshots at multiple viewports and extracts rendering metrics.
"""
import json
import os
from playwright.sync_api import sync_playwright

URL = "https://claude-github.com"
OUT = "E:/hackathon/claude-seo-dungeon/screenshots"

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
            print(f"Capturing {name} ({vp['width']}x{vp['height']})...")

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
                print(f"  Warning on {name}: {e}")
                try:
                    page.goto(URL, wait_until="domcontentloaded", timeout=30000)
                except Exception as e2:
                    print(f"  Failed {name}: {e2}")
                    results[name] = {"error": str(e2)}
                    context.close()
                    continue

            # Above-the-fold screenshot
            atf_path = os.path.join(OUT, f"{name}_above_fold.png")
            page.screenshot(path=atf_path, full_page=False)
            print(f"  Saved: {atf_path}")

            # Full page screenshot
            full_path = os.path.join(OUT, f"{name}_full_page.png")
            page.screenshot(path=full_path, full_page=True)
            print(f"  Saved: {full_path}")

            # Extract metrics via JS
            metrics = page.evaluate("""() => {
                const results = {};

                // 1. Viewport meta tag
                const vpMeta = document.querySelector('meta[name="viewport"]');
                results.viewportMeta = vpMeta ? vpMeta.getAttribute('content') : null;

                // 2. Document dimensions vs viewport
                results.docWidth = document.documentElement.scrollWidth;
                results.docHeight = document.documentElement.scrollHeight;
                results.viewportWidth = window.innerWidth;
                results.viewportHeight = window.innerHeight;
                results.hasHorizontalOverflow = document.documentElement.scrollWidth > window.innerWidth;

                // 3. H1 analysis
                const h1 = document.querySelector('h1');
                if (h1) {
                    const r = h1.getBoundingClientRect();
                    const s = window.getComputedStyle(h1);
                    results.h1 = {
                        text: h1.textContent.trim().substring(0, 120),
                        top: r.top,
                        visible_above_fold: r.top < window.innerHeight,
                        fontSize: s.fontSize,
                        fontWeight: s.fontWeight,
                        color: s.color,
                    };
                }

                // 4. CTA buttons
                const ctas = [];
                document.querySelectorAll('a, button').forEach(el => {
                    const text = el.textContent.trim();
                    const r = el.getBoundingClientRect();
                    const s = window.getComputedStyle(el);
                    if (text.length > 0 && text.length < 60 && r.width > 0) {
                        ctas.push({
                            tag: el.tagName,
                            text: text.substring(0, 50),
                            href: el.href || null,
                            top: r.top,
                            width: Math.round(r.width),
                            height: Math.round(r.height),
                            above_fold: r.top < window.innerHeight && r.bottom > 0,
                            fontSize: s.fontSize,
                            bgColor: s.backgroundColor,
                            touchTargetOk: r.width >= 48 && r.height >= 48,
                        });
                    }
                });
                results.ctas = ctas.slice(0, 30);

                // 5. Font sizes audit
                const fontSizes = [];
                document.querySelectorAll('p, span, li, td, th, label, a, h1, h2, h3, h4, h5, h6').forEach(el => {
                    const s = window.getComputedStyle(el);
                    const size = parseFloat(s.fontSize);
                    fontSizes.push(size);
                });
                results.fontSizes = {
                    min: Math.min(...fontSizes),
                    max: Math.max(...fontSizes),
                    median: fontSizes.sort((a,b) => a-b)[Math.floor(fontSizes.length/2)],
                    countBelow16: fontSizes.filter(s => s < 16).length,
                    total: fontSizes.length,
                };

                // 6. Images
                const images = [];
                document.querySelectorAll('img').forEach(img => {
                    const r = img.getBoundingClientRect();
                    images.push({
                        src: (img.src || '').substring(0, 120),
                        alt: img.alt || '',
                        hasAlt: !!img.alt,
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                        displayWidth: Math.round(r.width),
                        displayHeight: Math.round(r.height),
                        loading: img.loading || 'eager',
                        aboveFold: r.top < window.innerHeight,
                    });
                });
                results.images = images;

                // 7. Navigation
                const nav = document.querySelector('nav') || document.querySelector('[role="navigation"]');
                results.navigation = {
                    exists: !!nav,
                    tag: nav ? nav.tagName : null,
                };
                if (nav) {
                    const links = nav.querySelectorAll('a');
                    results.navigation.linkCount = links.length;
                    results.navigation.links = Array.from(links).slice(0, 15).map(a => ({
                        text: a.textContent.trim().substring(0, 40),
                        href: a.href,
                    }));
                }
                // Check for hamburger/mobile menu
                const hamburger = document.querySelector('[class*="hamburger"], [class*="menu-toggle"], [class*="mobile-menu"], [aria-label*="menu"], [class*="navbar-toggler"], button[class*="menu"]');
                results.navigation.hamburgerDetected = !!hamburger;

                // 8. CLS indicators: elements without explicit dimensions
                const clsRisks = [];
                document.querySelectorAll('img, video, iframe, embed').forEach(el => {
                    const hasWidth = el.hasAttribute('width') || el.style.width;
                    const hasHeight = el.hasAttribute('height') || el.style.height;
                    if (!hasWidth || !hasHeight) {
                        clsRisks.push({
                            tag: el.tagName,
                            src: (el.src || '').substring(0, 80),
                            missingWidth: !hasWidth,
                            missingHeight: !hasHeight,
                        });
                    }
                });
                results.clsRisks = clsRisks;

                // 9. Body font and line-height
                const bodyStyle = window.getComputedStyle(document.body);
                results.bodyTypography = {
                    fontSize: bodyStyle.fontSize,
                    lineHeight: bodyStyle.lineHeight,
                    fontFamily: bodyStyle.fontFamily.substring(0, 100),
                    color: bodyStyle.color,
                    backgroundColor: bodyStyle.backgroundColor,
                };

                // 10. Media queries - check if any responsive stylesheets exist
                const styleSheets = document.styleSheets;
                let mediaQueryCount = 0;
                try {
                    for (let i = 0; i < styleSheets.length; i++) {
                        try {
                            const rules = styleSheets[i].cssRules;
                            for (let j = 0; j < rules.length; j++) {
                                if (rules[j].type === CSSRule.MEDIA_RULE) mediaQueryCount++;
                            }
                        } catch(e) {}
                    }
                } catch(e) {}
                results.mediaQueryCount = mediaQueryCount;

                // 11. Page title and meta description
                results.title = document.title;
                const metaDesc = document.querySelector('meta[name="description"]');
                results.metaDescription = metaDesc ? metaDesc.getAttribute('content') : null;

                return results;
            }""")

            results[name] = metrics
            context.close()

        browser.close()

    # Save JSON
    json_path = os.path.join(OUT, "visual_audit_metrics.json")
    with open(json_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nMetrics saved to: {json_path}")

    return results

if __name__ == "__main__":
    data = run_audit()
    print(json.dumps(data, indent=2))
