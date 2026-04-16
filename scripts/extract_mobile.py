import json

with open("E:/hackathon/claude-seo-dungeon/screenshots/audit-data.json") as f:
    data = json.load(f)

for vp_name in ["tablet-768", "mobile-375", "mobile-small-320"]:
    m = data["viewports"][vp_name]["metrics"]
    print(f"=== {vp_name} ===")
    print(f"Horizontal scroll: {m['hasHorizontalScroll']} (scrollW={m['scrollWidth']}, clientW={m['clientWidth']})")
    print(f"H1: {json.dumps(m['h1'])}")
    print(f"Nav: hasNav={m['hasNav']}, hasHamburger={m['hasHamburger']}")
    if "hamburgerVisible" in m:
        print(f"Hamburger visible: {m['hamburgerVisible']}, size: {m.get('hamburgerSize')}")
    print(f"CTA count above fold: {len(m['ctaAboveFold'])}")
    small_tap = [c for c in m["ctaAboveFold"] if not c["tapTarget"]]
    print(f"CTAs failing 48px tap target: {len(small_tap)}/{len(m['ctaAboveFold'])}")
    for c in m["ctaAboveFold"][:8]:
        print(f"  {c['tag']} \"{c['text'][:30]}\" {c['width']}x{c['height']} font={c['fontSize']}")
    print(f"Images: {len(m['images'])}")
    for img in m["images"]:
        print(f"  {img['src']}: {img['width']}x{img['height']} -> {img['displayWidth']}x{img['displayHeight']} complete={img['complete']} visible={img['visible']}")
    print(f"Small fonts (<16px): {len(m['smallFonts'])}")
    print(f"Skip link: {m['hasSkipLink']}")
    print(f"ARIA: {m['ariaLandmarks']}")
    print(f"Color samples: {len(m['colorSamples'])}")
    for cs in m["colorSamples"]:
        print(f"  {cs['tag']} \"{cs['text'][:25]}\" fg={cs['color']} bg={cs['background']} size={cs['fontSize']}")
    print()

print("=== META ===")
print(json.dumps(data["meta"], indent=2))
