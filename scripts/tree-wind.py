#!/usr/bin/env python3
"""m-duby-vitr, m-smrky (owner 15 Nov 2026): wind frames for the owner's season oaks and spruces.

The approved pictures stay as they are. Each frame moves the pixels of one picture a little:
- the trunk almost not at all (the shift grows with the height above the foot),
- the crown bends smoothly (main branches),
- leaves and twigs get an extra small, uneven shift (a noise field that moves through the crown),
so the crown never sways as one stiff piece. Frame 0 is the untouched picture; the loop is seamless.
Warping is done on the 2x export and scaled down, so the frames stay as sharp as the original.

Writes one sheet per species, look and season: rows = views 0, 90, 180, 270; columns = frames. All frames share one
size and one anchor (the tile centre of the picture). The sheets are the only pictures of these trees the game loads
(frame 0 is the still picture). Also writes src/data/objects/treeWind.js with the sheet data.
Run: python3 scripts/tree-wind.py
"""
import json, math, os
import numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates, gaussian_filter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPECIES = {'oak_tree': ('oak-tree', 'oak', ['young', 'broad', 'grand']), 'pine_tree': ('pine-tree', 'pine', ['young', 'medium', 'mature'])}
SEASONS = ['spring', 'summer', 'autumn', 'winter']
VIEWS = [0, 90, 180, 270]
FRAMES = 12
PERIOD_MS = 3200
# Bend at the top of the crown in 1x pixels per 100 px of tree height; leaf flutter in 1x pixels.
BEND, FLUTTER = 1.7, 0.75

def leaf_mask(rgba):
    a = rgba[..., 3] / 255.0
    r, g, b = [rgba[..., i].astype(float) for i in range(3)]
    mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    # Leaves (green, yellow, orange) are lighter and more saturated than bark; bark is dark brown.
    light = mx / 255.0
    return np.clip((sat - 0.18) * 3, 0, 1) * np.clip((light - 0.25) * 3, 0, 1) * a

def frames_for(img2, foot_y2, height2, seed, look):
    h, w = img2.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(float)
    up = np.clip((foot_y2 - yy) / max(height2, 1), 0, 1.2)
    bend = np.clip((up - 0.22) / 0.78, 0, None) ** 1.6          # trunk still, crown bends
    leaves = gaussian_filter(leaf_mask(img2), 1.0)
    rng = np.random.default_rng(seed)
    # Two smooth noise fields that drift across the crown: the flutter of leaves and twigs.
    def field(scale):
        n = gaussian_filter(rng.standard_normal((h, w)), scale)
        return n / (np.abs(n).max() + 1e-9)
    na, nb, nc = field(5), field(5), field(9)
    ph = rng.uniform(0, 2 * math.pi, 6)
    amp = BEND * 2 * height2 / 2 / 100.0                          # 2x pixels
    out = []
    for f in range(FRAMES):
        t = f / FRAMES
        s = lambda k, p: math.sin(2 * math.pi * k * t + p) - math.sin(p)   # 0 at t = 0, seamless loop
        c = lambda k, p: math.cos(2 * math.pi * k * t + p) - math.cos(p)
        # Main bend: a slow sway plus a gust that travels up the crown (phase by height), mostly sideways.
        sway = 0.7 * s(1, ph[0]) + 0.3 * np.sin(2 * math.pi * 2 * t + ph[1] + up * 2.2) - 0.3 * math.sin(ph[1])
        dx = amp * bend * sway
        dy = amp * 0.25 * bend * (0.5 * s(1, ph[2]) + 0.5 * s(2, ph[3]))
        # Flutter: the noise fields mixed by time, stronger on leaves and higher up, uneven across the crown.
        fl = FLUTTER * 2 * (0.4 + 0.6 * np.clip(up, 0, 1)) * (0.25 + 0.75 * leaves)
        dx = dx + fl * (na * s(2, ph[4]) + nc * c(3, ph[5]))
        dy = dy + fl * 0.6 * (nb * s(3, ph[5]) - nc * c(2, ph[4]))
        warped = np.stack([map_coordinates(img2[..., ch].astype(float), [yy - dy, xx - dx], order=1, mode='constant', cval=0) for ch in range(4)], -1)
        out.append(np.clip(warped, 0, 255).astype(np.uint8))
    return out

def main():
    data = {'frames': FRAMES, 'periodMs': PERIOD_MS, 'sheets': {}}
    for species, (asset, prefix, looks) in SPECIES.items():
        data['sheets'][species] = {}
        os.makedirs(f'{ROOT}/public/assets/resources/{species}/wind', exist_ok=True)
        for li, look in enumerate(looks):
            for season in SEASONS:
                ids = {v: f'{asset}-season-{look}-{season}-{v}' for v in VIEWS}
                metas = {v: json.load(open(f'{ROOT}/art/sprites/{asset}/{ids[v]}.v1.json')) for v in VIEWS}
                ax = max(m['anchor']['x'] for m in metas.values()); ay = max(m['anchor']['y'] for m in metas.values())
                fw = ax + max(m['width'] - m['anchor']['x'] for m in metas.values()); fh = ay + max(m['height'] - m['anchor']['y'] for m in metas.values())
                sheet = Image.new('RGBA', (fw * FRAMES, fh * len(VIEWS)), (0, 0, 0, 0))
                for row, v in enumerate(VIEWS):
                    m = metas[v]; base = f'{ROOT}/art/sprites/{asset}/{ids[v]}.v1'
                    one = Image.open(base + '.png').convert('RGBA'); two = np.array(Image.open(base + '.x2.png').convert('RGBA'))
                    ox, oy = ax - m['anchor']['x'], ay - m['anchor']['y']
                    frames = frames_for(two, m['base']['y'] * 2, m['base']['y'] * 2, li * 1000 + v + (0 if species == 'oak_tree' else 50000), look)
                    for f, arr in enumerate(frames):
                        img = one if f == 0 else Image.fromarray(arr).resize((m['width'], m['height']), Image.LANCZOS)
                        sheet.paste(img, (f * fw + ox, row * fh + oy))
                name = f'{prefix}-wind-{look}-{season}.v1.png'
                sheet.save(f'{ROOT}/public/assets/resources/{species}/wind/{name}', optimize=True)
                data['sheets'][species][f'{look}-{season}'] = {'sprite': f'/assets/resources/{species}/wind/{name}', 'frameWidth': fw, 'frameHeight': fh,
                    'origin': {'x': round(ax / fw, 5), 'y': round(ay / fh, 5)}, 'views': VIEWS, 'sources': [f'art/sprites/{asset}/{ids[v]}.v1.json' for v in VIEWS]}
                print(name, fw, fh)
    with open(f'{ROOT}/src/data/objects/treeWind.js', 'w') as f:
        f.write('// m-duby-vitr, m-smrky: generated by scripts/tree-wind.py – the season oaks and spruces as sheets (rows = views,\n'
                '// columns = wind frames; frame 0 is the approved picture, `sources`). Do not edit by hand.\n')
        f.write(f'export const TREE_WIND=Object.freeze({json.dumps(data, separators=(",", ":"))});\n')

if __name__ == '__main__':
    main()
