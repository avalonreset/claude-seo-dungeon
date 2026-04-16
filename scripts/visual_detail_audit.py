"""Detailed visual audit: contrast, touch targets, font sizes, CLS, overflow."""
import json
from playwright.sync_api import sync_playwright

URL = "https://claude-github.com"

def audit():
    results = {}
    with sync_playwright() as p:
        browser = p.chromium.launch()

        # Mobile audit
        page = browser.new_page(viewport={"width": 375, "height": 812})
        page.goto(URL, wait_until="networkidle", timeout=30000)

        # Check horizontal overflow
        overflow = page.evaluate("""() => {
            const docWidth = document.documentElement.scrollWidth;
            const vpWidth = window.innerWidth;
            return { docWidth, vpWidth, hasOverflow: docWidth > vpWidth };
        }""")
        results["horizontal_overflow"] = overflow

        # Check all interactive elements for touch target sizes
        touch_targets = page.evaluate("""() => {
            const elements = document.querySelectorAll('a, button, input, select, textarea, [role="button"]');
            const small = [];
            for (const el of elements) {
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                    if (rect.width < 44 || rect.height < 44) {
                        small.push({
                            tag: el.tagName,
                            text: el.textContent.trim().substring(0, 50),
                            width: Math.round(rect.width),
                            height: Math.round(rect.height),
                            href: el.getAttribute('href') || ''
                        });
                    }
                }
            }
            return small;
        }""")
        results["small_touch_targets"] = touch_targets

        # Check font sizes
        font_sizes = page.evaluate("""() => {
            const all = document.querySelectorAll('p, span, li, a, td, th, label, div');
            const small = [];
            const seen = new Set();
            for (const el of all) {
                if (el.children.length > 0 && el.children[0].tagName !== 'BR') continue;
                const cs = getComputedStyle(el);
                const size = parseFloat(cs.fontSize);
                const text = el.textContent.trim().substring(0, 60);
                if (text && size < 14 && !seen.has(text)) {
                    seen.add(text);
                    small.push({ text, fontSize: size, tag: el.tagName });
                }
            }
            return small.slice(0, 20);
        }""")
        results["small_fonts"] = font_sizes

        # Check contrast of key text elements
        contrast_checks = page.evaluate("""() => {
            function getLuminance(r, g, b) {
                const [rs, gs, bs] = [r, g, b].map(c => {
                    c = c / 255;
                    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
                });
                return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
            }
            function parseColor(str) {
                const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                if (!m) return null;
                return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
            }
            function contrastRatio(fg, bg) {
                const l1 = getLuminance(...fg);
                const l2 = getLuminance(...bg);
                const lighter = Math.max(l1, l2);
                const darker = Math.min(l1, l2);
                return (lighter + 0.05) / (darker + 0.05);
            }

            const targets = document.querySelectorAll('h1, h2, h3, p, a, span, li, button');
            const results = [];
            for (const el of targets) {
                const cs = getComputedStyle(el);
                const fg = parseColor(cs.color);
                // Walk up to find effective background
                let bgEl = el;
                let bg = null;
                while (bgEl && !bg) {
                    const bgColor = getComputedStyle(bgEl).backgroundColor;
                    const parsed = parseColor(bgColor);
                    if (parsed && (parsed[0] !== 0 || parsed[1] !== 0 || parsed[2] !== 0 || !bgColor.includes('0)'))) {
                        if (!bgColor.includes('rgba(0, 0, 0, 0)')) bg = parsed;
                    }
                    bgEl = bgEl.parentElement;
                }
                if (!bg) bg = [0, 0, 0]; // assume black bg for dark theme
                if (fg && bg) {
                    const ratio = contrastRatio(fg, bg);
                    const text = el.textContent.trim().substring(0, 50);
                    const size = parseFloat(cs.fontSize);
                    if (text && ratio < 4.5) {
                        results.push({
                            text, tag: el.tagName,
                            fgColor: cs.color, bgColor: `rgb(${bg.join(',')})`,
                            ratio: Math.round(ratio * 100) / 100,
                            fontSize: size,
                            passes_AA: ratio >= 4.5 || (size >= 18.66 && ratio >= 3),
                            passes_AA_large: ratio >= 3
                        });
                    }
                }
            }
            // Deduplicate
            const seen = new Set();
            return results.filter(r => {
                if (seen.has(r.text)) return false;
                seen.add(r.text);
                return true;
            }).slice(0, 20);
        }""")
        results["low_contrast"] = contrast_checks

        # Check images
        images = page.evaluate("""() => {
            const imgs = document.querySelectorAll('img');
            return Array.from(imgs).map(img => ({
                src: img.src,
                alt: img.alt,
                width: img.naturalWidth,
                height: img.naturalHeight,
                displayWidth: img.clientWidth,
                displayHeight: img.clientHeight,
                loading: img.loading,
                hasWidthHeight: img.hasAttribute('width') && img.hasAttribute('height')
            }));
        }""")
        results["images"] = images

        # Check for CLS-prone elements (images without dimensions, fonts)
        cls_risk = page.evaluate("""() => {
            const risks = [];
            // Images without explicit dimensions
            document.querySelectorAll('img').forEach(img => {
                if (!img.hasAttribute('width') || !img.hasAttribute('height')) {
                    risks.push({ type: 'img_no_dimensions', src: img.src.substring(0, 80) });
                }
            });
            // Check for web fonts
            const links = document.querySelectorAll('link[href*="fonts"]');
            links.forEach(l => {
                if (!l.getAttribute('rel')?.includes('preload')) {
                    risks.push({ type: 'font_not_preloaded', href: l.href.substring(0, 80) });
                }
            });
            // Animations that may cause layout shift
            const animated = document.querySelectorAll('[class*="animate"], [class*="reveal"], [class*="typewriter"]');
            animated.forEach(el => {
                const cs = getComputedStyle(el);
                if (cs.position === 'static') {
                    risks.push({ type: 'animated_static_position', class: el.className.substring(0, 60) });
                }
            });
            return risks;
        }""")
        results["cls_risks"] = cls_risk

        # Nav check on mobile
        nav_info = page.evaluate("""() => {
            const hamburger = document.querySelector('[class*="hamburger"], [class*="menu-toggle"], [class*="mobile-menu"], button[aria-label*="menu"]');
            const nav = document.querySelector('nav');
            const navLinks = nav ? nav.querySelectorAll('a') : [];
            return {
                hasHamburger: !!hamburger,
                hamburgerVisible: hamburger ? getComputedStyle(hamburger).display !== 'none' : false,
                navLinkCount: navLinks.length,
                navLinksHidden: nav ? Array.from(navLinks).filter(a => getComputedStyle(a).display === 'none').length : 0
            };
        }""")
        results["mobile_nav"] = nav_info

        page.close()
        browser.close()

    return results

if __name__ == "__main__":
    r = audit()
    print(json.dumps(r, indent=2))
