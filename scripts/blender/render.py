"""Blender renderer for Asset Studio models (#149 Blender pilot).

Takes the JSON written by scripts/blender-model.mjs (the generator's primitives, style colours, sun and
projection) and renders it with Cycles in the game projection, then writes sprites at 1x and 2x that line up
with the Studio's own renders (same anchor convention, same footprint framing).

Run with any Python that has the `bpy` module (pip install bpy; Blender 5.2 LTS here):
    python scripts/blender/render.py <model.json> <out-prefix> [--samples 96]
Writes <out-prefix>.png (1x), <out-prefix>.x2.png (2x) and <out-prefix>.render.json.

What Blender adds over the Three.js renderer: every box becomes a bevelled stone with jittered corners, rocks
and leaves get more faces, materials get procedural noise, per-stone colour variation and bump, and Cycles
gives soft sky light, ambient occlusion in the joints and a soft ground shadow.
"""
import hashlib
import json
import math
import random
import sys
import time

import bpy  # first: addon_utils and bmesh come with it
import addon_utils
import bmesh
import numpy as np
from mathutils import Matrix, Vector
from mathutils import noise as mnoise
from PIL import Image

SS = 4  # render at 4x, downsample to 2x and 1x in premultiplied alpha
PAD = 6  # px at 1x around the frame


def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_linear(h):
    h = h.lstrip('#')
    return tuple(srgb_to_linear(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4)) + (1.0,)


def tb(v):
    """Studio/Three model space (x, y up, z) -> Blender (x, -z, y up). A proper rotation, so normals survive."""
    return Vector((v[0], -v[2], v[1]))


def three_rotation(rotation=0.0, tilt=None):
    """Three.js Euler order XYZ with rotation.y = rotation, rotation.x/z = tilt: matrix Rx @ Ry @ Rz."""
    tx, tz = tilt or (0.0, 0.0)
    return Matrix.Rotation(tx, 3, 'X') @ Matrix.Rotation(rotation, 3, 'Y') @ Matrix.Rotation(tz, 3, 'Z')


def project(p, ppu, elevation):
    """Studio projectPoint: screen offset in px (y down) of a model-space point."""
    x, y, z = p
    return ((x - z) / math.sqrt(2) * ppu, ((x + z) / math.sqrt(2) * math.sin(elevation) - y * math.cos(elevation)) * ppu)


# ---------------------------------------------------------------- materials

