// Renders a generator model to a 2D isometric sprite with Three.js.
// The orthographic camera reproduces the game's projection exactly (see
// lib/projection.js), so the sprite needs no manual alignment: the anchor is the
// footprint centre on the ground and maps to the tile-grid point in the game.
import * as THREE from 'three';
import { cameraDirection, projectBox, projectPoint, PIXELS_PER_UNIT } from '../lib/projection.js';
import { modelBounds } from '../lib/specs.js';
import { resolveLight } from '../lib/lighting.js';
import { TEXTURES } from './textures.js';

const PAD = 3;
let renderer = null;
const materialCache = new Map();

function getRenderer() {
  if (renderer) return renderer;
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
}

export function rendererAvailable() {
  try { getRenderer(); return true; } catch { return false; }
}

function material(style, id) {
  const key = `${style.id}@${style.version}:${id}`;
  if (materialCache.has(key)) return materialCache.get(key);
  const spec = style.materials[id];
  if (!spec) throw new RangeError(`Material "${id}" is not in the style guide.`);
  const color = new THREE.Color(style.palette[spec.color] ?? spec.color);
  let map = null;
  if (spec.texture && spec.texture !== 'none') {
    map = new THREE.CanvasTexture(TEXTURES[spec.texture]([...id].reduce((n, c) => n * 31 + c.charCodeAt(0), 7), spec.variation));
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
  }
  const value = { material: new THREE.MeshLambertMaterial({ color, map, flatShading: true }), repeat: spec.repeat || 1 };
  materialCache.set(key, value);
  return value;
}

// Scale UVs so one texture tile covers `repeat` world units on every face.
function scaleBoxUVs(geometry, [w, h, d], repeat) {
  const uv = geometry.attributes.uv, faces = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let face = 0; face < 6; face++) for (let i = 0; i < 4; i++) {
    const index = face * 4 + i;
    uv.setXY(index, uv.getX(index) * faces[face][0] / repeat, uv.getY(index) * faces[face][1] / repeat);
  }
}
function scaleCylinderUVs(geometry, part, repeat) {
  const uv = geometry.attributes.uv, torso = (part.segments + 1) * 2;
  const around = Math.PI * (part.radiusTop + part.radiusBottom) * (part.segments === 4 ? 2 * Math.SQRT2 / Math.PI : 1);
  const cap = 2 * Math.max(part.radiusTop, part.radiusBottom) / repeat;
  for (let i = 0; i < uv.count; i++) {
    if (i < torso) uv.setXY(i, uv.getX(i) * around / repeat, uv.getY(i) * part.height / repeat);
    else uv.setXY(i, uv.getX(i) * cap, uv.getY(i) * cap);
  }
}

function meshFor(part, style) {
  const { material: mat, repeat } = material(style, part.material);
  let geometry;
  if (part.shape === 'box') {
    geometry = new THREE.BoxGeometry(...part.size);
    scaleBoxUVs(geometry, part.size, repeat);
    geometry.translate(0, part.size[1] / 2, 0);
  } else if (part.shape === 'cylinder') {
    geometry = new THREE.CylinderGeometry(part.radiusTop, part.radiusBottom, part.height, part.segments, 1, false, part.segments === 4 ? Math.PI / 4 : 0);
    scaleCylinderUVs(geometry, part, repeat);
    geometry.translate(0, part.height / 2, 0);
  } else if (part.shape === 'prism') {
    const [w, h, d] = part.size, shape = new THREE.Shape();
    shape.moveTo(-w / 2, 0); shape.lineTo(w / 2, 0); shape.lineTo(0, h); shape.closePath();
    geometry = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
    geometry.translate(0, 0, -d / 2);
    const uv = geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / repeat, uv.getY(i) / repeat);
  } else if (part.shape === 'sphere') {
    const [rx, ry, rz] = part.radii;
    geometry = new THREE.IcosahedronGeometry(1, part.detail ?? 1);
    geometry.scale(rx, ry, rz);
    const uv = geometry.attributes.uv, scale = 2 * Math.max(rx, rz) / repeat;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * scale, uv.getY(i) * scale);
    geometry.translate(0, ry, 0);
  } else throw new RangeError(`Unknown primitive ${part.shape}`);
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.userData.layer = part.layer ?? 'main';
  mesh.position.set(...part.at);
  if (part.rotation) mesh.rotation.y = part.rotation;
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

