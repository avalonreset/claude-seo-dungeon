"""
Full visual and mobile rendering audit for claude-github.com.
Captures screenshots at 4 viewports and extracts key metrics.
"""
import json
import sys
from playwright.sync_api import sync_playwright

URL = "https://claude-github.com"
OUT = "E:/hackathon/claude-seo-dungeon/screenshots"

VIEWPORTS = [
    ("desktop", 1920, 1080),
    ("laptop", 1366, 768),
    ("tablet", 768, 1024),
    ("mobile", 375, 812),
]

def run():
    results = {}
    with sync_playwright() as p:
        browser = p.chromium.launch()

        for name, w, h in VIEWPORTS:
            ctx = browser.new_context(
                viewport={"width": w, "height": h},
                device_scale_factor=2 if name == "mobile" else 1,
            )
            page = ctx.new_page()
            page.goto(URL, wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(2000)

            # Above-the-fold screenshot
            page.screenshot(path=f"{OUT}/{name}_above_fold.png", full_page=False)
            # Full page screenshot
            page.screenshot(path=f"{OUT}/{name}_full_page.png", full_page=True)

            # Extract metrics via JS
            metrics = page.evaluate("""() => {
                const vp = document.querySelector('meta[name="viewport"]');
                const h1 = document.querySelector('h1');
                const h1Rect = h1 ? h1.getBoundingClientRect() : null;

                // Find all interactive elements and check touch target sizes
                const interactive = [...document.querySelectorAll('a, button, input, select, textarea, [role="button"], [tabindex]')];
                const smallTargets = [];
                interactive.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        if (rect.width < 48 || rect.height < 48) {
                            smallTargets.push({
                                tag: el.tagName,
                                text: (el.textContent || el.getAttribute('aria-label') || '').slice(0, 60).trim(),
                                width: Math.round(rect.width),
                                height: Math.round(rect.height),
                                href: el.getAttribute('href') || '',
                            });
                        }
                    }
                });

                // Check font sizes
                const textEls = [...document.querySelectorAll('p, span, li, a, td, th, label, div')];
                const smallFonts = [];
                const fontSizes = new Set();
                textEls.forEach(el => {
                    const cs = getComputedStyle(el);
                    const fs = parseFloat(cs.fontSize);
                    if (el.textContent.trim().length > 2 && fs > 0) {
                        fontSizes.add(fs);
                        if (fs < 16 && el.textContent.trim().length > 10) {
                            const rect = el.getBoundingClientRect();
                            if (rect.width > 0 && rect.height > 0) {
                                smallFonts.push({
                                    tag: el.tagName,
                                    text: el.textContent.trim().slice(0, 60),
                                    fontSize: fs,
                                    lineHeight: cs.lineHeight,
                                });
                            }
                        }
                    }
                });

                // Check horizontal overflow
                const hasHScroll = document.documentElement.scrollWidth > document.documentElement.clientWidth;

                // Find CTAs
                const ctas = [...document.querySelectorAll('a, button')].filter(el => {
                    const text = el.textContent.toLowerCase();
                    return text.includes('get') || text.includes('start') || text.includes('try') ||
                           text.includes('install') || text.includes('sign') || text.includes('buy') ||
                           text.includes('download') || text.includes('learn') || text.includes('view') ||
                           text.includes('explore');
                }).map(el => {
                    const rect = el.getBoundingClientRect();
                    return {
                        text: el.textContent.trim().slice(0, 60),
                        tag: el.tagName,
                        href: el.getAttribute('href') || '',
                        top: Math.round(rect.top),
                        left: Math.round(rect.left),
                        width: Math.round(rect.width),
                        height: Math.round(rect.height),
                        visible: rect.top < window.innerHeight,
                        bgColor: getComputedStyle(el).backgroundColor,
                        color: getComputedStyle(el).color,
                    };
                });

                // Check hamburger menu
                const hamburger = document.querySelector('[class*="hamburger"], [class*="menu-toggle"], [aria-label*="menu"], [class*="mobile-menu"], button svg, nav button');
                let hamburgerInfo = null;
                if (hamburger) {
                    const rect = hamburger.getBoundingClientRect();
                    const cs = getComputedStyle(hamburger);
                    hamburgerInfo = {
                        tag: hamburger.tagName,
                        visible: cs.display !== 'none' && cs.visibility !== 'hidden' && rect.width > 0,
                        width: Math.round(rect.width),
                        height: Math.round(rect.height),
                        ariaLabel: hamburger.getAttribute('aria-label'),
                    };
                }

                // Images
                const images = [...document.querySelectorAll('img')].map(img => {
                    const rect = img.getBoundingClientRect();
                    return {
                        src: (img.getAttribute('src') || '').slice(0, 100),
                        alt: img.getAttribute('alt') || '',
                        naturalWidth: img.naturalWidth,
                        naturalHeight: img.naturalHeight,
                        displayWidth: Math.round(rect.width),
                        displayHeight: Math.round(rect.height),
                        loading: img.getAttribute('loading'),
                        hasAlt: !!img.getAttribute('alt'),
                    };
                });

                // Contrast check - sample key text elements
                const contrastSamples = [];
                ['h1','h2','h3','p','a','span','li'].forEach(sel => {
                    const els = document.querySelectorAll(sel);
                    els.forEach(el => {
                        const cs = getComputedStyle(el);
                        if (el.textContent.trim().length > 2) {
                            contrastSamples.push({
                                tag: el.tagName,
                                text: el.textContent.trim().slice(0, 40),
                                color: cs.color,
                                bgColor: cs.backgroundColor,
                                fontSize: parseFloat(cs.fontSize),
                            });
                        }
                    });
                });

                // Navigation links
                const navLinks = [...document.querySelectorAll('nav a, header a')].map(a => {
                    const rect = a.getBoundingClientRect();
                    return {
                        text: a.textContent.trim().slice(0, 40),
                        href: a.getAttribute('href') || '',
                        width: Math.round(rect.width),
                        height: Math.round(rect.height),
                        visible: getComputedStyle(a).display !== 'none',
                    };
                });

                // Check for scroll-reveal / animation elements
                const animatedEls = document.querySelectorAll('[class*="reveal"], [class*="animate"], [class*="fade"], [class*="slide"], [data-aos]');

                // reduced-motion check
                const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

                return {
                    viewport: { width: window.innerWidth, height: window.innerHeight },
                    viewportMeta: vp ? vp.getAttribute('content') : null,
                    h1: h1 ? { text: h1.textContent.trim(), top: Math.round(h1Rect.top), visible: h1Rect.top < window.innerHeight } : null,
                    smallTargets: smallTargets.slice(0, 30),
                    smallTargetCount: smallTargets.length,
                    smallFonts: [...new Map(smallFonts.map(f => [f.text, f])).values()].slice(0, 20),
                    hasHorizontalScroll: hasHScroll,
                    ctas: ctas.slice(0, 15),
                    hamburgerMenu: hamburgerInfo,
                    images: images.slice(0, 20),
                    contrastSamples: contrastSamples.slice(0, 30),
                    navLinks: navLinks.slice(0, 15),
                    animatedElementCount: animatedEls.length,
                    fontSizesUsed: [...fontSizes].sort((a,b) => a-b),
                    documentHeight: document.documentElement.scrollHeight,
                };
            }""")

            results[name] = metrics
            ctx.close()

        browser.close()

    # Write JSON results
    with open(f"{OUT}/audit_metrics.json", "w") as f:
        json.dump(results, f, indent=2)

    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    run()
