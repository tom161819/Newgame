"""Renders the owner's rigged soldier models (Medieval_Kingdom_Vojaci_3D, owner 16 Nov 2026) into game sheets.

python3.11 render-soldier.py <model.blend> <out_dir> <kind> [--samples 16] [--only k]
kind: sword | spear | bow | crossbow | halberd | cavalry (which attack clip the figure plays).
Owner 18 Nov 2026 (Medieval_Kingdom_Vojaci_5_trid_3D): crossbow, halberd and cavalry (a rider on a rigged horse,
Rig_Kun; the rider is held by Child Of on the horse's body, so the horse rig is the one that turns).

Sheet layout (written as frames <dir>/<k>-<col>.png, packed by scripts/soldier-sheets.mjs):
rows = 8 facings in FACING_INDEX order (SE, E, NE, N, NW, W, SW, S); columns = idle, walk 0-7, attack 0-5, die 0-3, idle 1-5 (stand-still moves).
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
first = int(args[args.index('--from') + 1]) if '--from' in args else 0
last = int(args[args.index('--to') + 1]) if '--to' in args else 99
TILT = float(os.environ.get('XBOW_TILT', '25'))  # crossbow level at the shoulder
hue = float(args[args.index('--hue') + 1]) if '--hue' in args else None  # army colour: node "Army cloth" Hue (0.5 = the owner's wine red)  # render only columns from this one on
SS = 3; PPM = 30; FW, FH = 128, 136; ANCHOR = (64, 100)  # final frame and the feet point inside it

bpy.ops.wm.open_mainfile(filepath=blend)
sc = bpy.context.scene
rigs = [o for o in bpy.data.objects if o.type == 'ARMATURE']
horse = next((o for o in rigs if o.name == 'Rig_Kun'), None)
arm = next(o for o in rigs if o is not horse)
turn = horse or arm  # the object turned to each facing (the rider follows the horse)
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

if hue is not None:
  for m in bpy.data.materials:
    node = m.node_tree.nodes.get('Army cloth') if m.node_tree else None
    if node and 'Hue' in node.inputs: node.inputs['Hue'].default_value = hue
pb = arm.pose.bones
for p in pb: p.rotation_mode = 'QUATERNION'
X = Vector((1, 0, 0)); Z = Vector((0, 0, 1)); Y = Vector((0, 1, 0))

def rest(*_):
  hrest() if 'hrest' in globals() else None
  for p in pb: p.rotation_quaternion = Quaternion(); p.location = (0, 0, 0)

def rot(name, deg, axis=X):
  """Rotate a bone by deg about an axis of the figure (armature space), on top of what it has."""
  if name not in pb or not deg: return
  b = arm.data.bones[name]; local = (b.matrix_local.to_3x3().inverted() @ axis).normalized()
  p = pb[name]; p.rotation_quaternion = p.rotation_quaternion @ Quaternion(local, math.radians(deg))

def lift(dz, dy=0):
  if kind == 'cavalry': return
  b = arm.data.bones['pelvis']; pb['pelvis'].location = b.matrix_local.to_3x3().inverted() @ Vector((0, dy, dz))

LEG = (pb['thigh.R'].bone.length + pb['shin.R'].bone.length) if 'thigh.R' in pb else .85
# Downward bones: negative = forward. Upward bones (spine, head): positive = forward.
held = {'sword': {'R': .45, 'L': .35}, 'spear': {'R': .2, 'L': 1}, 'bow': {'R': 1, 'L': .45}, 'crossbow': {'R': .15, 'L': .15},
        'halberd': {'R': .15, 'L': .8}, 'cavalry': {'R': .2, 'L': .2}}[kind]
hb = horse.pose.bones if horse else None
if hb:
  for p in hb: p.rotation_mode = 'QUATERNION'

def hrot(name, deg, axis=X):
  if not hb or name not in hb or not deg: return
  b = horse.data.bones[name]; local = (b.matrix_local.to_3x3().inverted() @ axis).normalized()
  p = hb[name]; p.rotation_quaternion = p.rotation_quaternion @ Quaternion(local, math.radians(deg))

def hrest():
  if hb:
    for p in hb: p.rotation_quaternion = Quaternion(); p.location = (0, 0, 0)

def hwalk(i):
  """A trot: the diagonal legs swing together; the lower leg folds while the leg is lifted."""
  hrest(); p = 2 * math.pi * i / 8; s, c = math.sin(p), math.cos(p); A, K = 22, 38
  for leg, sign in (('front.R', 1), ('rear.L', 1), ('front.L', -1), ('rear.R', -1)):
    hrot(leg + '.upper', -A * s * sign); up = max(0, c * sign)
    hrot(leg + '.lower', (K if leg.startswith('rear') else -K) * up ** 1.2)
  hrot('neck', 4 * c); hrot('tail', 10 * s, Z)
  if hb and 'body' in hb: hb['body'].location = horse.data.bones['body'].matrix_local.to_3x3().inverted() @ Vector((0, 0, .03 * abs(c)))

def walk(i):
  rest()
  if kind == 'cavalry':
    hwalk(i); s = math.sin(2 * math.pi * i / 8); rot('upper_arm.R', 6 * s); rot('upper_arm.L', -6 * s); rot('spine', 2 * s, Z); return
  p = 2 * math.pi * i / 8; s, c = math.sin(p), math.cos(p); A, K, B = 26, 42, 20
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
CROSS = [(-35, -20, 0), (-70, -45, 4), (-72, -45, 4), (-80, -45, 0), (-30, -35, 22), (-25, -40, 26)]  # raise, aim, aim, kick, lower and span
HALBERD = [(-15, -10, -20), (-45, -40, -35), (-40, -55, 10), (-35, -55, 60), (-30, -50, 85), (-20, -30, 40)]  # upper, fore, staff tilt forward: wind back, the head comes down in front
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
  elif kind == 'crossbow':
    up, fore, lean = CROSS[i]
    for side in 'RL': rot(f'upper_arm.{side}', up); rot(f'forearm.{side}', fore); rot(f'hand.{side}', -(up + fore) - (TILT * min(1, -up / 60) if 1 <= i <= 3 else 0))
    rot('spine', lean); rot('head', -lean * .6 + (6 if 1 <= i <= 3 else 0)); rot('spine', -6, Z)
  elif kind == 'halberd':
    up, fore, tilt = HALBERD[i]; rot('upper_arm.R', up); rot('forearm.R', fore); rot('hand.R', tilt - up - fore)
    rot('upper_arm.L', up - 10); rot('forearm.L', fore - 20); rot('spine', [0, -4, 6, 12, 8, 2][i])
    if i >= 2: rot('thigh.L', -14); rot('shin.L', 9); rot('thigh.R', 10); lift(-.025)
  elif kind == 'cavalry':
    hrest(); up, fore, lean = SWORD[i]; rot('upper_arm.R', up); rot('forearm.R', fore); rot('spine', lean); rot('spine', -10 + 4 * i, Z)
    hrot('neck', [0, 4, 8, 6, 3, 0][i]); hrot('front.R.upper', [0, -6, -10, -6, -3, 0][i])
  else:
    lu, lh, ru, rf = BOW[i]; rot('upper_arm.L', lu); rot('hand.L', lh); rot('upper_arm.R', ru); rot('forearm.R', rf)
    rot('spine', -14, Z); rot('head', 10, Z)

def die(i):
  """Knees give, then he falls on his back (the body turns about the feet and lies on the ground)."""
  rest(); tilt = [0, 32, 66, 88][i]; buckle = [1, .7, .25, 0][i]
  rot('thigh.R', -22 * buckle); rot('thigh.L', -28 * buckle); rot('shin.R', 40 * buckle); rot('shin.L', 48 * buckle); lift(-.08 * buckle)
  rot('spine', 12 * buckle - 6 * (1 - buckle)); rot('head', -10 * (1 - buckle))
  rot('upper_arm.R', 30 * (i / 3), Y); rot('upper_arm.L', -30 * (i / 3), Y); rot('upper_arm.R', -20 * buckle); rot('upper_arm.L', -20 * buckle)
  if horse:
    hrest(); fold = 1 - buckle; rider_tilt = tilt
    for leg in ('front.R', 'front.L', 'rear.R', 'rear.L'): hrot(leg + '.upper', (-30 if leg.startswith('front') else 30) * fold); hrot(leg + '.lower', (40 if leg.startswith('front') else -40) * fold)
    hrot('neck', -20 * fold); turn.rotation_euler.y = math.radians(tilt * .9); turn.location.z = -.25 * fold
  else:
    arm.rotation_euler.x = math.radians(-tilt); arm.location.z = .14 * math.sin(math.radians(tilt))

def fidget(i):
  """Owner 17 Nov 2026: standing soldiers are not frozen – small stand-still moves the game picks at random."""
  rest(); hrest(); weapon = 'L' if kind == 'bow' else 'R'
  if horse:
    if i == 1: hrot('neck', -18); hrot('head', -10)  # the horse lowers its head
    elif i == 2: rot('head', 32, Z); rot('spine', 6, Z); hrot('tail', 18, Z)
    elif i == 3: rot('head', -32, Z); rot('spine', -6, Z); hrot('tail', -18, Z)
    elif i == 4: hrot('front.L.upper', -14); hrot('front.L.lower', -30)  # paws the ground
    elif i == 5: hrot('neck', 10); hrot('head', 8); rot('spine', -4)
    return
  if i == 1: rot('thigh.L', -7); rot('shin.L', 12); rot('foot.L', -4); rot('spine', 2); rot('spine', 4, Y); lift(-.012)  # weight on one leg
  elif i == 2: rot('head', 32, Z); rot('spine', 6, Z)  # looks to one side
  elif i == 3: rot('head', -32, Z); rot('spine', -6, Z)  # and to the other
  elif i == 4: rot(f'upper_arm.{weapon}', -14); rot(f'forearm.{weapon}', -26)  # shifts the weapon in the hand
  elif i == 5: rot('spine', -4); rot('head', -9); rot('upper_arm.R', -4, Y); rot('upper_arm.L', 4, Y)  # straightens his back

frames = [('idle', 0, rest)] + [('walk', i, walk) for i in range(8)] + [('attack', i, attack) for i in range(6)] + [('die', i, die) for i in range(4)] + [('idle', i, fidget) for i in range(1, 6)]
os.makedirs(out, exist_ok=True)
for k in range(8):
  if only is not None and k != only: continue
  for col, (name, i, fn) in enumerate(frames):
    if col < first or col > last: continue
    arm.rotation_euler = (0, 0, 0) if horse else (0, 0, math.radians(45 + 45 * k)); arm.location = (0, 0, 0)
    turn.rotation_euler = (0, 0, math.radians(45 + 45 * k)); turn.location = (0, 0, 0); hrest()
    fn(i)
    bpy.context.view_layer.update()
    sc.render.filepath = os.path.join(out, f'{k}-{col:02d}.png')
    bpy.ops.render.render(write_still=True)
json.dump({'frameWidth': FW, 'frameHeight': FH, 'anchor': ANCHOR, 'supersample': SS, 'columns': [f'{n}-{i}' for n, i, _ in frames]}, open(os.path.join(out, 'layout.json'), 'w'))