function sceneFor(model, style) {
  const scene = new THREE.Scene(), group = new THREE.Group();
  for (const part of model.primitives) group.add(meshFor(part, style));
  scene.add(group);
  const { sun, hemisphere, shadow } = style.light;
  scene.add(new THREE.HemisphereLight(hemisphere.sky, hemisphere.ground, hemisphere.intensity));
  const light = new THREE.DirectionalLight(sun.color, sun.intensity);
  const direction = new THREE.Vector3(...sun.direction).normalize();
  light.position.copy(direction.clone().multiplyScalar(20));
  light.castShadow = true;
  light.shadow.mapSize.set(shadow.mapSize, shadow.mapSize);
  Object.assign(light.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 60 });
  light.shadow.bias = -0.0005; light.shadow.normalBias = 0.02;
  scene.add(light, light.target);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.ShadowMaterial({ opacity: shadow.opacity, color: 0x000000 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  scene.add(ground);
  return { scene, group, ground, direction };
}

function dispose({ group, ground }) {
  group.traverse(object => object.geometry?.dispose());
  ground.geometry.dispose(); ground.material.dispose();
}

const depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false });

// Returns { canvas, front, width, height, anchor, platform, lights, scale, footprint, modelHeight }.
// `front` (or null) holds only parts tagged layer: 'front', occluded exactly as in
// the full render and cropped identically, so it overlays the sprite pixel for pixel.
// All pixel values are at the requested scale; scale 1 equals the game's 1× zoom.
export function renderModel(model, { style, footprint, scale = 1 }) {
  const gl = getRenderer(), built = sceneFor(model, style);
  try {
    // Frame the model plus the longest shadow it can cast on the ground.
    const { min, max } = modelBounds(model), d = built.direction;
    const reach = max[1] / Math.max(0.2, d.y);
    // The frame also covers the whole footprint, so its corners (the game's anchor) are inside the sprite.
    const fw = footprint.width / 2, fh = footprint.height / 2;
    const frameMin = [Math.min(min[0], min[0] - d.x * reach, -fw) - 0.2, 0, Math.min(min[2], min[2] - d.z * reach, -fh) - 0.2];
    const frameMax = [Math.max(max[0], max[0] - d.x * reach, fw) + 0.2, max[1] + 0.2, Math.max(max[2], max[2] - d.z * reach, fh) + 0.2];
    const box = projectBox(frameMin, frameMax, scale);
    const left = Math.floor(box.left) - PAD, top = Math.floor(box.top) - PAD;
    const width = Math.ceil(box.right) + PAD - left, height = Math.ceil(box.bottom) + PAD - top;
    const ppu = PIXELS_PER_UNIT * scale;
    const camera = new THREE.OrthographicCamera(left / ppu, (left + width) / ppu, -top / ppu, -(top + height) / ppu, 0.1, 200);
    camera.position.set(...cameraDirection().map(n => n * 60));
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    gl.setSize(width, height, false);
    gl.render(built.scene, camera);

    const full = document.createElement('canvas');
    full.width = width; full.height = height;
    const ctx = full.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(gl.domElement, 0, 0);
    const corners = [[-fw, 0, -fh], [fw, 0, -fh], [fw, 0, fh], [-fw, 0, fh]].map(p => projectPoint(p, scale)).map(p => ({ x: p.x - left, y: p.y - top }));
    const crop = alphaBounds(ctx.getImageData(0, 0, width, height), corners);
    const out = document.createElement('canvas');
    out.width = crop.width; out.height = crop.height;
    out.getContext('2d').drawImage(full, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
    const anchor = { x: -left - crop.x, y: -top - crop.y };
    let front = null;
    if (model.primitives.some(part => part.layer === 'front')) {
      const restore = [];
      built.group.traverse(mesh => { if (mesh.isMesh && mesh.userData.layer !== 'front') { restore.push([mesh, mesh.material]); mesh.material = depthOnly; } });
      built.ground.visible = false;
      gl.render(built.scene, camera);
      for (const [mesh, mat] of restore) mesh.material = mat;
      built.ground.visible = true;
      front = document.createElement('canvas');
      front.width = crop.width; front.height = crop.height;
      front.getContext('2d').drawImage(gl.domElement, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
    }
    const platformPoint = model.platform ? projectPoint(model.platform, scale) : null;
    const platform = platformPoint ? { x: anchor.x + platformPoint.x, y: anchor.y + platformPoint.y } : null;
    const lights = (model.lights ?? []).map(light => {
      const p = projectPoint(light.at, scale);
      return resolveLight(style, light, { x: anchor.x + p.x, y: anchor.y + p.y }, scale);
    });
    return { canvas: out, front, width: out.width, height: out.height, anchor, platform, lights, scale, footprint, modelHeight: model.height };
  } finally { dispose(built); }
}

// Tight box around visible pixels, widened to include the given points (footprint corners).
function alphaBounds(image, include = []) {
  const { data, width, height } = image;
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (const p of include) { minX = Math.min(minX, Math.floor(p.x)); minY = Math.min(minY, Math.floor(p.y)); maxX = Math.max(maxX, Math.ceil(p.x)); maxY = Math.max(maxY, Math.ceil(p.y)); }
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] > 6) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  if (maxX < 0) return { x: 0, y: 0, width: 1, height: 1 };
  const x = Math.max(0, minX - 1), y = Math.max(0, minY - 1);
  return { x, y, width: Math.min(width, maxX + 2) - x, height: Math.min(height, maxY + 2) - y };
}

