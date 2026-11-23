#!/usr/bin/env python3
"""يولّد أيقونات التطبيق (192/512/maskable) — قمر على كحلي بلمسة بكسل."""
from PIL import Image, ImageDraw

NAVY = (11, 24, 56, 255)
FOAM = (207, 245, 234, 255)
AMBER = (255, 200, 87, 255)

def icon(size, maskable=False):
    img = Image.new('RGBA', (size, size), NAVY)
    d = ImageDraw.Draw(img)
    pad = size * (0.22 if maskable else 0.08)
    # نجوم
    for (sx, sy) in [(0.18, 0.2), (0.8, 0.16), (0.7, 0.36), (0.26, 0.42)]:
        r = size * 0.012
        d.ellipse([size*sx - r, size*sy - r, size*sx + r, size*sy + r], fill=FOAM)
    # قمر
    cx, cy, r = size * 0.5, size * 0.52, (size/2 - pad) * 0.62
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=FOAM)
    # هلال ظل
    r2 = r * 0.82
    d.ellipse([cx - r2 + r*0.5, cy - r2, cx + r2 + r*0.5, cy + r2], fill=NAVY)
    # وميض عنبر
    r3 = size * 0.035
    d.ellipse([cx + r*0.5 - r3, cy + r*0.55 - r3, cx + r*0.5 + r3, cy + r*0.55 + r3], fill=AMBER)
    return img

icon(192).save('icons/icon-192.png')
icon(512).save('icons/icon-512.png')
icon(512, maskable=True).save('icons/icon-maskable-512.png')
print('icons done')
