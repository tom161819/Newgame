# Owner 20 Nov 2026 (docs/changes/tripo-rytir.md). Usage: python rig-tripo-knight.py -- <knight.glb> <out.blend> [height m]
# Owner 20 Nov 2026: rig the owner's Tripo knight (one mesh, rest pose: sword down in the right hand, shield on the left arm)
# with the bone names scripts/blender/render-soldier.py animates, and save a .blend it can render.
import bpy, sys, math, numpy as np
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]
glb, out, H = a[0], a[1], float(a[2]) if len(a) > 2 else 1.7
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
bpy.ops.import_scene.gltf(filepath=glb)
me = [o for o in sc.objects if o.type == 'MESH'][0]
for o in list(sc.objects):
    if o is not me and o.type != 'MESH': pass
me.parent = None
bpy.context.view_layer.objects.active = me; me.select_set(True)
k = H / me.dimensions.z
me.scale = (k, k, k); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
co = np.array([v.co[:] for v in me.data.vertices]); co[:, 2] -= co[:, 2].min()
for v, c in zip(me.data.vertices, co): v.co = c
s = H / 0.998  # joint table below is in the model's own units (0.998 tall)
J = {  # bone: (head, tail), x: +left, -Y forward, Z up
 'pelvis': ((0, 0, .47), (0, 0, .55)), 'spine': ((0, 0, .55), (0, 0, .80)), 'head': ((0, 0, .80), (0, 0, .98)),
 'thigh.R': ((-.07, 0, .47), (-.07, 0, .27)), 'shin.R': ((-.07, 0, .27), (-.07, .01, .06)), 'foot.R': ((-.07, .01, .06), (-.07, -.08, .01)),
 'thigh.L': ((.07, 0, .47), (.07, 0, .27)), 'shin.L': ((.07, 0, .27), (.07, .01, .06)), 'foot.L': ((.07, .01, .06), (.07, -.08, .01)),
 'upper_arm.R': ((-.13, 0, .77), (-.17, 0, .62)), 'forearm.R': ((-.17, 0, .62), (-.185, -.02, .49)), 'hand.R': ((-.185, -.02, .49), (-.19, -.03, .43)),
 'upper_arm.L': ((.13, 0, .77), (.16, 0, .62)), 'forearm.L': ((.16, 0, .62), (.17, -.03, .50)), 'hand.L': ((.17, -.03, .50), (.175, -.04, .45)),
}
PARENT = {'spine': 'pelvis', 'head': 'spine', 'thigh.R': 'pelvis', 'thigh.L': 'pelvis', 'shin.R': 'thigh.R', 'shin.L': 'thigh.L', 'foot.R': 'shin.R', 'foot.L': 'shin.L',
          'upper_arm.R': 'spine', 'upper_arm.L': 'spine', 'forearm.R': 'upper_arm.R', 'forearm.L': 'upper_arm.L', 'hand.R': 'forearm.R', 'hand.L': 'forearm.L'}
arm_data = bpy.data.armatures.new('Rig'); arm = bpy.data.objects.new('Rig', arm_data); sc.collection.objects.link(arm)
bpy.ops.object.select_all(action='DESELECT'); bpy.context.view_layer.objects.active = arm; arm.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
for n, (h, t) in J.items():
    b = arm_data.edit_bones.new(n); b.head = Vector(h) * s; b.tail = Vector(t) * s; b.roll = 0
for n, p in PARENT.items(): arm_data.edit_bones[n].parent = arm_data.edit_bones[p]
bpy.ops.object.mode_set(mode='OBJECT')
# Weights: inverse distance to the bone segments (two nearest bones, smooth falloff), with the sword in the right hand
# and the shield on the left forearm.
segs = {n: (np.array(h) * s, np.array(t) * s) for n, (h, t) in J.items()}
names = list(segs)
def dist(p, a, b):
    ab = b - a; t = np.clip(((p - a) @ ab) / (ab @ ab), 0, 1); return np.linalg.norm(p - (a + t[:, None] * ab), axis=1)