// Metadata stored next to an exported PNG; everything the game needs to place it.
// `anchor`/`origin` use the studio convention (footprint centre). The game places
// buildings at the footprint's front corner (towerBase), so `base`/`baseOrigin`,
// `platform`, `visualHeight` and `gameLights` are given in that convention too.
export function spriteMetadata({ asset, variant, style, sprite, generator }) {
  const corner = projectPoint([asset.footprint.width / 2, 0, asset.footprint.height / 2], sprite.scale);
  const base = { x: sprite.anchor.x + corner.x, y: sprite.anchor.y + corner.y };
  const round = n => +n.toFixed(2);
  return {
    schema: 1,
    assetId: asset.id,
    variantId: variant.id,
    name: variant.name,
    category: asset.category,
    version: variant.version,
    specHash: variant.hash,
    generator: asset.generator,
    generatorVersion: generator.version,
    styleGuide: `${style.id}@${style.version}`,
    scale: sprite.scale,
    width: sprite.width,
    height: sprite.height,
    anchor: { x: sprite.anchor.x, y: sprite.anchor.y },
    origin: { x: +(sprite.anchor.x / sprite.width).toFixed(5), y: +(sprite.anchor.y / sprite.height).toFixed(5) },
    footprint: asset.footprint,
    base: { x: round(base.x), y: round(base.y) },
    baseOrigin: { x: +(base.x / sprite.width).toFixed(5), y: +(base.y / sprite.height).toFixed(5) },
    visualHeight: round(base.y),
    platform: sprite.platform ? { x: round(sprite.platform.x - base.x), y: round(sprite.platform.y - base.y) } : null,
    frontLayer: !!sprite.front,
    gameLights: sprite.lights.map(l => ({ type: l.type, x: round(l.x - base.x), y: round(l.y - base.y), color: l.color, radius: round(l.radius), intensity: l.intensity, flicker: l.flicker, flameSize: l.flameSize })),
    modelHeight: +sprite.modelHeight.toFixed(3),
    lights: sprite.lights.map(l => ({ type: l.type, x: +l.x.toFixed(2), y: +l.y.toFixed(2), color: l.color, radius: +l.radius.toFixed(2), intensity: l.intensity, flicker: l.flicker, flameSize: l.flameSize })),
  };
}