def make_material(mid, spec, kind):
    mat = bpy.data.materials.new(mid)
    mat.use_nodes = True
    nt = mat.node_tree
    nodes, links = nt.nodes, nt.links
    bsdf = nodes['Principled BSDF']
    base = hex_linear(spec['hex'])
    variation = float(spec.get('variation', 0.1))
    info = nodes.new('ShaderNodeObjectInfo')
    coords = nodes.new('ShaderNodeTexCoord')
    noise = nodes.new('ShaderNodeTexNoise')
    noise.noise_dimensions = '4D'
    noise.inputs['Scale'].default_value = 9.0 if kind != 'leaf' else 14.0
    noise.inputs['Detail'].default_value = 6.0
    noise.inputs['Roughness'].default_value = 0.6
    links.new(coords.outputs['Object'], noise.inputs['Vector'])
    seed = nodes.new('ShaderNodeMath'); seed.operation = 'MULTIPLY'; seed.inputs[1].default_value = 37.0
    links.new(info.outputs['Random'], seed.inputs[0]); links.new(seed.outputs[0], noise.inputs['W'])
    # Colour: the palette colour, darker/lighter by the noise and by a per-object random shift.
    ramp = nodes.new('ShaderNodeValToRGB')
    dark = tuple(c * (1 - variation * 1.6) for c in base[:3]) + (1.0,)
    light = tuple(min(1.0, c * (1 + variation * 1.3)) for c in base[:3]) + (1.0,)
    ramp.color_ramp.elements[0].position, ramp.color_ramp.elements[0].color = 0.3, dark
    ramp.color_ramp.elements[1].position, ramp.color_ramp.elements[1].color = 0.72, light
    links.new(noise.outputs['Fac'], ramp.inputs['Fac'])
    shift = nodes.new('ShaderNodeHueSaturation')
    links.new(ramp.outputs['Color'], shift.inputs['Color'])
    spread = nodes.new('ShaderNodeMapRange')
    spread.inputs['To Min'].default_value = 1 - (0.22 if kind == 'stone' else 0.12)
    spread.inputs['To Max'].default_value = 1 + (0.14 if kind == 'stone' else 0.1)
    links.new(info.outputs['Random'], spread.inputs['Value'])
    links.new(spread.outputs['Result'], shift.inputs['Value'])
    links.new(shift.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = 0.92 if kind != 'leaf' else 0.7
    if kind in ('stone', 'leaf', 'soil'):
        bump = nodes.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value = 0.35 if kind == 'stone' else 0.25
        bump.inputs['Distance'].default_value = 0.02
        links.new(noise.outputs['Fac'], bump.inputs['Height'])
        links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    # Coursed textures of the style guide (bricks, shingles, planks) as procedural brick patterns on the part's UVs,
    # which are laid out in world units (see uv_world), so courses have the same size on every part.
    pattern = spec.get('texture')
    if pattern in ('bricks', 'shingles', 'planks') and kind != 'dark':
        uv = nodes.new('ShaderNodeUVMap')
        brick = nodes.new('ShaderNodeTexBrick')
        brick.offset, brick.squash = (0.5, 1.0)
        size = {'bricks': (0.3, 0.15, 0.012), 'shingles': (0.22, 0.12, 0.01), 'planks': (1.6, 0.17, 0.008)}[pattern]
        brick.inputs['Scale'].default_value = 1.0
        brick.inputs['Brick Width'].default_value = size[0]
        brick.inputs['Row Height'].default_value = size[1]
        brick.inputs['Mortar Size'].default_value = size[2]
        brick.inputs['Mortar Smooth'].default_value = 0.3
        brick.inputs['Bias'].default_value = 0.0
        brick.inputs['Color1'].default_value = tuple(c * (1 - variation) for c in base[:3]) + (1.0,)
        brick.inputs['Color2'].default_value = tuple(min(1.0, c * (1 + variation * 0.6)) for c in base[:3]) + (1.0,)
        brick.inputs['Mortar'].default_value = tuple(c * 0.55 for c in base[:3]) + (1.0,)
        links.new(uv.outputs['UV'], brick.inputs['Vector'])
        # Keep the noise grain on top of the pattern.
        grain = nodes.new('ShaderNodeMix'); grain.data_type = 'RGBA'; grain.blend_type = 'OVERLAY'
        grain.inputs['Factor'].default_value = 0.35
        links.new(brick.outputs['Color'], grain.inputs['A']); links.new(shift.outputs['Color'], grain.inputs['B'])
        for link in list(bsdf.inputs['Base Color'].links): links.remove(link)
        lift = nodes.new('ShaderNodeBrightContrast'); lift.inputs['Bright'].default_value = 0.0
        links.new(grain.outputs['Result'], lift.inputs['Color'])
        links.new(lift.outputs['Color'], bsdf.inputs['Base Color'])
        bump = nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.4; bump.inputs['Distance'].default_value = 0.01
        links.new(brick.outputs['Fac'], bump.inputs['Height']); links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    if kind == 'dark':
        bsdf.inputs['Base Color'].default_value = base
        for link in list(bsdf.inputs['Base Color'].links): links.remove(link)
    return mat


def material_kind(mid):
    if mid.startswith(('fieldstone', 'stone', 'rock')):
        return 'stone'
    if mid.startswith(('foliage', 'moss', 'pine')):
        return 'leaf'
    if mid in ('soil',):
        return 'soil'
    if mid in ('opening', 'rubble_fill', 'soot'):
        return 'dark'
    return 'plain'


# ---------------------------------------------------------------- geometry

def uv_world(bm, prism_faces=False):
    """UVs in world units (local Three space): walls get (horizontal, height), tops (x, z). Sloped prism faces use
    (along the ridge, up the slope) so roof courses run parallel to the ridge."""
    layer = bm.loops.layers.uv.verify()
    for f in bm.faces:
        n = f.normal
        ax = max(range(3), key=lambda i: abs(n[i]))
        for loop in f.loops:
            c = loop.vert.co
            if prism_faces and abs(n[1]) > 0.2 and abs(n[1]) < 0.98:
                loop[layer].uv = (c.z, c.y / max(0.2, abs(n.x) if abs(n.x) > abs(n.z) else 1.0) * 1.3)
            elif ax == 0:
                loop[layer].uv = (c.z, c.y)
            elif ax == 2:
                loop[layer].uv = (c.x, c.y)
            else:
                loop[layer].uv = (c.x, c.z)


def bm_to_object(bm, name, at, rot, mat):
    """Move a bmesh built in Three local space (bottom centre at the origin) to the model position, in Blender axes."""
    for v in bm.verts:
        v.co = tb(Vector(at) + rot @ v.co)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(name, me)
    obj.data.materials.append(mat)
    bpy.context.collection.objects.link(obj)
    return obj


def stone(part, rnd, mat, rough=True):
    """A box. Small stone boxes (ruins) become chipped field stones; big ones stay straight with bevelled edges."""
    w, h, d = part['size']
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * w, v.co.y * h + h / 2, v.co.z * d))
    small_part = w < 0.5 and h < 0.5
    if rough and not small_part:
        # A big block (wall, plinth): keep it straight, only round the edges a little so they catch the light.
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=min(0.02, min(w, h, d) * 0.2), offset_type='OFFSET', segments=1, affect='EDGES', clamp_overlap=True)
        rough = False
    bm.normal_update()
    uv_world(bm)
    if rough:
        # Rounded, chipped field stone: bevelled edges, one subdivision, then a noise displacement along the normals
        # (seeded per stone) and a little corner jitter, so no two stones share a shape.
        small = min(w, h, d)
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=small * rnd.uniform(0.22, 0.36), offset_type='OFFSET', segments=2, profile=0.55, affect='EDGES', clamp_overlap=True)
        bmesh.ops.subdivide_edges(bm, edges=list(bm.edges), cuts=1, use_grid_fill=True)
        bm.normal_update()
        origin = Vector((rnd.uniform(0, 100), rnd.uniform(0, 100), rnd.uniform(0, 100)))
        amp = small * 0.11
        for v in bm.verts:
            chip = mnoise.noise(v.co * (9.0 / max(small, 0.05)) + origin)
            v.co += v.normal * chip * amp + Vector((rnd.uniform(-1, 1), rnd.uniform(-0.7, 0.7), rnd.uniform(-1, 1))) * amp * 0.35
    return bm_to_object(bm, part['material'], part['at'], three_rotation(part.get('rotation', 0.0), part.get('tilt')), mat)


