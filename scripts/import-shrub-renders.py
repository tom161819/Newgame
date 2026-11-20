#!/usr/bin/env python3
"""Owner's Blender shrubs and thickets (15 Nov 2026, "Keře a houštiny") into the Asset Studio.

usage: python3 scripts/import-shrub-renders.py <unpacked Krovi folder>

1. puvodni_nazvy/: 46 transparent replacements with the same names and pixel sizes as the Studio's shrub, thicket and
   bush variants. Each becomes the next version of that variant (pre-made image, anchor from original_map.json).
2. assets/<model>/: 28 models x 4 seasons x 4 isometric views (1x game scale, tile 64 px wide). Each model becomes one
   Studio asset `<model>-views` (category nature) with 16 variants `<model>-views-<season>-<view>`; all seasons of a
   view share the crop and anchor, as for the trees.
"""
import hashlib, json, os, shutil, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1]
SEASONS = ['spring', 'summer', 'autumn', 'winter']
VIEWS = ['0', '90', '180', '270']
VIEW_NAMES = {'0': 'front-right', '90': 'front-left', '180': 'back-left', '270': 'back-right'}
STAMP = '15 Nov 2026'
NAMES = {'bramble': 'Bramble', 'hazel': 'Hazel', 'heather': 'Heather', 'juniper': 'Juniper', 'rosehip': 'Rosehip', 'mixed': 'Mixed (hazel, bramble, juniper)',
         'meadow': 'Meadow bush', 'berry': 'Berry bush', 'flowering': 'Flowering bush', 'scrub': 'Scrub'}
SIZES = {'1': 'small', '2': 'medium', '3': 'large'}

def rnd(v): return round(v, 5)

def meta(asset, variant, name, version, category, img, ax, ay, footprint, note_source):
    w, h = img.size
    ax, ay = int(round(ax)), int(round(ay))
    return {"schema": 1, "assetId": asset, "variantId": variant, "name": name, "category": category, "version": version,
            "specHash": hashlib.sha1(img.tobytes()).hexdigest()[:8], "generator": "image", "generatorVersion": 1,
            "styleGuide": "medieval-kingdom-painted-isometric@1", "scale": 1, "width": w, "height": h,
            "anchor": {"x": ax, "y": ay}, "origin": {"x": rnd(ax / w), "y": rnd(ay / h)}, "footprint": footprint,
            "base": {"x": ax, "y": ay}, "baseOrigin": {"x": rnd(ax / w), "y": rnd(ay / h)}, "visualHeight": ay,
            "platform": None, "frontLayer": False, "gameLights": [], "lights": [], "render": {"source": note_source}}

def find_variant(stem):
    for d in os.listdir(os.path.join(ROOT, 'art/assets')):
        for a in os.listdir(os.path.join(ROOT, 'art/assets', d)):
            p = os.path.join(ROOT, 'art/assets', d, a, 'asset.json')
            if not os.path.exists(p): continue
            spec = json.load(open(p))
            for v in spec['variants']:
                if v['id'] == stem: return p, spec, v
    raise SystemExit(f'no Studio variant {stem}')

def replacements():
    mapping = json.load(open(os.path.join(SRC, 'original_map.json')))
    touched = {}
    for rel, info in mapping.items():
        stem = os.path.splitext(os.path.basename(rel))[0]
        path, spec, variant = find_variant(stem)
        spec = touched.get(path, spec); variant = next(v for v in spec['variants'] if v['id'] == stem)
        old = variant['version']; new = old + 1
        img = Image.open(os.path.join(SRC, 'puvodni_nazvy', rel)).convert('RGBA')
        assert list(img.size) == info['original_size'], (stem, img.size, info['original_size'])
        out = os.path.join(ROOT, 'art/sprites', spec['id'])
        img.save(os.path.join(out, f'{stem}.v{new}.png'), optimize=True)
        oldmeta = json.load(open(os.path.join(out, f'{stem}.v{old}.json')))
        m = meta(spec['id'], stem, variant['name'], new, spec['category'], img, *info['replacement_origin_px'], oldmeta.get('footprint', spec['footprint']), 'blender')
        json.dump(m, open(os.path.join(out, f'{stem}.v{new}.json'), 'w'), indent=2)
        variant['version'] = new
        variant['baked'] = {"renderer": "image", "source": "blender", "view": info['angle']}
        variant['notes'] = (f"Owner's Blender render ({STAMP}, Keře a houštiny): model {info['asset']}, {info['season']}, view {info['angle']}°, "
                            f"fitted into the original {img.size[0]}×{img.size[1]} frame without distortion. Previous version: generated drawing v{old}.")
        touched[path] = spec
    for path, spec in touched.items():
        json.dump(spec, open(path, 'w'), indent=2); open(path, 'a').write('\n')
    return len(mapping)

