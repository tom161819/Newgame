# Owner 21 Nov 2026 ("tady je model lučištníka a kušiníka, zpracuj je"): rig the owner's Tripo archer and crossbowman
# (one mesh each, standing; the archer holds the bow upright in the left hand, the crossbowman lets the crossbow hang
# from the right hand) with the bone names scripts/blender/render-soldier.py animates, and save a .blend it can render.
# python rig-tripo-ranged.py -- <glb> <blend> archer|crossbow
import bpy, sys, math, numpy as np
from mathutils import Vector
a = sys.argv[sys.argv.index('--') + 1:]
glb, out, model = a[0], a[1], a[2]
# Joint tables in the model's own units (1.0 tall: bow tip or hat), x: +left, -Y forward, Z up. `cx` is the point
# between the feet (it becomes the origin), `H` the height in metres the 1.0 is scaled to.
MODELS = {
 'archer': dict(H=1.77, cx=0.0, J={
  'pelvis': ((0, .04, .40), (0, .04, .48)), 'spine': ((0, .04, .48), (0, .04, .76)), 'head': ((0, .03, .78), (0, 0, .95)),
  'thigh.R': ((-.055, .04, .40), (-.07, .035, .22)), 'shin.R': ((-.07, .035, .22), (-.085, .06, .065)), 'foot.R': ((-.085, .06, .065), (-.09, -.05, .01)),
  'thigh.L': ((.055, .04, .40), (.075, .035, .22)), 'shin.L': ((.075, .035, .22), (.10, .06, .065)), 'foot.L': ((.10, .06, .065), (.11, -.05, .01)),
  'upper_arm.R': ((-.11, .04, .75), (-.165, .04, .58)), 'forearm.R': ((-.165, .04, .58), (-.17, .03, .46)), 'hand.R': ((-.17, .03, .46), (-.17, .02, .39)),
  'upper_arm.L': ((.11, .04, .75), (.16, .05, .575)), 'forearm.L': ((.16, .05, .575), (.145, -.09, .62)), 'hand.L': ((.145, -.09, .62), (.145, -.10, .66))}),
 'crossbow': dict(H=1.7, cx=.11, J={
  'pelvis': ((.11, .05, .40), (.11, .05, .48)), 'spine': ((.11, .05, .48), (.11, .05, .78)), 'head': ((.11, .03, .80), (.11, 0, .97)),
  'thigh.R': ((.05, .05, .40), (.025, .05, .22)), 'shin.R': ((.025, .05, .22), (.005, .06, .07)), 'foot.R': ((.005, .06, .07), (-.005, -.04, .01)),
  'thigh.L': ((.17, .05, .40), (.195, .05, .22)), 'shin.L': ((.195, .05, .22), (.215, .06, .07)), 'foot.L': ((.215, .06, .07), (.225, -.04, .01)),
  'upper_arm.R': ((0, .05, .77), (-.055, .05, .57)), 'forearm.R': ((-.055, .05, .57), (-.065, .03, .47)), 'hand.R': ((-.065, .03, .47), (-.06, 0, .42)),
  'upper_arm.L': ((.22, .05, .77), (.265, .05, .57)), 'forearm.L': ((.265, .05, .57), (.27, .04, .47)), 'hand.L': ((.27, .04, .47), (.265, .03, .40))}),
}
M = MODELS[model]; H, cx, J = M['H'], M['cx'], M['J']
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
bpy.ops.import_scene.gltf(filepath=glb)
me = [o for o in sc.objects if o.type == 'MESH'][0]
me.parent = None
bpy.context.view_layer.objects.active = me; me.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
co = np.array([v.co[:] for v in me.data.vertices]); co[:, 2] -= co[:, 2].min(); co[:, 2] /= co[:, 2].max()
x, y, z = co[:, 0].copy(), co[:, 1].copy(), co[:, 2].copy()  # model units, before the shift
co[:, 0] -= cx; co *= H
for v, c in zip(me.data.vertices, co): v.co = c
P = lambda p: Vector(((p[0] - cx) * H, p[1] * H, p[2] * H))
PARENT = {'spine': 'pelvis', 'head': 'spine', 'thigh.R': 'pelvis', 'thigh.L': 'pelvis', 'shin.R': 'thigh.R', 'shin.L': 'thigh.L', 'foot.R': 'shin.R', 'foot.L': 'shin.L',
          'upper_arm.R': 'spine', 'upper_arm.L': 'spine', 'forearm.R': 'upper_arm.R', 'forearm.L': 'upper_arm.L', 'hand.R': 'forearm.R', 'hand.L': 'forearm.L'}
