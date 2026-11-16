"""Renders the owner's rigged soldier models (Medieval_Kingdom_Vojaci_3D, owner 16 Nov 2026) into game sheets.

python3.11 render-soldier.py <model.blend> <out_dir> <kind> [--samples 16] [--only k]
kind: sword | spear | bow (which attack clip the figure plays).

Sheet layout (written as frames <dir>/<k>-<col>.png, packed by scripts/soldier-sheets.mjs):
rows = 8 facings in FACING_INDEX order (SE, E, NE, N, NW, W, SW, S); columns = idle, walk 0-7, attack 0-5, die 0-3.
The camera is the game's 2:1 projection (elevation 30 deg, azimuth 45 deg), 30 px per metre after the 3x supersample
is reduced; the lights of the owner's file stay fixed, the figure turns under them. Poses are FK rotations of the
shared bone names about the figure's own axes (X sideways, -Y forward, Z up).
"""
import bpy, sys, math, json, os
from mathutils import Vector, Quaternion, Matrix

args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
blend, out, kind = args[0], args[1], args[2]
samples = int(args[args.index('--samples') + 1]) if '--samples' in args else 16
only = int(args[args.index('--only') + 1]) if '--only' in args else None
SS = 3; PPM = 30; FW, FH = 128, 136; ANCHOR = (64, 100)  # final frame and the feet point inside it

bpy.ops.wm.open_mainfile(filepath=blend)
sc = bpy.context.scene
arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
cam = sc.camera
sc.render.engine = 'CYCLES'; sc.cycles.samples = samples; sc.cycles.use_denoising = True
try: sc.cycles.denoiser = 'OPENIMAGEDENOISE'
except Exception: pass
sc.render.film_transparent = True
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = FW * SS, FH * SS, 100
sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
el, az = math.radians(30), math.radians(45)
cam.data.type = 'ORTHO'; cam.data.ortho_scale = max(FW, FH) / PPM
direction = Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))
cam.location = direction * 12; cam.rotation_euler = (math.pi / 2 - el, 0, az)
# Put the world origin (between the feet) on the anchor pixel.
big = max(FW, FH)
cam.data.shift_x = -(ANCHOR[0] - FW / 2) / big
cam.data.shift_y = (ANCHOR[1] - FH / 2) / big

pb = arm.pose.bones
for p in pb: p.rotation_mode = 'QUATERNION'
X = Vector((1, 0, 0)); Z = Vector((0, 0, 1)); Y = Vector((0, 1, 0))

def rest():
  for p in pb: p.rotation_quaternion = Quaternion(); p.location = (0, 0, 0)

def rot(name, deg, axis=X):
  """Rotate a bone by deg about an axis of the figure (armature space), on top of what it has."""
  if name not in pb or not deg: return
  b = arm.data.bones[name]; local = (b.matrix_local.to_3x3().inverted() @ axis).normalized()
  p = pb[name]; p.rotation_quaternion = p.rotation_quaternion @ Quaternion(local, math.radians(deg))

def lift(dz, dy=0):
  b = arm.data.bones['pelvis']; pb['pelvis'].location = b.matrix_local.to_3x3().inverted() @ Vector((0, dy, dz))

LEG = (pb['thigh.R'].bone.length + pb['shin.R'].bone.length) if 'thigh.R' in pb else .85
# Downward bones: negative = forward. Upward bones (spine, head): positive = forward.
held = {'sword': {'R': .45, 'L': .35}, 'spear': {'R': .2, 'L': 1}, 'bow': {'R': 1, 'L': .45}}[kind]

def walk(i):
  rest(); p = 2 * math.pi * i / 8; s, c = math.sin(p), math.cos(p); A, K, B = 26, 42, 20
  rot('thigh.R', -A * s); rot('thigh.L', A * s)
  rot('shin.R', K * max(0, c) ** 1.2); rot('shin.L', K * max(0, -c) ** 1.2)
  rot('foot.R', -8 * max(0, c)); rot('foot.L', -8 * max(0, -c))
  rot('upper_arm.R', B * s * held['R']); rot('upper_arm.L', -B * s * held['L'])
  rot('forearm.R', -12 * held['R']); rot('forearm.L', -12 * held['L'])
  rot('spine', 4); rot('spine', 4 * s, Z)
  lift(-LEG * (1 - math.cos(math.radians(A * abs(s)))) + .012 * (1 - abs(s)))

