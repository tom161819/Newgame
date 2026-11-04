// Time of day and light sources, independent of any renderer. The same numbers
// drive the studio's canvas compositor and the Phaser light map in the demo.
import { TILE_WIDTH } from './projection.js';

export const TIMES = Object.freeze(['day', 'dusk', 'night']);

export function hexToRgb(hex) {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return { r: value >> 16 & 255, g: value >> 8 & 255, b: value & 255 };
}
export function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map(n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')).join('')}`;
}

export function timePreset(style, time) {
  const preset = style.timeOfDay[time];
  if (!preset) throw new RangeError(`Unknown time of day: ${time}`);
  return { ...preset, ambientRgb: hexToRgb(preset.ambient) };
}

// Smooth, deterministic flicker in [1 - amplitude, 1 + amplitude].
export function flicker(seconds, { amplitude, speed }, seed = 0) {
  const t = seconds * speed + seed * 12.9898;
  const wave = Math.sin(t) * 0.5 + Math.sin(t * 2.31 + 1.7) * 0.3 + Math.sin(t * 5.17 + 0.4) * 0.2;
  return 1 + amplitude * wave;
}

// Light emitter in sprite pixel space, ready for any renderer.
export function resolveLight(style, light, { x, y }, scale = 1) {
  const source = style.lightSources[light.type];
  if (!source) throw new RangeError(`Unknown light type: ${light.type}`);
  return {
    type: light.type, x, y,
    color: source.color,
    radius: source.radiusTiles * TILE_WIDTH / 2 * scale,
    intensity: source.intensity,
    flicker: source.flicker,
    flameSize: source.flameSize,
  };
}

// Light contribution at a time of day: daylight washes torches out.
export function lightStrength(light, preset, seconds, seed = 0, animate = true) {
  return light.intensity * preset.lightScale * (animate ? flicker(seconds, light.flicker, seed) : 1);
}
