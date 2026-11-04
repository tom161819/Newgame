export const MIN_ZOOM=.25;
export const MAX_ZOOM=1.8;
export const DEFAULT_ZOOM=1;
export const ZOOM_RESPONSE_MS=100;
export const clampZoom=value=>Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,value));