arm_data = bpy.data.armatures.new('Rig'); arm = bpy.data.objects.new('Rig', arm_data); sc.collection.objects.link(arm)
bpy.ops.object.select_all(action='DESELECT'); bpy.context.view_layer.objects.active = arm; arm.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
for n, (h, t) in J.items():
    b = arm_data.edit_bones.new(n); b.head = P(h); b.tail = P(t); b.roll = 0
for n, p in PARENT.items(): arm_data.edit_bones[n].parent = arm_data.edit_bones[p]
bpy.ops.object.mode_set(mode='OBJECT')
names = list(J)
def dist(p, a_, b_):
    ab = b_ - a_; t = np.clip(((p - a_) @ ab) / (ab @ ab), 0, 1); return np.linalg.norm(p - (a_ + t[:, None] * ab), axis=1)
U = np.c_[x, y, z]
D = np.stack([dist(U, np.array(J[n][0], float), np.array(J[n][1], float)) for n in names], 1)
W = 1 / np.maximum(D, 1e-3) ** 4
# Loose pieces (islands): each moves only with the three bones it is mostly near.
nv = len(co); ed = np.zeros(len(me.data.edges) * 2, int); me.data.edges.foreach_get('vertices', ed); ed = ed.reshape(-1, 2)
par = np.arange(nv)
def find(i):
    r = i
    while par[r] != r: r = par[r]
    while par[i] != r: par[i], i = r, par[i]
    return r
for a_, b_ in ed:
    ra, rb = find(a_), find(b_)
    if ra != rb: par[ra] = rb
isl = np.unique(np.array([find(i) for i in range(nv)]), return_inverse=True)[1]
Wn = W / W.sum(1, keepdims=True); share = np.zeros((isl.max() + 1, len(names))); np.add.at(share, isl, Wn)
allowed = np.zeros_like(share, bool); allowed[np.arange(len(share))[:, None], np.argsort(-share, 1)[:, :3]] = True
W = np.where(allowed[isl], W, 0)
# Island centres (model units) and colour: the red tabard or sash.
cnt = np.bincount(isl); xc = np.bincount(isl, x) / cnt; yc = np.bincount(isl, y) / cnt; zc = np.bincount(isl, z) / cnt
img = [i for i in bpy.data.images if 'basecolor' in i.name.lower()] or list(bpy.data.images)
img = img[0]; iw, ih = img.size
px = np.array(img.pixels[:], dtype=np.float32).reshape(ih, iw, 4)
uv = np.zeros((nv, 2)); uvl = me.data.uv_layers.active.data
lv = np.zeros(len(me.data.loops), int); me.data.loops.foreach_get('vertex_index', lv)
luv = np.zeros(len(me.data.loops) * 2); uvl.foreach_get('uv', luv); uv[lv] = luv.reshape(-1, 2)
rgb = px[np.clip((uv[:, 1] * ih).astype(int), 0, ih - 1), np.clip((uv[:, 0] * iw).astype(int), 0, iw - 1), :3]
red = (rgb[:, 0] > rgb[:, 1] * 1.6) & (rgb[:, 0] > .08)
redshare = np.bincount(isl, red.astype(float)) / cnt
# Body gear (tabard, sash, belt, quivers, pouches) never goes with the arms: red pieces, and pieces whose centre is near
# the body column below the chest. Raising an arm tore them along before.
body = ((np.abs(xc - cx) < .12) & (zc < .56))[isl] | ((redshare > .5) & (np.abs(xc - cx) < .12))[isl]
for n in ('upper_arm.L', 'forearm.L', 'hand.L', 'upper_arm.R', 'forearm.R', 'hand.R'): W[body, names.index(n)] = 0
W[W.sum(1) == 0, names.index('spine')] = 1
# The weapon (whole pieces) goes rigidly with its hand.
if model == 'archer':
    weapon, hand = ((xc > .10) & (yc < -.07))[isl], 'hand.L'
