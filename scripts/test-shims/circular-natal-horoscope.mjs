import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const natal = require('circular-natal-horoscope-js/dist/index.js');

export const Horoscope = natal.Horoscope;
export const Origin = natal.Origin;