def blob(part, rnd, mat, subdivisions, jitter):
    rx, ry, rz = part['radii']
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdivisions, radius=1.0)
    for v in bm.verts:
        n = v.co.normalized()
        k = 1 + rnd.uniform(-jitter, jitter)
        v.co = Vector((n.x * rx * k, n.y * ry * k + ry, n.z * rz * k))
    return bm_to_object(bm, part['material'], part['at'], three_rotation(part.get('rotation', 0.0), part.get('tilt')), mat)


def cone(part, mat):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=max(3, part.get('segments', 8)), radius1=part['radiusBottom'], radius2=part['radiusTop'], depth=part['height'])
    # create_cone builds along Blender-local Z around the centre; turn it into Three-local Y with the base at 0.
    for v in bm.verts:
        v.co = Vector((v.co.x, v.co.z + part['height'] / 2, -v.co.y))
    return bm_to_object(bm, part['material'], part['at'], three_rotation(0.0, part.get('tilt')), mat)


def prism(part, rnd, mat):
    w, h, d = part['size']
    bm = bmesh.new()
    verts = [bm.verts.new(Vector(p)) for p in [(-w / 2, 0, -d / 2), (w / 2, 0, -d / 2), (0, h, -d / 2), (-w / 2, 0, d / 2), (w / 2, 0, d / 2), (0, h, d / 2)]]
    for f in [(0, 2, 1), (3, 4, 5), (0, 1, 4, 3), (1, 2, 5, 4), (2, 0, 3, 5)]:
        bm.faces.new([verts[i] for i in f])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.normal_update()
    uv_world(bm, prism_faces=True)
    return bm_to_object(bm, part['material'], part['at'], three_rotation(part.get('rotation', 0.0), part.get('tilt')), mat)