def label(model):
    parts = model.split('-')
    if parts[0] == 'shrubs': return f"{NAMES[parts[1]]} {SIZES[parts[2]]}"
    if parts[0] == 'thicket': return f"Thicket {parts[1].replace('x', '×')} – {NAMES[parts[2]]}"
    return NAMES[parts[1]]

def models():
    made = 0
    for model in sorted(os.listdir(os.path.join(SRC, 'assets'))):
        base = os.path.join(SRC, 'assets', model)
        sprite = json.load(open(os.path.join(base, 'sprite.json')))
        fw, fh = sprite['footprint']; footprint = {"width": fw, "height": fh}
        asset = f'{model}-views'
        out = os.path.join(ROOT, 'art/sprites', asset); os.makedirs(out, exist_ok=True)
        variants = []
        # The Studio needs a real generator and spec (as the baked trees have): the matching drawn variant's spec, with
        # this season. Mixed thickets take the autumn mix.
        base_id = {'thicket': lambda p: f"thicket-{p[1]}-{'autumn' if p[2] == 'mixed' else p[2]}"}.get(model.split('-')[0], lambda p: model)(model.split('-'))
        _, base_spec, base_variant = find_variant(base_id)
        for season in SEASONS:
            if model.startswith('thicket'):
                # Drawn thickets only fit their footprint with their own season mixes: winter and autumn take those.
                fp, species = model.split('-')[1], model.split('-')[2]
                sid = f"thicket-{fp}-{season}" if season in ('autumn', 'winter') else f"thicket-{fp}-{'hazel' if species == 'mixed' else species}"
                _, base_spec, base_variant = find_variant(sid)
            for view in VIEWS:
                vid = f'{asset}-{season}-{view}'
                img = Image.open(os.path.join(base, season, '1x', f'{int(view):03d}.png')).convert('RGBA')
                ox, oy = sprite['views'][view]['origin_px']
                name = f"{label(model)}, {season} {view}° ({VIEW_NAMES[view]})"
                img.save(os.path.join(out, f'{vid}.v1.png'), optimize=True)
                json.dump(meta(asset, vid, name, 1, 'nature', img, ox, oy, footprint, 'blender'), open(os.path.join(out, f'{vid}.v1.json'), 'w'), indent=2)
                variants.append({"id": vid, "name": name, "version": 1,
                                 "notes": f"Owner's Blender render ({STAMP}, Keře a houštiny): {season}, view {view}° ({VIEW_NAMES[view]}), same camera as the trees; all seasons of this view share the crop and anchor. 1x game scale (tile 64 px wide).",
                                 "spec": {**base_variant['spec'], **({'season': season} if 'season' in base_variant['spec'] or base_spec['generator'] == 'vegetation' else {})},
                                 "baked": {"renderer": "image", "source": "blender", "view": int(view)}})
                made += 1
        d = os.path.join(ROOT, 'art/assets/nature', asset); os.makedirs(d, exist_ok=True)
        spec = {"schema": 1, "id": asset, "name": f"{label(model)} – 4 seasons × 4 views", "category": "nature",
                "description": f"Owner's Blender model {model} ({STAMP}): four seasons in the four isometric views of the trees. On the map a shrub can use any of the four views for variety, as the trees do.",
                "footprint": footprint, "generator": base_spec['generator'], "variants": variants}
        json.dump(spec, open(os.path.join(d, 'asset.json'), 'w'), indent=2); open(os.path.join(d, 'asset.json'), 'a').write('\n')
    return made

print('replacements', replacements())
print('views', models())