def guard_left():
  if kind == 'sword': rot('upper_arm.L', -28); rot('forearm.L', -62); rot('upper_arm.L', 12, Y)

SWORD = [(-45, -25, 2), (-125, -45, -2), (-165, -55, -4), (-105, -15, 8), (-55, -5, 12), (-30, -15, 6)]
SPEAR = [(-165, 95, 0), (-158, 97, 0), (-128, 100, 6), (-104, 102, 12), (-122, 100, 6), (-150, 97, 2)]
BOW = [(-45, 45, -40, -60), (-82, 82, -82, -110), (-85, 85, -86, -150), (-85, 85, -86, -152), (-84, 84, -62, -40), (-60, 60, -35, -20)]

def attack(i):
  rest()
  if kind == 'sword':
    up, fore, lean = SWORD[i]; rot('upper_arm.R', up); rot('forearm.R', fore); rot('spine', lean); rot('spine', -10 + 4 * i, Z); guard_left()
    if i >= 3: rot('thigh.L', -16); rot('shin.L', 10); rot('thigh.R', 12); lift(-.03)
  elif kind == 'spear':
    up, fore_abs, lean = SPEAR[i]; rot('upper_arm.R', up); rot('forearm.R', fore_abs - up); rot('spine', lean)
    rot('upper_arm.L', -40 - lean * 2); rot('forearm.L', -50)
    if lean > 5: rot('thigh.L', -lean * 1.6); rot('shin.L', lean); rot('thigh.R', lean); lift(-.004 * lean)
  else:
    lu, lh, ru, rf = BOW[i]; rot('upper_arm.L', lu); rot('hand.L', lh); rot('upper_arm.R', ru); rot('forearm.R', rf)
    rot('spine', -14, Z); rot('head', 10, Z)

def die(i):
  """Knees give, then he falls on his back (the body turns about the feet and lies on the ground)."""
  rest(); tilt = [0, 32, 66, 88][i]; buckle = [1, .7, .25, 0][i]
  rot('thigh.R', -22 * buckle); rot('thigh.L', -28 * buckle); rot('shin.R', 40 * buckle); rot('shin.L', 48 * buckle); lift(-.08 * buckle)
  rot('spine', 12 * buckle - 6 * (1 - buckle)); rot('head', -10 * (1 - buckle))
  rot('upper_arm.R', 30 * (i / 3), Y); rot('upper_arm.L', -30 * (i / 3), Y); rot('upper_arm.R', -20 * buckle); rot('upper_arm.L', -20 * buckle)
  arm.rotation_euler.x = math.radians(-tilt); arm.location.z = .14 * math.sin(math.radians(tilt))

frames = [('idle', 0, rest)] + [('walk', i, walk) for i in range(8)] + [('attack', i, attack) for i in range(6)] + [('die', i, die) for i in range(4)]
os.makedirs(out, exist_ok=True)
for k in range(8):
  if only is not None and k != only: continue
  for col, (name, i, fn) in enumerate(frames):
    arm.rotation_euler = (0, 0, math.radians(45 + 45 * k)); arm.location = (0, 0, 0)
    fn(i) if name != 'idle' else rest()
    bpy.context.view_layer.update()
    sc.render.filepath = os.path.join(out, f'{k}-{col:02d}.png')
    bpy.ops.render.render(write_still=True)
json.dump({'frameWidth': FW, 'frameHeight': FH, 'anchor': ANCHOR, 'supersample': SS, 'columns': [f'{n}-{i}' for n, i, _ in frames]}, open(os.path.join(out, 'layout.json'), 'w'))
