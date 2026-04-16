"""
Visual and Mobile Rendering Audit for claude-github.com
Captures screenshots at multiple viewports and extracts rendering metrics.
"""
import json
import os
import sys
from playwright.sync_api import sync_playwright

URL = "https://claude-github.com"
OUT_DIR = "E:/hackathon/claude-seo-dungeon/screenshots"

VIEWPORTS = [
    {"name": "desktop-1920",  "width": 1920, "height": 1080},
    {"name": "laptop-1366",   "width": 1366, "height": 768},
    {"name": "tablet-768",    "width": 768,  "height": 1024},
    {"name": "mobile-375",    "width": 375,  "height": 812},
    {"name": "mobile-small-320", "width": 320, "height": 568},
]

def run_audit():
    results = {"url": URL, "viewports": {}, "accessibility": {}, "images": [], "cta": [], "contrast": [], "meta": {}}

    with sync_playwright() as p:
        browser = p.chromium.launch()

        for vp in VIEWPORTS:
            name = vp["name"]
            print(f"Capturing {name} ({vp['width']}x{vp['height']})...")
            page = browser.new_page(viewport={"width": vp["width"], "height": vp["height"]})
            page.goto(URL, wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(1500)

            # Above-the-fold screenshot
            atf_path = os.path.join(OUT_DIR, f"{name}-atf.png")
            page.screenshot(path=atf_path, full_page=False)

            # Full page screenshot
            full_path = os.path.join(OUT_DIR, f"{name}-full.png")
            page.screenshot(path=full_path, full_page=True)

            # Collect viewport-specific metrics
            metrics = page.evaluate("""() => {
                const results = {};

                // Check horizontal overflow
                results.hasHorizontalScroll = document.documentElement.scrollWidth > document.documentElement.clientWidth;
                results.scrollWidth = document.documentElement.scrollWidth;
                results.clientWidth = document.documentElement.clientWidth;

                // H1 visibility above fold
                const h1 = document.querySelector('h1');
                if (h1) {
                    const rect = h1.getBoundingClientRect();
                    results.h1 = {
                        text: h1.textContent.trim().substring(0, 100),
                        top: rect.top,
                        bottom: rect.bottom,
                        visibleAboveFold: rect.top < window.innerHeight && rect.bottom > 0
                    };
                }

                // CTA buttons above fold
                const buttons = document.querySelectorAll('a, button');
                results.ctaAboveFold = [];
                buttons.forEach(btn => {
                    const rect = btn.getBoundingClientRect();
                    const text = btn.textContent.trim().substring(0, 60);
                    if (rect.top < window.innerHeight && rect.bottom > 0 && text.length > 0) {
                        const styles = window.getComputedStyle(btn);
                        results.ctaAboveFold.push({
                            tag: btn.tagName,
                            text: text,
                            top: Math.round(rect.top),
                            width: Math.round(rect.width),
                            height: Math.round(rect.height),
                            fontSize: styles.fontSize,
                            tapTarget: rect.width >= 48 && rect.height >= 48
                        });
                    }
                });

                // Images
                const imgs = document.querySelectorAll('img');
                results.images = [];
                imgs.forEach(img => {
                    const rect = img.getBoundingClientRect();
                    results.images.push({
                        src: img.src.substring(img.src.lastIndexOf('/') + 1),
                        alt: img.alt || '(missing)',
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                        displayWidth: Math.round(rect.width),
                        displayHeight: Math.round(rect.height),
                        loading: img.loading || 'eager',
                        complete: img.complete,
                        visible: rect.top < window.innerHeight && rect.bottom > 0
                    });
                });

                // Font sizes check (minimum readable)
                const allText = document.querySelectorAll('p, li, span, a, td, th, label, input');
                results.smallFonts = [];
                const seen = new Set();
                allText.forEach(el => {
                    const fs = parseFloat(window.getComputedStyle(el).fontSize);
                    const text = el.textContent.trim().substring(0, 40);
                    if (fs < 16 && text.length > 0) {
                        const key = `${el.tagName}-${fs}-${text.substring(0,15)}`;
                        if (!seen.has(key)) {
                            seen.add(key);
                            results.smallFonts.push({
                                tag: el.tagName,
                                fontSize: fs,
                                text: text
                            });
                        }
                    }
                });

                // Navigation check
                const nav = document.querySelector('nav');
                results.hasNav = !!nav;
                const hamburger = document.querySelector('[class*="hamburger"], [class*="menu-toggle"], [aria-label*="menu"], [aria-label*="Menu"], button[class*="mobile"], .menu-btn, #menu-btn');
                results.hasHamburger = !!hamburger;
                if (hamburger) {
                    const rect = hamburger.getBoundingClientRect();
                    results.hamburgerSize = { width: Math.round(rect.width), height: Math.round(rect.height) };
                    results.hamburgerVisible = rect.width > 0 && rect.height > 0;
                }

                // Skip-to-main link
                const skipLink = document.querySelector('a[href="#main"], a[href="#main-content"], .skip-link, [class*="skip"]');
                results.hasSkipLink = !!skipLink;

                // Viewport meta
                const vpMeta = document.querySelector('meta[name="viewport"]');
                results.viewportMeta = vpMeta ? vpMeta.getAttribute('content') : null;

                // ARIA landmarks
                results.ariaLandmarks = {
                    main: !!document.querySelector('main, [role="main"]'),
                    nav: !!document.querySelector('nav, [role="navigation"]'),
                    banner: !!document.querySelector('header, [role="banner"]'),
                    contentinfo: !!document.querySelector('footer, [role="contentinfo"]')
                };

                // Color contrast sampling - get computed styles of key elements
                results.colorSamples = [];
                const sampleEls = document.querySelectorAll('h1, h2, h3, p, a, button, .cta, [class*="hero"]');
                const sampledColors = new Set();
                sampleEls.forEach(el => {
                    const styles = window.getComputedStyle(el);
                    const fg = styles.color;
                    const bg = styles.backgroundColor;
                    const key = `${fg}|${bg}`;
                    if (!sampledColors.has(key) && el.textContent.trim().length > 0) {
                        sampledColors.add(key);
                        results.colorSamples.push({
                            tag: el.tagName,
                            text: el.textContent.trim().substring(0, 30),
                            color: fg,
                            background: bg,
                            fontSize: styles.fontSize,
                            fontWeight: styles.fontWeight
                        });
                    }
                });

                // Check for layout issues - overlapping elements in hero
                const hero = document.querySelector('[class*="hero"], header, section:first-of-type');
                if (hero) {
                    const children = hero.querySelectorAll('*');
                    results.heroChildCount = children.length;
                }

                return results;
            }""")

            results["viewports"][name] = {
                "screenshot_atf": atf_path,
                "screenshot_full": full_path,
                "metrics": metrics
            }
            page.close()

        # Desktop-only deep analysis for images and overall structure
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        page.goto(URL, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(1000)

        # Get page-level meta
        results["meta"] = page.evaluate("""() => {
            return {
                title: document.title,
                description: document.querySelector('meta[name="description"]')?.content || null,
                ogImage: document.querySelector('meta[property="og:image"]')?.content || null,
                canonical: document.querySelector('link[rel="canonical"]')?.href || null,
                themeColor: document.querySelector('meta[name="theme-color"]')?.content || null,
                doctype: document.doctype ? '<!DOCTYPE ' + document.doctype.name + '>' : null,
                lang: document.documentElement.lang || null,
                charsetDeclared: !!document.querySelector('meta[charset]'),
            };
        }""")

        page.close()
        browser.close()

    return results

if __name__ == "__main__":
    data = run_audit()
    out_path = os.path.join(OUT_DIR, "audit-data.json")
    with open(out_path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Audit data saved to {out_path}")
    print(json.dumps(data, indent=2))
