const module = await import('../../node_modules/iztro/dist/iztro.min.js');
const iztro = module.default ?? module['module.exports'] ?? module;

export const astro = iztro.astro;
export const data = iztro.data;
export const star = iztro.star;
export const util = iztro.util;
