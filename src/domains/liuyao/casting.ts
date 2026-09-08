/**
 * 三枚铜钱法的事实层实现。
 *
 * 每枚铜钱正面记 3、反面记 2，因此三枚之和只能为 6/7/8/9，
 * 其组合数严格为 1/3/3/1。随机源由调用方注入，便于重放和穷举回归，
 * 业务层不得用单次 6..9 的均匀抽样替代它。
 */
export const LIUYAO_CASTING_RULE_VERSION = 'three-coin-v1' as const;

export type LiuyaoCoinValue = 6 | 7 | 8 | 9;
export type CoinFace = 2 | 3;

export interface ThreeCoinThrow {
  faces: [CoinFace, CoinFace, CoinFace];
  value: LiuyaoCoinValue;
  yinYang: '阴' | '阳';
  isChanging: boolean;
}

function faceFromRandom(sample: number): CoinFace {
  if (!Number.isFinite(sample) || sample < 0 || sample > 1) {
    throw new Error('六爻随机源必须返回 0 到 1（含边界）的有限数字。');
  }
  return sample > 0.5 ? 3 : 2;
}

export function threeCoinThrowFromFaces(faces: [CoinFace, CoinFace, CoinFace]): ThreeCoinThrow {
  const value = (faces[0] + faces[1] + faces[2]) as LiuyaoCoinValue;
  if (![6, 7, 8, 9].includes(value)) throw new Error('三枚铜钱事实必须只能产生 6、7、8 或 9。');
  return {
    faces,
    value,
    yinYang: value === 7 || value === 9 ? '阳' : '阴',
    isChanging: value === 6 || value === 9,
  };
}

/** Consume exactly three independent random samples for one line. */
export function castThreeCoins(random: () => number = Math.random): ThreeCoinThrow {
  return threeCoinThrowFromFaces([
    faceFromRandom(random()),
    faceFromRandom(random()),
    faceFromRandom(random()),
  ]);
}

/** Convert the persisted 6/7/8/9 fact into the derived line facts. */
export function lineFactsFromCoinValue(value: LiuyaoCoinValue) {
  return {
    value,
    yinYang: value === 7 || value === 9 ? '阳' as const : '阴' as const,
    isChanging: value === 6 || value === 9,
  };
}