D = np.stack([dist(co, *segs[n]) for n in names], 1)
x, y, z = co[:, 0] / s, co[:, 1] / s, co[:, 2] / s
# The tabard/skirt hangs between the legs: let the pelvis keep a share there.
groups = {n: me.vertex_groups.new(name=n) for n in names}
W = 1 / np.maximum(D, 1e-3) ** 4
top2 = np.argsort(-W, 1)[:, :2]
# The Tripo mesh is many loose pieces: whole pieces go with the sword or the shield by their centre, so no part of the
# tabard is torn off with the shield.
import bmesh
bm = bmesh.new(); bm.from_mesh(me.data); bm.verts.ensure_lookup_table()
island = np.full(len(co), -1); n_isl = 0
for v in bm.verts:
    if island[v.index] >= 0: continue
    st = [v]; island[v.index] = n_isl
    while st:
        u = st.pop()
        for e in u.link_edges:
            w2 = e.other_vert(u)
            if island[w2.index] < 0: island[w2.index] = n_isl; st.append(w2)
    n_isl += 1
bm.free()
cnt = np.bincount(island); cx = np.bincount(island, x) / cnt; cz = np.bincount(island, z) / cnt
# Colour of each piece from the texture: the red tabard never goes with the sword (its hem hangs right beside it).
img = [i for i in bpy.data.images if 'basecolor' in i.name][0]; iw, ih = img.size
px = np.array(img.pixels[:], dtype=np.float32).reshape(ih, iw, 4)
uv = np.zeros((len(co), 2)); uvl = me.data.uv_layers.active.data
for loop in me.data.loops: uv[loop.vertex_index] = uvl[loop.index].uv
rgb = px[np.clip((uv[:, 1] * ih).astype(int), 0, ih - 1), np.clip((uv[:, 0] * iw).astype(int), 0, iw - 1), :3]
red_v = (rgb[:, 0] > rgb[:, 1] * 1.6) & (rgb[:, 0] > .08)
red = (np.bincount(island, red_v) / cnt) > .5
sword = (cx[island] < -.125) & (cz[island] < .52) & ~red[island]
shield = (cx[island] > .14) & (cz[island] > .28) & (cz[island] < .74)
for i in range(len(co)):
    if sword[i]: groups['hand.R'].add([i], 1.0, 'REPLACE'); continue
    if shield[i]: groups['forearm.L'].add([i], 1.0, 'REPLACE'); continue
    w = W[i, top2[i]]; w = w / w.sum()
    for j, wt in zip(top2[i], w): groups[names[j]].add([i], float(wt), 'REPLACE')
me.parent = arm; mod = me.modifiers.new('Armature', 'ARMATURE'); mod.object = arm
# Material: an "Army cloth" hue node on the texture (render-soldier.py --hue recolours the red tabard for the enemy).
for m in bpy.data.materials:
    nt = m.node_tree; bsdf = [n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'][0]
    link = bsdf.inputs['Base Color'].links[0]; src = link.from_socket
    hue = nt.nodes.new('ShaderNodeHueSaturation'); hue.name = 'Army cloth'; hue.inputs['Hue'].default_value = .5
    nt.links.new(src, hue.inputs['Color']); nt.links.new(hue.outputs['Color'], bsdf.inputs['Base Color'])
    if 'Metallic' in bsdf.inputs and not bsdf.inputs['Metallic'].is_linked: bsdf.inputs['Metallic'].default_value = .6
# Lights: the style sun from the front left (Studio light), a soft sky.
sun = bpy.data.objects.new('Sun', bpy.data.lights.new('Sun', 'SUN')); sun.data.energy = 3.2; sun.data.angle = math.radians(3)
d = Vector((.55, -.9, 1)).normalized(); sun.rotation_euler = d.to_track_quat('Z', 'Y').to_euler(); sc.collection.objects.link(sun)
w = bpy.data.worlds.new('Sky'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (.75, .8, .9, 1); w.node_tree.nodes['Background'].inputs[1].default_value = .9
cam = bpy.data.objects.new('Camera', bpy.data.cameras.new('Camera')); sc.collection.objects.link(cam); sc.camera = cam
sc.view_settings.view_transform = 'Standard'
bpy.ops.wm.save_as_mainfile(filepath=out)
print('rigged', len(co), 'sword', int(sword.sum()), 'shield', int(shield.sum()))
