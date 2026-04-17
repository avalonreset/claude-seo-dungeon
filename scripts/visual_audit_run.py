"""Visual audit script: captures screenshots at multiple viewports and extracts page data."""
import json, sys, os
from playwright.sync_api import sync_playwright

URL = "https://claude-github.com"
OUT_DIR = str(__import__("pathlib").Path(__file__).resolve().parent.parent / "screenshots")

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
            page = browser.new_page(viewport={"width": w, "height": h})
            page.goto(URL, wait_until="networkidle", timeout=30000)

            # Above-the-fold screenshot
            atf_path = os.path.join(OUT_DIR, f"{name}_above_fold.png")
            page.screenshot(path=atf_path, full_page=False)

            # Full page screenshot
            full_path = os.path.join(OUT_DIR, f"{name}_full_page.png")
            page.screenshot(path=full_path, full_page=True)

            # Extract page data
            data = page.evaluate("""() => {
                const h1 = document.querySelector('h1');
                const h2s = [...document.querySelectorAll('h2')].map(e => e.textContent.trim());
                const meta_desc = document.querySelector('meta[name="description"]');
                const meta_vp = document.querySelector('meta[name="viewport"]');
                const title = document.title;
                const links = [...document.querySelectorAll('a')].slice(0, 30).map(a => ({
                    text: a.textContent.trim().substring(0, 80),
                    href: a.href,
                    rect: a.getBoundingClientRect().toJSON()
                }));
                const buttons = [...document.querySelectorAll('button, [role="button"], a.btn, a[class*="button"], a[class*="cta"]')].map(b => ({
                    text: b.textContent.trim().substring(0, 80),
                    tag: b.tagName,
                    rect: b.getBoundingClientRect().toJSON()
                }));
                const images = [...document.querySelectorAll('img')].map(img => ({
                    src: img.src,
                    alt: img.alt,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    rect: img.getBoundingClientRect().toJSON()
                }));
                const fonts = getComputedStyle(document.body).fontSize;
                const bodyWidth = document.body.scrollWidth;
                const viewportWidth = window.innerWidth;
                const hasHorizontalScroll = bodyWidth > viewportWidth;

                return {
                    title,
                    h1: h1 ? h1.textContent.trim() : null,
                    h1_rect: h1 ? h1.getBoundingClientRect().toJSON() : null,
                    h2s,
                    meta_description: meta_desc ? meta_desc.content : null,
                    meta_viewport: meta_vp ? meta_vp.content : null,
                    base_font_size: fonts,
                    body_scroll_width: bodyWidth,
                    viewport_width: viewportWidth,
                    has_horizontal_scroll: hasHorizontalScroll,
                    links,
                    buttons,
                    images,
                    link_count: document.querySelectorAll('a').length,
                    image_count: document.querySelectorAll('img').length,
                };
            }""")

            # Check touch target sizes on mobile
            if name == "mobile":
                touch_targets = page.evaluate("""() => {
                    const interactive = [...document.querySelectorAll('a, button, [role="button"], input, select, textarea')];
                    const small = [];
                    for (const el of interactive) {
                        const rect = el.getBoundingClientRect();
                        if (rect.width > 0 && rect.height > 0 && (rect.width < 48 || rect.height < 48)) {
                            small.push({
                                tag: el.tagName,
                                text: el.textContent.trim().substring(0, 60),
                                width: Math.round(rect.width),
                                height: Math.round(rect.height)
                            });
                        }
                    }
                    return small;
                }""")
                data["small_touch_targets"] = touch_targets

            # Check for CLS indicators - elements with explicit dimensions
            if name == "desktop":
                cls_check = page.evaluate("""() => {
                    const imgs = [...document.querySelectorAll('img')];
                    const missing_dims = imgs.filter(img => !img.width && !img.height && !img.style.width && !img.style.height);
                    return {
                        total_images: imgs.length,
                        images_missing_dimensions: missing_dims.map(img => img.src)
                    };
                }""")
                data["cls_check"] = cls_check

            results[name] = data
            page.close()

        browser.close()

    # Write JSON results
    json_path = os.path.join(OUT_DIR, "audit_data.json")
    with open(json_path, "w") as f:
        json.dump(results, f, indent=2)
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    run()
