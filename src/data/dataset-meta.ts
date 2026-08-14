import {
  CHINA_CITY_DATASET_LICENSE,
  CHINA_CITY_DATASET_SOURCE,
  CHINA_CITY_DATASET_VERSION,
} from '@/data/china-cities';

export const DATASET_META = {
  chinaCities: {
    id: 'china-cities',
    version: CHINA_CITY_DATASET_VERSION,
    coverage: '中国大陆直辖市、省会/自治区首府及首发常用地级市；城市中心近似坐标。',
    timezone: 'Asia/Shanghai',
    source: CHINA_CITY_DATASET_SOURCE,
    license: CHINA_CITY_DATASET_LICENSE,
    aliases: '仅接受表内名称或别名的精确匹配；不做包含、邻近或行政区猜测。',
  },
} as const;