else:
    # Pieces wholly on the right of the right leg below the hip (the leg's pieces reach past x 0); the prod's tip
    # beside the shin is one of them, so the weapon wins over the body rule.
    xmax = np.full(isl.max() + 1, -np.inf); np.maximum.at(xmax, isl, x)
    weapon, hand = ((xmax < 0) & (zc < .52) & ~((zc < .07) & (xmax > -.06)))[isl], 'hand.R'  # not the right boot's toe
if model == 'archer': weapon &= ~body
else: body &= ~weapon
groups = {n: me.vertex_groups.new(name=n) for n in names}
top2 = np.argsort(-W, 1)[:, :2]
groups[hand].add(np.flatnonzero(weapon).tolist(), 1.0, 'REPLACE')
for j in range(len(names)):
    for k in range(2):
        idx = np.flatnonzero(~weapon & (top2[:, k] == j))
        if not len(idx): continue
        wt = W[idx, j] / np.maximum(W[idx, top2[idx, 0]] + W[idx, top2[idx, 1]], 1e-12)
        for v_, w_ in zip(idx.tolist(), wt.tolist()): groups[names[j]].add([v_], float(w_), 'REPLACE')
me.parent = arm; mod = me.modifiers.new('Armature', 'ARMATURE'); mod.object = arm
for m in bpy.data.materials:
    nt = m.node_tree; bsdf = [n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'][0]
    link = bsdf.inputs['Base Color'].links[0]; src = link.from_socket
    hue = nt.nodes.new('ShaderNodeHueSaturation'); hue.name = 'Army cloth'; hue.inputs['Hue'].default_value = .5
    nt.links.new(src, hue.inputs['Color'])
    # Only the red cloth takes the army colour (render-soldier.py --hue): skin, leather and wood stay as they are.
    sep = nt.nodes.new('ShaderNodeSeparateColor'); nt.links.new(src, sep.inputs['Color'])
    red = nt.nodes.new('ShaderNodeMath'); red.operation = 'MULTIPLY_ADD'; nt.links.new(sep.outputs['Green'], red.inputs[0]); red.inputs[1].default_value = -3; nt.links.new(sep.outputs['Red'], red.inputs[2])  # linear colour: skin and bow wood stay below 0
    gain = nt.nodes.new('ShaderNodeMath'); gain.operation = 'MULTIPLY'; gain.use_clamp = True; nt.links.new(red.outputs[0], gain.inputs[0]); gain.inputs[1].default_value = 30
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'
    sock = lambda socks, ident: next(x for x in socks if x.identifier == ident)
    nt.links.new(gain.outputs[0], sock(mix.inputs, 'Factor_Float')); nt.links.new(src, sock(mix.inputs, 'A_Color')); nt.links.new(hue.outputs['Color'], sock(mix.inputs, 'B_Color'))
    nt.links.new(sock(mix.outputs, 'Result_Color'), bsdf.inputs['Base Color'])
sun = bpy.data.objects.new('Sun', bpy.data.lights.new('Sun', 'SUN')); sun.data.energy = 3.2; sun.data.angle = math.radians(3)
d = Vector((.55, -.9, 1)).normalized(); sun.rotation_euler = d.to_track_quat('Z', 'Y').to_euler(); sc.collection.objects.link(sun)
w = bpy.data.worlds.new('Sky'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (.75, .8, .9, 1); w.node_tree.nodes['Background'].inputs[1].default_value = .9
cam = bpy.data.objects.new('Camera', bpy.data.cameras.new('Camera')); sc.collection.objects.link(cam); sc.camera = cam
sc.view_settings.view_transform = 'Standard'
bpy.ops.wm.save_as_mainfile(filepath=out)
print('rigged', model, nv, 'weapon', int(weapon.sum()), 'body', int(body.sum()))
