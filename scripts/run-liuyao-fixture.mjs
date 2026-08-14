import { calculateLiuyaoView } from '../src/services/chart-engine.ts';

const result = await calculateLiuyaoView(
  '这个版本能否顺利完成并上线？',
  '官鬼',
  {
    generatedAt: '2026-01-01T00:00:00.000Z',
    seed: 'fixture-liuyao-seed-v1',
    date: '2026-01-01T12:00:00.000Z',
  },
);

process.stdout.write(`${JSON.stringify(result)}\n`);
