"""Calculate WCAG contrast ratios for color pairs found on the site."""
import re, sys

def parse_rgb(s):
    m = re.findall(r"[\d.]+", s)
    if len(m) >= 3:
        return tuple(float(x) for x in m[:3])
    return None

def relative_luminance(r, g, b):
    def channel(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)

def contrast_ratio(fg, bg):
    l1 = relative_luminance(*fg)
    l2 = relative_luminance(*bg)
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

# Key color pairs from the site
pairs = [
    ("Nav links", "rgb(148, 163, 184)", "rgb(11, 17, 32)", "11px"),
    ("Body text (muted)", "rgb(100, 116, 139)", "rgb(11, 17, 32)", "11px"),
    ("White text on dark", "rgb(241, 245, 249)", "rgb(11, 17, 32)", "16px"),
    ("Purple accent", "rgb(168, 85, 247)", "rgb(11, 17, 32)", "14px"),
    ("Code block text", "rgb(241, 245, 249)", "rgb(17, 24, 39)", "16px"),
    ("GitHub button", "rgb(11, 17, 32)", "rgb(255, 255, 255)", "11px"),
    ("Purple on purple bg", "rgb(168, 85, 247)", "rgba(168, 85, 247, 0.15)", "12px"),
    ("Skip link", "rgb(11, 17, 32)", "rgb(168, 85, 247)", "14px"),
]

# For the purple-on-purple-bg, approximate the effective bg as 15% purple over #0B1120
# 0.15*168 + 0.85*11 = 34.6, 0.15*85 + 0.85*17 = 27.2, 0.15*247 + 0.85*32 = 64.3
pairs_processed = []
for name, fg_str, bg_str, size in pairs:
    fg = parse_rgb(fg_str)
    if "rgba" in bg_str and "0.15" in bg_str:
        bg = (34.6, 27.2, 64.3)
    else:
        bg = parse_rgb(bg_str)
    if fg and bg:
        ratio = contrast_ratio(fg, bg)
        fs = float(re.findall(r"[\d.]+", size)[0])
        # WCAG AA: 4.5:1 normal, 3:1 large (>=18px or >=14px bold)
        is_large = fs >= 18
        required = 3.0 if is_large else 4.5
        passes = ratio >= required
        print(f"{name}: {ratio:.2f}:1 (need {required}:1) {'PASS' if passes else 'FAIL'} [{fg_str} on {bg_str}]")
