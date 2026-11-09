// Konteks gambar (live binding) + gambar atlas
export let ctx = null;
export function setCtx(c) { ctx = c; }
export const IMG = typeof Image !== 'undefined' ? new Image() : null;
export const ICON = {};
