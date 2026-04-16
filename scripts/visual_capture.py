"""Capture screenshots of claude-github.com at multiple viewports."""
import sys
from playwright.sync_api import sync_playwright

VIEWPORTS = [
    ("desktop", 1920, 1080),
    ("laptop", 1366, 768),
    ("tablet", 768, 1024),
    ("mobile", 375, 812),
]

PAGES = [
    ("home", "https://claude-github.com"),
    ("privacy", "https://claude-github.com/privacy"),
    ("terms", "https://claude-github.com/terms"),
]

OUT = "E:/hackathon/claude-seo-dungeon/screenshots"

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for page_name, url in PAGES:
            for vp_name, w, h in VIEWPORTS:
                # For privacy/terms only capture mobile and desktop
                if page_name != "home" and vp_name not in ("desktop", "mobile"):
                    continue
                page = browser.new_page(viewport={"width": w, "height": h})
                page.goto(url, wait_until="networkidle", timeout=30000)
                # Above the fold
                page.screenshot(path=f"{OUT}/{page_name}-{vp_name}-atf.png", full_page=False)
                # Full page
                page.screenshot(path=f"{OUT}/{page_name}-{vp_name}-full.png", full_page=True)
                print(f"Captured {page_name}-{vp_name}")
                page.close()
        browser.close()

if __name__ == "__main__":
    main()
