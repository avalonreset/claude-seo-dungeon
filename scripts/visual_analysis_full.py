"""
Visual analysis script for claude-github.com
Captures screenshots at multiple viewports and extracts visual metrics.
"""
import json
import sys
from playwright.sync_api import sync_playwright

URL = "https://claude-github.com"
OUT_DIR = str(__import__("pathlib").Path(__file__).resolve().parent.parent / "screenshots")

VIEWPORTS = [
    {"name": "desktop", "width": 1920, "height": 1080},
    {"name": "laptop", "width": 1366, "height": 768},
    {"name": "tablet", "width": 768, "height": 1024},
    {"name": "mobile", "width": 375, "height": 812},
]

def analyze_page(page, vp_name):
    """Extract visual metrics from the page."""
    metrics = page.evaluate("""() => {
        const result = {};

        // Viewport meta
        const vpMeta = document.querySelector('meta[name="viewport"]');
        result.viewportMeta = vpMeta ? vpMeta.getAttribute('content') : null;

        // Title and meta description
        result.title = document.title;
        const metaDesc = document.querySelector('meta[name="description"]');
        result.metaDescription = metaDesc ? metaDesc.getAttribute('content') : null;

        // H1
        const h1 = document.querySelector('h1');
        if (h1) {
            const rect = h1.getBoundingClientRect();
            const style = getComputedStyle(h1);
            result.h1 = {
                text: h1.textContent.trim().substring(0, 120),
                fontSize: style.fontSize,
                fontWeight: style.fontWeight,
                color: style.color,
                top: rect.top,
                visible: rect.top < window.innerHeight,
            };
        }

        // All headings hierarchy
        const headings = [];
        document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
            const rect = h.getBoundingClientRect();
            headings.push({
                tag: h.tagName,
                text: h.textContent.trim().substring(0, 80),
                top: Math.round(rect.top),
                aboveFold: rect.top < window.innerHeight,
            });
        });
        result.headings = headings.slice(0, 20);

        // CTA buttons / links above the fold
        const ctas = [];
        document.querySelectorAll('a, button').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.width > 0 && rect.height > 0) {
                const style = getComputedStyle(el);
                ctas.push({
                    tag: el.tagName,
                    text: el.textContent.trim().substring(0, 60),
                    href: el.href || null,
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                    top: Math.round(rect.top),
                    fontSize: style.fontSize,
                    touchTargetOk: rect.width >= 48 && rect.height >= 48,
                });
            }
        });
        result.ctasAboveFold = ctas.slice(0, 25);

        // Body font size
        const bodyStyle = getComputedStyle(document.body);
        result.bodyFontSize = bodyStyle.fontSize;
        result.bodyLineHeight = bodyStyle.lineHeight;
        result.bodyFontFamily = bodyStyle.fontFamily;

        // Check horizontal overflow
        result.hasHorizontalScroll = document.documentElement.scrollWidth > document.documentElement.clientWidth;
        result.scrollWidth = document.documentElement.scrollWidth;
        result.clientWidth = document.documentElement.clientWidth;

        // Page dimensions
        result.pageHeight = document.documentElement.scrollHeight;
        result.viewportHeight = window.innerHeight;
        result.viewportWidth = window.innerWidth;

        // Images above the fold
        const images = [];
        document.querySelectorAll('img').forEach(img => {
            const rect = img.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.width > 0) {
                images.push({
                    src: img.src ? img.src.substring(0, 100) : null,
                    alt: img.alt || '',
                    width: Math.round(rect.width),
                    height: Math.round(rect.height),
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight,
                    loading: img.loading || 'auto',
                });
            }
        });
        result.imagesAboveFold = images.slice(0, 10);

        // Navigation analysis
        const nav = document.querySelector('nav');
        if (nav) {
            const rect = nav.getBoundingClientRect();
            const links = nav.querySelectorAll('a');
            result.navigation = {
                visible: rect.height > 0,
                height: Math.round(rect.height),
                linkCount: links.length,
            };
        }

        // Check for hamburger / mobile menu button
        const menuButtons = document.querySelectorAll('[class*="menu"], [class*="hamburger"], [class*="toggle"], [aria-label*="menu"], [aria-label*="Menu"]');
        result.hasMenuButton = menuButtons.length > 0;

        // Font sizes used on page (sample)
        const fontSizes = new Set();
        document.querySelectorAll('p, span, li, a, td, th, label, div').forEach(el => {
            const style = getComputedStyle(el);
            if (el.textContent.trim().length > 0) {
                fontSizes.add(style.fontSize);
            }
        });
        result.fontSizesUsed = Array.from(fontSizes).sort();

        // Check smallest text
        let smallestFont = 100;
        document.querySelectorAll('p, span, li, a, td, th, label').forEach(el => {
            if (el.textContent.trim().length > 2) {
                const size = parseFloat(getComputedStyle(el).fontSize);
                if (size < smallestFont) smallestFont = size;
            }
        });
        result.smallestFontPx = smallestFont;

        // Background / hero section
        const firstSection = document.querySelector('section, main, [class*="hero"]');
        if (firstSection) {
            const style = getComputedStyle(firstSection);
            result.heroSection = {
                background: style.backgroundColor,
                padding: style.padding,
            };
        }

        // Color contrast (basic check on H1)
        if (h1) {
            const h1Style = getComputedStyle(h1);
            result.h1Color = h1Style.color;
            result.h1Background = h1Style.backgroundColor;
        }

        return result;
    }""")
    return metrics


def main():
    results = {}
    with sync_playwright() as p:
        browser = p.chromium.launch()

        for vp in VIEWPORTS:
            name = vp["name"]
            print(f"Capturing {name} ({vp['width']}x{vp['height']})...")

            page = browser.new_page(viewport={"width": vp["width"], "height": vp["height"]})
            page.goto(URL, wait_until="networkidle", timeout=30000)

            # Above-the-fold screenshot
            path_atf = f"{OUT_DIR}/{name}_above_fold.png"
            page.screenshot(path=path_atf, full_page=False)
            print(f"  Saved: {path_atf}")

            # Full page screenshot
            path_full = f"{OUT_DIR}/{name}_full_page.png"
            page.screenshot(path=path_full, full_page=True)
            print(f"  Saved: {path_full}")

            # Analyze
            metrics = analyze_page(page, name)
            metrics["viewport"] = vp
            results[name] = metrics

            page.close()

        browser.close()

    # Save JSON results
    json_path = f"{OUT_DIR}/visual_metrics.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nMetrics saved to: {json_path}")

    return results


if __name__ == "__main__":
    results = main()
    print(json.dumps(results, indent=2))
