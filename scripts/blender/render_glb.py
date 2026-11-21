# Render a GLB model (Tripo/Meshy) in the game projection with the Studio sun, using scripts/blender/render.py helpers.
# Owner 20 Nov 2026 (Tripo): renders a downloaded GLB for the Studio like render.py renders a recipe.
# usage: python render_glb.py -- <model.json from blender-model.mjs> <file.glb> <out prefix> [--rot deg] [--margin m] [--samples n] [--height h]
import sys, json, math, time
import os
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'render.py')).read().rsplit('\nmain()', 1)[0]
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
exec(compile(src, 'render.py', 'exec'))
opt = lambda k, d: type(d)(argv[argv.index(k) + 1]) if k in argv else d
model = json.load(open(argv[0])); glb, prefix = argv[1], argv[2]
rot, margin, samples, want_h = opt('--rot', 0.0), opt('--margin', 0.08), opt('--samples', 64), opt('--height', 0.0)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = setup_scene(model, samples)
bpy.ops.import_scene.gltf(filepath=glb)
meshes = [o for o in scene.objects if o.type == 'MESH']
root = bpy.data.objects.new('root', None); scene.collection.objects.link(root)
for o in scene.objects:
    if o.parent is None and o is not root and o.type not in ('LIGHT', 'CAMERA'): o.parent = root
root.rotation_euler = (0, 0, math.radians(rot)); bpy.context.view_layer.update()
from mathutils import Vector
pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
mn = Vector([min(p[i] for p in pts) for i in range(3)]); mx = Vector([max(p[i] for p in pts) for i in range(3)])
fw, fh = model['footprint']['width'], model['footprint']['height']
k = min((fw - 2 * margin) / (mx.x - mn.x), (fh - 2 * margin) / (mx.y - mn.y))
if want_h: k = want_h / (mx.z - mn.z)
sx = opt('--sx', 1.0); root.scale = (k * sx, k, k); bpy.context.view_layer.update()
# Owner 21 Nov 2026 ("věž a bránu klidně vyrenderuj znovu"): --fill stretches the model across so its foot (the lowest
# 12 % of its height) covers the footprint exactly – the walls beside it then meet its faces with no gap.
if '--fill' in argv:
    vs = [o.matrix_world @ v.co for o in meshes for v in o.data.vertices]; zs = [v.z for v in vs]; z0 = min(zs); top = max(zs)
    foot = [v for v in vs if v.z <= z0 + 0.12 * (top - z0)]
    bx = max(v.x for v in foot) - min(v.x for v in foot); by = max(v.y for v in foot) - min(v.y for v in foot)
    kx, ky = fw / bx, fh / by; root.scale = (root.scale.x * kx, root.scale.y * ky, root.scale.z); bpy.context.view_layer.update()
    print('fill', kx, ky)
pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
mn = Vector([min(p[i] for p in pts) for i in range(3)]); mx = Vector([max(p[i] for p in pts) for i in range(3)])
root.location = (-(mn.x + mx.x) / 2, -(mn.y + mx.y) / 2, -mn.z); bpy.context.view_layer.update()
if '--fill' in argv:
    # Centre the foot (not the whole model with its overhangs and torch) on the footprint.
    vs = [o.matrix_world @ v.co for o in meshes for v in o.data.vertices]; z0 = min(v.z for v in vs); top = max(v.z for v in vs)
    foot = [v for v in vs if v.z <= z0 + 0.12 * (top - z0)]
    root.location.x -= (max(v.x for v in foot) + min(v.x for v in foot)) / 2; root.location.y -= (max(v.y for v in foot) + min(v.y for v in foot)) / 2; bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    mn = Vector([min(p[i] for p in pts) for i in range(3)]); mx = Vector([max(p[i] for p in pts) for i in range(3)])
h = mx.z - mn.z; print('size', (mx.x - mn.x), (mx.y - mn.y), h)
for o in meshes:
    for slot in o.material_slots:
        m = slot.material
        if m and m.use_nodes:
            for n in m.node_tree.nodes:
                if n.type == 'BSDF_PRINCIPLED':
                    n.inputs['Metallic'].default_value = 0.0
                    if not n.inputs['Roughness'].is_linked: n.inputs['Roughness'].default_value = 0.85
