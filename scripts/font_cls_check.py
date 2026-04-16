"""Check font-display and CLS-related CSS properties."""
import json
from playwright.sync_api import sync_playwright

URL = "https://claude-github.com"

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 375, "height": 812})
    page.goto(URL, wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(2000)

    result = page.evaluate("""() => {
        const data = {};

        // Check all stylesheets for font-display
        const sheets = document.styleSheets;
        data.fontDisplay = [];
        try {
            for (const sheet of sheets) {
                try {
                    for (const rule of sheet.cssRules) {
                        if (rule.type === CSSRule.FONT_FACE_RULE) {
                            data.fontDisplay.push({
                                family: rule.style.getPropertyValue('font-family'),
                                display: rule.style.getPropertyValue('font-display') || 'NOT SET',
                            });
                        }
                    }
                } catch(e) { /* cross-origin */ }
            }
        } catch(e) {}

        // Check for elements with explicit width/height that prevent CLS
        const heroImg = document.querySelector('[class*="banner"] img, [class*="hero"] img');
        if (heroImg) {
            const style = window.getComputedStyle(heroImg);
            data.heroImgCLS = {
                hasWidth: heroImg.hasAttribute('width'),
                hasHeight: heroImg.hasAttribute('height'),
                aspectRatio: style.aspectRatio,
                display: style.display,
            };
        }

        // Check git clone command box for overflow
        const cmdBox = document.querySelector('[class*="cmd"], [class*="code"], pre, code');
        if (cmdBox) {
            const rect = cmdBox.getBoundingClientRect();
            data.cmdBox = {
                width: rect.width,
                overflowX: window.getComputedStyle(cmdBox).overflowX,
                text: cmdBox.textContent.trim().substring(0, 120),
            };
        }

        // Check banner image width vs viewport
        const bannerImg = document.querySelector('img[src*="banner"]');
        if (bannerImg) {
            const rect = bannerImg.getBoundingClientRect();
            data.bannerLayout = {
                renderedWidth: rect.width,
                viewportWidth: window.innerWidth,
                overflows: rect.width > window.innerWidth,
                right: rect.right,
            };
        }

        // Check what's causing the 819px doc width on 375px viewport
        const allEls = document.querySelectorAll('*');
        const overflowing = [];
        for (const el of allEls) {
            const rect = el.getBoundingClientRect();
            if (rect.right > 380 && rect.width > 0) {
                const tag = el.tagName;
                const cls = el.className.toString().substring(0, 40);
                const key = tag + cls;
                if (!overflowing.find(o => o.key === key)) {
                    overflowing.push({
                        key: key,
                        tag: tag,
                        class: cls,
                        width: Math.round(rect.width),
                        right: Math.round(rect.right),
                    });
                }
            }
            if (overflowing.length > 30) break;
        }
        data.overflowingElements = overflowing;

        return data;
    }""")

    print(json.dumps(result, indent=2))
    browser.close()
