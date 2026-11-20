# Owner 20 Nov 2026 ("tady je model halapartníka"): rig the owner's Tripo halberdier (one mesh, rest pose: halberd upright in both hands)
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
s = H / 1.0  # joint table below is in the model's own units (1.0 tall)
J = {  # bone: (head, tail) in the model's units (1.0 tall incl. the halberd), x: +left, -Y forward, Z up
 'pelvis': ((.01, 0, .48), (.01, 0, .54)), 'spine': ((.01, 0, .54), (.01, 0, .71)), 'head': ((.01, 0, .71), (.01, 0, .86)),
 'thigh.R': ((-.06, 0, .48), (-.065, 0, .27)), 'shin.R': ((-.065, 0, .27), (-.07, .01, .05)), 'foot.R': ((-.07, .01, .05), (-.075, -.07, .01)),
 'thigh.L': ((.085, 0, .48), (.09, 0, .27)), 'shin.L': ((.09, 0, .27), (.095, .01, .05)), 'foot.L': ((.095, .01, .05), (.1, -.07, .01)),
 'upper_arm.R': ((-.10, 0, .68), (-.12, -.01, .56)), 'forearm.R': ((-.12, -.01, .56), (-.065, -.075, .615)), 'hand.R': ((-.065, -.075, .615), (-.06, -.085, .64)),
 'upper_arm.L': ((.12, 0, .68), (.12, 0, .55)), 'forearm.L': ((.12, 0, .55), (-.03, -.075, .47)), 'hand.L': ((-.03, -.075, .47), (-.03, -.085, .44)),
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
# Each loose piece of the mesh moves only with the three bones it is mostly near (the left forearm runs across the belly,
# so without this the belt and tabard went with the arm).
nv = len(co); ed = np.zeros(len(me.data.edges) * 2, int); me.data.edges.foreach_get('vertices', ed); ed = ed.reshape(-1, 2)
par = np.arange(nv)
def find(a):
    r = a
    while par[r] != r: r = par[r]
    while par[a] != r: par[a], a = r, par[a]
    return r
for a_, b_ in ed:
    ra, rb = find(a_), find(b_)
    if ra != rb: par[ra] = rb
isl = np.unique(np.array([find(i) for i in range(nv)]), return_inverse=True)[1]
Wn = W / W.sum(1, keepdims=True)
share = np.zeros((isl.max() + 1, len(names)))
np.add.at(share, isl, Wn)
allowed = np.zeros_like(share, bool); allowed[np.arange(len(share))[:, None], np.argsort(-share, 1)[:, :3]] = True
W = np.where(allowed[isl], W, 0)
# The red tabard on the body column never goes with the forearms or hands (the left forearm lies across the belly).
img = [i for i in bpy.data.images if 'basecolor' in i.name.lower()] or list(bpy.data.images)
img = img[0]; iw, ih = img.size
px = np.array(img.pixels[:], dtype=np.float32).reshape(ih, iw, 4)
uv = np.zeros((len(co), 2)); uvl = me.data.uv_layers.active.data
for loop in me.data.loops: uv[loop.vertex_index] = uvl[loop.index].uv
rgb = px[np.clip((uv[:, 1] * ih).astype(int), 0, ih - 1), np.clip((uv[:, 0] * iw).astype(int), 0, iw - 1), :3]
red_v = (rgb[:, 0] > rgb[:, 1] * 1.6) & (rgb[:, 0] > .08)
body = (np.abs(x - .01) < .085) & (z < .66) & (red_v | (z < .42) | (y > -.02))
for n in ('forearm.L', 'hand.L', 'forearm.R', 'hand.R'): W[body, names.index(n)] = 0
W[body & (W.sum(1) == 0), names.index('spine')] = 1
print('tabard body verts', int(body.sum()))
top2 = np.argsort(-W, 1)[:, :2]
# The halberd: every vertex near the shaft line (it runs in front of the body through both hands) and the blade above
# the hat goes with the right hand.
a0, a1 = np.array([.01, -.08, .083]), np.array([-.086, -.079, .898])
P = np.c_[x, y, z]; ab = a1 - a0; t = ((P - a0) @ ab) / (ab @ ab)
dshaft = np.linalg.norm(P - (a0 + t[:, None] * ab), axis=1)
sword = (dshaft < .016) | ((z > .87) & (x < -.045))
shield = np.zeros(len(co), bool)
for i in range(len(co)):
    if sword[i]: groups['hand.R'].add([i], 1.0, 'REPLACE'); continue
    if shield[i]: groups['forearm.L'].add([i], 1.0, 'REPLACE'); continue
    w = W[i, top2[i]]; w = w / max(w.sum(), 1e-12)
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