model['height'] = h
dg = bpy.context.evaluated_depsgraph_get()
hit = scene.ray_cast(dg, Vector((0.05, 0.05, h + 2)), Vector((0, 0, -1)))
print('deck', hit[1].z if hit[0] else None)
model['deck'] = hit[1].z if hit[0] else None
model['primitives'] = [{'at': [sx * fw / 2, 0, sz * fh / 2]} for sx in (-1, 1) for sz in (-1, 1)]
width, height, ppu, elev = camera(scene, model)
if '--front' in argv:
    # Front layer: only what stands above the deck on the camera side (the front merlons), everything else holdout.
    deck = model['deck'] - 0.03
    for m in {slot.material for o in meshes for slot in o.material_slots if slot.material}:
        nt = m.node_tree; outn = [n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL'][0]
        src_link = outn.inputs['Surface'].links[0]; src = src_link.from_socket
        geo = nt.nodes.new('ShaderNodeNewGeometry'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(geo.outputs['Position'], sep.inputs[0])
        above = nt.nodes.new('ShaderNodeMath'); above.operation = 'GREATER_THAN'; above.inputs[1].default_value = deck; nt.links.new(sep.outputs['Z'], above.inputs[0])
        diff = nt.nodes.new('ShaderNodeMath'); diff.operation = 'SUBTRACT'; nt.links.new(sep.outputs['X'], diff.inputs[0]); nt.links.new(sep.outputs['Y'], diff.inputs[1])
        front = nt.nodes.new('ShaderNodeMath'); front.operation = 'GREATER_THAN'; front.inputs[1].default_value = 0.0; nt.links.new(diff.outputs[0], front.inputs[0])
        both = nt.nodes.new('ShaderNodeMath'); both.operation = 'MULTIPLY'; nt.links.new(above.outputs[0], both.inputs[0]); nt.links.new(front.outputs[0], both.inputs[1])
        hold = nt.nodes.new('ShaderNodeHoldout'); mix = nt.nodes.new('ShaderNodeMixShader')
        nt.links.new(both.outputs[0], mix.inputs[0]); nt.links.new(hold.outputs[0], mix.inputs[1]); nt.links.new(src, mix.inputs[2]); nt.links.new(mix.outputs[0], outn.inputs['Surface'])
    objects = render_to(scene, f'{prefix}.pass-front.png')
    main = json.load(open(argv[argv.index('--front') + 1]))
    pre = premultiply(objects)
    for scale in (1, 2):
        factor = SS // scale; img = downsample(pre, factor); m = main['scales'][str(scale)] if 'scales' in main else main[str(scale)]
        ox, oy = width / 2 / factor, height / 2 / factor; x0, y0 = int(round(ox - m['anchor']['x'])), int(round(oy - m['anchor']['y']))
        part = img[y0:y0 + m['height'], x0:x0 + m['width']]; a = part[..., 3:4]
        rgb = np.where(a > 0, part[..., :3] / np.maximum(a, 1e-6), 0)
        Image.fromarray(np.clip(np.round(np.concatenate([rgb, a], -1) * 255), 0, 255).astype(np.uint8), 'RGBA').save(f'{prefix}.front.png' if scale == 1 else f'{prefix}.front.x2.png', optimize=True)
    print('front done'); sys.exit(0)
plane = ground(model)
with_shadow = render_to(scene, f'{prefix}.pass-shadow.png')
plane.hide_render = True
objects = render_to(scene, f'{prefix}.pass-objects.png')
shadow_alpha = np.clip(with_shadow[..., 3] - objects[..., 3], 0, 1)
full = np.percentile(shadow_alpha[shadow_alpha > 0.05], 95) if np.any(shadow_alpha > 0.05) else 1.0
shadow_alpha = np.clip(shadow_alpha / max(full, 1e-3), 0, 1) * model['light']['shadow']['opacity']
obj = premultiply(objects)
pre = obj + np.stack([np.zeros_like(shadow_alpha)] * 3 + [shadow_alpha], axis=-1) * (1 - obj[..., 3:4])
fw2, fh2 = fw / 2, fh / 2
out = {'engine': 'CYCLES', 'blender': bpy.app.version_string, 'samples': samples, 'supersampling': SS, 'scales': {}}
started = time.time()
for scale in (1, 2):
    factor = SS // scale
    img = downsample(pre, factor)
    origin = (width / 2 / factor, height / 2 / factor)
    corners = [(origin[0] + px / factor, origin[1] + py / factor) for px, py in (project((sx * fw2, 0, sz * fh2), ppu, elev) for sx in (-1, 1) for sz in (-1, 1))]
    path = f'{prefix}.png' if scale == 1 else f'{prefix}.x2.png'
    out['scales'][str(scale)] = {'file': path.split('/')[-1], **crop_and_save(img, origin, corners, path)}
out['modelHeight'] = h; out['deck'] = model['deck']; out['seconds'] = None
json.dump(out, open(f'{prefix}.render.json', 'w'), indent=1); print(json.dumps(out))