# ---------------------------------------------------------------- organic looks (animals)
# Owner, 7 Nov 2026: horses and the bear must look semi-realistic and hand-painted, not low-poly. With `look` set
# (variant.baked.look) the round parts (spheres and cylinders) are built smooth and fused per material: high-res
# spheres and tubes, joined, voxel-remeshed into one surface and relaxed, so muscles flow into each other.
#   sculpt  – smooth fused body, soft fur-grain bump in the material
#   fur     – sculpt + rendered hair strands on the coat
#   painted – sculpt, then a painterly post-process on the 4x render (brush smoothing, edge accents, rim light)
ORGANIC = ('sphere', 'cylinder')


def smooth_sphere(part, mat):
    rx, ry, rz = part['radii']
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=14, radius=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * rx, v.co.z * ry + ry, -v.co.y * rz))
    return bm_to_object(bm, part['material'], part['at'], three_rotation(part.get('rotation', 0.0), part.get('tilt')), mat)


def smooth_tube(part, mat):
    bm = bmesh.new()
    rb, rt, h = part['radiusBottom'], part.get('radiusTop', part['radiusBottom']), part['height']
    bmesh.ops.create_cone(bm, cap_ends=True, segments=18, radius1=max(rb, 1e-4), radius2=max(rt, 1e-4), depth=h)
    for v in bm.verts:
        v.co = Vector((v.co.x, v.co.z + h / 2, -v.co.y))
    return bm_to_object(bm, part['material'], part['at'], three_rotation(0.0, part.get('tilt')), mat)


def fuse(objects, voxel, smooth_repeat):
    """Join objects of one material, voxel-remesh them into one closed surface and relax the seams."""
    if not objects:
        return None
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    if len(objects) > 1:
        bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active
    rem = obj.modifiers.new('remesh', 'REMESH'); rem.mode = 'VOXEL'; rem.voxel_size = voxel; rem.adaptivity = 0.0
    sm = obj.modifiers.new('smooth', 'CORRECTIVE_SMOOTH'); sm.iterations = smooth_repeat; sm.factor = 0.8; sm.use_only_smooth = True
    bpy.ops.object.modifier_apply(modifier='remesh')
    bpy.ops.object.modifier_apply(modifier='smooth')
    lap = obj.modifiers.new('lap', 'LAPLACIANSMOOTH'); lap.iterations = 6; lap.lambda_factor = 0.6
    bpy.ops.object.modifier_apply(modifier='lap')
    bpy.ops.object.shade_smooth()
    return obj


def fur_grain(mat, strength):
    """Fine stretched noise as a bump: the grain of a short coat."""
    nt = mat.node_tree; nodes, links = nt.nodes, nt.links
    bsdf = nodes['Principled BSDF']
    coords = nodes.new('ShaderNodeTexCoord')
    mapping = nodes.new('ShaderNodeMapping'); mapping.inputs['Scale'].default_value = (90.0, 90.0, 320.0)
    links.new(coords.outputs['Object'], mapping.inputs['Vector'])
    noise = nodes.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value = 1.0; noise.inputs['Detail'].default_value = 8.0
    links.new(mapping.outputs['Vector'], noise.inputs['Vector'])
    bump = nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = strength; bump.inputs['Distance'].default_value = 0.004
    links.new(noise.outputs['Fac'], bump.inputs['Height'])
    links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    bsdf.inputs['Roughness'].default_value = 0.78
    if 'Sheen Weight' in bsdf.inputs:
        bsdf.inputs['Sheen Weight'].default_value = 0.35


