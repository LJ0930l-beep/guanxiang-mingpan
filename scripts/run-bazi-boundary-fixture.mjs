import { resolveSolarTermBoundary } from '@/domains/bazi/solar-terms';

const values = [
  '2024-02-04T16:26:07',
  '2024-02-04T16:27:07',
  '2024-02-04T16:28:07',
];

console.log(JSON.stringify(values.map((value) => resolveSolarTermBoundary(value))));