def add_fur(obj, length, count):
    ps = obj.modifiers.new('fur', 'PARTICLE_SYSTEM').particle_system.settings
    ps.type = 'HAIR'; ps.count = count; ps.hair_length = length; ps.use_advanced_hair = True
    ps.child_type = 'INTERPOLATED'; ps.rendered_child_count = 3; ps.child_length = 0.9
    ps.root_radius = 0.0016; ps.tip_radius = 0.0002; ps.use_hair_bspline = True
    ps.normal_factor = 1.0; ps.tangent_factor = 0.0
    ps.object_align_factor = (0.0, 0.0, -length * 0.8)  # hair lies down a little (the factor is in scene units)
    ps.roughness_1 = 0.004; ps.roughness_endpoint = 0.002
    ps.material = 1


def build_skin(model, mats, sk=None):
    """One smooth body from the animal's skeleton (joints with radii): Skin modifier + subdivision, then lower legs in
    the sock material (dark points, hooves' stockings)."""
    sk = sk or model['skeleton']
    mesh = bpy.data.meshes.new('body')
    mesh.from_pydata([tb(v[:3]) for v in sk['verts']], [tuple(e) for e in sk['edges']], [])
    obj = bpy.data.objects.new('body', mesh); bpy.context.scene.collection.objects.link(obj)
    skin = obj.modifiers.new('skin', 'SKIN'); skin.use_smooth_shade = True; skin.branch_smoothing = 0.6
    for i, v in enumerate(sk['verts']):
        obj.data.skin_vertices[0].data[i].radius = (v[3], v[3])
    obj.data.skin_vertices[0].data[0].use_root = True
    sub = obj.modifiers.new('sub', 'SUBSURF'); sub.levels = 3; sub.render_levels = 3
    bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True); bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier='skin'); bpy.ops.object.modifier_apply(modifier='sub')
    lap = obj.modifiers.new('lap', 'CORRECTIVE_SMOOTH'); lap.iterations = 4; lap.factor = 0.5
    bpy.ops.object.modifier_apply(modifier='lap')
    bpy.ops.object.shade_smooth()
    obj.data.materials.append(mats[sk['material']]); obj.data.materials.append(mats[sk['sock']])
    limit = sk.get('sockFrom', 0.0)
    for poly in obj.data.polygons:
        if sk['sock'] != sk['material'] and poly.center.z < limit:
            poly.material_index = 1
    patches = sk.get('patches') or []
    slots = {}
    for p in patches:
        if p[4] not in slots:
            obj.data.materials.append(mats[p[4]]); slots[p[4]] = len(obj.data.materials) - 1
    if patches:
        centres = [(tb(p[:3]), p[3], slots[p[4]]) for p in patches]
        for poly in obj.data.polygons:
            if poly.center.z < limit:
                continue
            for c, r, idx in centres:
                if (poly.center - c).length < r * (1 + 0.25 * mnoise.noise(poly.center * 40)):
                    poly.material_index = idx
                    break
    return obj


def build_organic(model, rnd, mats, look):
    groups, rest = {}, []
    for extra in model.get('skeletons') or []:  # horses in vehicles
        build_skin(model, mats, extra)
        fur_grain(mats[extra['material']], 0.12)
    if model.get('skeletons'):
        model = {**model, 'primitives': [p for p in model['primitives'] if not p.get('skin')]}
    if model.get('skeleton'):
        body = build_skin(model, mats)
        fur_grain(mats[model['skeleton']['material']], 0.12 if look != 'fur' else 0.05)
        if look == 'fur':
            add_fur(body, length=0.012 * max(0.4, model['height']), count=5000)
        model = {**model, 'primitives': [p for p in model['primitives'] if not p.get('skin')]}
    for part in model['primitives']:
        if part['shape'] in ORGANIC and material_kind(part['material']) != 'stone':
            mat = mats[part['material']]
            obj = smooth_sphere(part, mat) if part['shape'] == 'sphere' else smooth_tube(part, mat)
            groups.setdefault(part['material'], []).append(obj)
        else:
            rest.append(part)
    scale = max(0.4, model['height'])
    for mid, objs in groups.items():
        obj = fuse(objs, voxel=0.0045 * scale, smooth_repeat=8)
        if obj is None:
            continue
        coat = len(objs) > 4 and material_kind(mid) == 'plain' and not model.get('skeleton')
        if coat:
            fur_grain(mats[mid], 0.12 if look != 'fur' else 0.05)
        if look == 'fur' and coat:
            add_fur(obj, length=0.016 * scale, count=int(2500 * len(objs) ** 0.5))
    return rest


def build(model, rnd):
    mats = {mid: make_material(mid, spec, material_kind(mid)) for mid, spec in model['materials'].items()}
    if model.get('look'):
        rest = build_organic(model, rnd, mats, model['look'])
        model = {**model, 'primitives': rest}
    for part in model['primitives']:
        mat, kind, shape = mats[part['material']], material_kind(part['material']), part['shape']
        if shape == 'box':
            stone(part, rnd, mat, rough=kind == 'stone')
        elif shape == 'sphere':
            leafy = kind == 'leaf'
            blob(part, rnd, mat, 2 if leafy else 1, 0.22 if leafy else 0.16)
        elif shape == 'cylinder':
            cone(part, mat)
        elif shape == 'prism':
            prism(part, rnd, mat)


# ---------------------------------------------------------------- scene

def setup_scene(model, samples):
    addon_utils.enable('cycles', default_set=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = samples
    scene.cycles.seed = 0
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 4
    scene.render.film_transparent = True
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    light = model['light']
    # Sun: the style guide's direction points from the scene to the sun (Three.js convention).
    sun_dir = tb(light['sun']['direction']).normalized()
    sun = bpy.data.lights.new('sun', 'SUN')
    sun.energy = light['sun']['intensity']
    sun.color = hex_linear(light['sun']['color'])[:3]
    sun.angle = math.radians(2.0)
    sun_obj = bpy.data.objects.new('sun', sun)
    sun_obj.rotation_euler = sun_dir.to_track_quat('Z', 'Y').to_euler()
    scene.collection.objects.link(sun_obj)
    # Sky: the hemisphere light as a world gradient (Three's hemisphere irradiance / pi = radiance).
    world = bpy.data.worlds.new('sky')
    scene.world = world
    world.use_nodes = True
    nodes, links = world.node_tree.nodes, world.node_tree.links
    bg = nodes['Background']
    coords = nodes.new('ShaderNodeTexCoord')
    sep = nodes.new('ShaderNodeSeparateXYZ')
    links.new(coords.outputs['Generated'], sep.inputs['Vector'])
    rng = nodes.new('ShaderNodeMapRange')
    rng.inputs['From Min'].default_value, rng.inputs['From Max'].default_value = -1.0, 1.0
    links.new(sep.outputs['Z'], rng.inputs['Value'])
    mix = nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'
    mix.inputs['A'].default_value = hex_linear(light['hemisphere']['ground'])
    mix.inputs['B'].default_value = hex_linear(light['hemisphere']['sky'])
    links.new(rng.outputs['Result'], mix.inputs['Factor'])
    links.new(mix.outputs['Result'], bg.inputs['Color'])
    # 0.8: Cycles also bounces light off the ground and between stones, which the Studio's Three.js light does not.
    bg.inputs['Strength'].default_value = light['hemisphere']['intensity'] / math.pi * 0.8
    return scene


def ground(model):
    bpy.ops.mesh.primitive_plane_add(size=40)
    plane = bpy.context.active_object
    plane.name = 'ground'
    plane.is_shadow_catcher = True
    return plane


def camera(scene, model):
    proj = model['projection']
    ppu, elev = proj['pixelsPerUnit'] * SS, proj['elevation']
    # Frame like the Studio: model, footprint and the longest shadow, symmetric around the origin so the
    # origin lands on a pixel corner that stays on a pixel corner after downsampling.
    pts = []
    for part in model['primitives']:
        x, y, z = part['at']
        r = 0.6
        pts += [(x - r, 0, z - r), (x + r, 0, z + r), (x - r, model['height'] + 0.2, z - r), (x + r, model['height'] + 0.2, z + r)]
    fw, fh = model['footprint']['width'] / 2, model['footprint']['height'] / 2
    d = Vector(model['light']['sun']['direction']).normalized()
    reach = model['height'] / max(0.2, d.y)
    pts += [(sx * fw, 0, sz * fh) for sx in (-1, 1) for sz in (-1, 1)]
    pts += [(sx * fw - d.x * reach, 0, sz * fh - d.z * reach) for sx in (-1, 1) for sz in (-1, 1)]
    xs, ys = zip(*[project(p, ppu, elev) for p in pts])
    half_w = max(abs(min(xs)), abs(max(xs))) + PAD * SS
    half_h = max(abs(min(ys)), abs(max(ys))) + PAD * SS
    half_w, half_h = SS * math.ceil(half_w / SS), SS * math.ceil(half_h / SS)
    width, height = int(2 * half_w), int(2 * half_h)
    scene.render.resolution_x, scene.render.resolution_y = width, height
    scene.render.resolution_percentage = 100
    cam_data = bpy.data.cameras.new('camera')
    cam_data.type = 'ORTHO'
    cam_data.sensor_fit = 'HORIZONTAL'
    cam_data.ortho_scale = width / ppu
    cam_data.clip_start, cam_data.clip_end = 0.1, 200
    cam = bpy.data.objects.new('camera', cam_data)
    direction = tb(proj['cameraDirection']).normalized()
    cam.location = direction * 60
    cam.rotation_euler = (-direction).to_track_quat('-Z', 'Y').to_euler()
    scene.collection.objects.link(cam)
    scene.camera = cam
    return width, height, ppu, elev


def render_to(scene, path):
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    return np.asarray(Image.open(path).convert('RGBA'), dtype=np.float64) / 255.0


# ---------------------------------------------------------------- post

def painterly(img):
    """Hand-painted finish on the 4x render: smear colour into brush-sized patches (Kuwahara-like mode filter),
    deepen the edges, add a warm rim on the sun side and a slightly lifted saturation. Alpha is kept."""
    from PIL import ImageFilter, ImageEnhance
    rgba = (np.clip(img, 0, 1) * 255).astype(np.uint8)
    pil = Image.fromarray(rgba, 'RGBA'); rgb = pil.convert('RGB')
    painted = rgb.filter(ImageFilter.ModeFilter(11)).filter(ImageFilter.SMOOTH_MORE)
    painted = Image.blend(painted, rgb, 0.2)
    painted = ImageEnhance.Color(painted).enhance(1.22)
    painted = ImageEnhance.Contrast(painted).enhance(1.12)
    # Brush texture: directional strokes as a light overlay.
    rs = np.random.default_rng(7); strokes = rs.random((painted.height, painted.width)).astype(np.float32)
    from scipy.ndimage import uniform_filter1d
    strokes = uniform_filter1d(uniform_filter1d(strokes, 9, axis=1), 3, axis=0)
    tex = Image.fromarray(np.uint8(np.clip((strokes - 0.5) * 6 + 0.5, 0, 1) * 255))
    arr0 = np.asarray(painted).astype(np.float32) / 255
    painted = Image.fromarray(np.uint8(np.clip(arr0 * (0.92 + 0.16 * (np.asarray(tex)[..., None] / 255)), 0, 1) * 255))
    arr = np.asarray(painted).astype(np.float32) / 255
    a = img[..., 3]
    # Edge accent: darker where the alpha falls off (an inked outline at sprite scale).
    from scipy.ndimage import uniform_filter
    edge = np.clip(a - uniform_filter(a, 9), 0, 1)
    arr *= (1 - np.clip(edge * 2.2, 0, 0.45))[..., None]
    # Rim light on the upper-left (towards the sun): lighten where alpha drops to the upper left.
    shifted = np.roll(np.roll(a, 6, axis=0), 6, axis=1)
    rim = np.clip(a - shifted, 0, 1)[..., None]
    arr = arr + rim * 0.18 * np.array([1.0, 0.92, 0.75])
    out = np.concatenate([np.clip(arr, 0, 1), img[..., 3:4]], axis=-1)
    return out


def premultiply(img):
    out = img.copy()
    out[..., :3] *= out[..., 3:4]
    return out


def downsample(img, factor):
    h, w = img.shape[0] // factor, img.shape[1] // factor
    return img[:h * factor, :w * factor].reshape(h, factor, w, factor, 4).mean(axis=(1, 3))


def crop_and_save(pre, origin, corners, path):
    """pre: premultiplied RGBA, origin: (x, y) px of the model origin. Crops like the Studio's alphaBounds."""
    alpha = pre[..., 3]
    ys, xs = np.nonzero(alpha > 6 / 255)
    min_x, min_y = int(xs.min()), int(ys.min())
    max_x, max_y = int(xs.max()), int(ys.max())
    for cx, cy in corners:
        min_x, min_y = min(min_x, math.floor(cx)), min(min_y, math.floor(cy))
        max_x, max_y = max(max_x, math.ceil(cx)), max(max_y, math.ceil(cy))
    x0, y0 = max(0, min_x - 1), max(0, min_y - 1)
    x1, y1 = min(pre.shape[1], max_x + 2), min(pre.shape[0], max_y + 2)
    part = pre[y0:y1, x0:x1].copy()
    a = part[..., 3:4]
    rgb = np.where(a > 0, part[..., :3] / np.maximum(a, 1e-6), 0)
    out = np.concatenate([rgb, a], axis=-1)
    Image.fromarray(np.clip(np.round(out * 255), 0, 255).astype(np.uint8), 'RGBA').save(path, optimize=True)
    return {'width': x1 - x0, 'height': y1 - y0, 'anchor': {'x': int(round(origin[0] - x0)), 'y': int(round(origin[1] - y0))}}


def main():
    args = sys.argv[1:]
    if '--' in args:
        args = args[args.index('--') + 1:]
    if len(args) < 2:
        print(__doc__)
        sys.exit(2)
    model_path, prefix = args[0], args[1]
    samples = int(args[args.index('--samples') + 1]) if '--samples' in args else 96
    model = json.load(open(model_path))
    started = time.time()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = setup_scene(model, samples)
    seed = int(hashlib.sha256(f"{model['assetId']}/{model['variantId']}".encode()).hexdigest()[:8], 16)
    build(model, random.Random(seed))
    width, height, ppu, elev = camera(scene, model)
    plane = ground(model)
    with_shadow = render_to(scene, f'{prefix}.pass-shadow.png')
    plane.hide_render = True
    objects = render_to(scene, f'{prefix}.pass-objects.png')
    # Shadow-only alpha (ground pixels the objects do not cover), scaled so a full sun shadow is the style's opacity.
    shadow_alpha = np.clip(with_shadow[..., 3] - objects[..., 3], 0, 1)
    full = np.percentile(shadow_alpha[shadow_alpha > 0.05], 95) if np.any(shadow_alpha > 0.05) else 1.0
    shadow_alpha = np.clip(shadow_alpha / max(full, 1e-3), 0, 1) * model['light']['shadow']['opacity']
    if model.get('look') == 'painted':
        objects = painterly(objects)
    obj = premultiply(objects)
    pre = obj + np.stack([np.zeros_like(shadow_alpha)] * 3 + [shadow_alpha], axis=-1) * (1 - obj[..., 3:4])
    fw, fh = model['footprint']['width'] / 2, model['footprint']['height'] / 2
    result = {'engine': 'CYCLES', 'blender': bpy.app.version_string, 'samples': samples, 'supersampling': SS, 'scales': {}}
    for scale in (1, 2):
        factor = SS // scale
        img = downsample(pre, factor)
        origin = (width / 2 / factor, height / 2 / factor)
        corners = [(origin[0] + px / factor, origin[1] + py / factor) for px, py in (project((sx * fw, 0, sz * fh), ppu, elev) for sx in (-1, 1) for sz in (-1, 1))]
        path = f'{prefix}.png' if scale == 1 else f'{prefix}.x2.png'
        result['scales'][str(scale)] = {'file': path.split('/')[-1], **crop_and_save(img, origin, corners, path)}
    result['seconds'] = round(time.time() - started, 1)
    result['modelHeight'] = model['height']
    json.dump(result, open(f'{prefix}.render.json', 'w'), indent=2)
    print(json.dumps(result))


main()
