export const CHINA_CITY_DATASET_VERSION = 'china-cities-p1f-mainland-v1' as const;
export const CHINA_CITY_DATASET_SOURCE = '观象首发大陆城市表（人工整理的城市中心近似坐标）' as const;
export const CHINA_CITY_DATASET_LICENSE = '观象自有编排；上线前需逐项复核坐标与第三方数据许可边界' as const;

export interface CityCoordinate {
  /** Stable identifier kept in snapshots so a later data refresh cannot reinterpret a record. */
  locationId: string;
  province: string;
  city: string;
  district?: string;
  name: string;
  aliases: string[];
  latitude: number;
  longitude: number;
  timezone: 'Asia/Shanghai';
  datasetVersion: typeof CHINA_CITY_DATASET_VERSION;
  source: typeof CHINA_CITY_DATASET_SOURCE;
  license: typeof CHINA_CITY_DATASET_LICENSE;
}

function city(
  locationId: string,
  province: string,
  name: string,
  aliases: string[],
  latitude: number,
  longitude: number,
): CityCoordinate {
  return {
    locationId,
    province,
    city: name.replace(/市$/, ''),
    name,
    aliases,
    latitude,
    longitude,
    timezone: 'Asia/Shanghai',
    datasetVersion: CHINA_CITY_DATASET_VERSION,
    source: CHINA_CITY_DATASET_SOURCE,
    license: CHINA_CITY_DATASET_LICENSE,
  };
}

/**
 * Mainland-only first-release coverage: municipalities and provincial capitals,
 * plus the most common prefecture-level cities already exposed by the prototype.
 * Coordinates are city-centre approximations, not a promise of a district-level
 * geocoder. An unlisted input must remain unknown instead of being guessed.
 */
const mainlandCities: CityCoordinate[] = [
  city('CN-BJ-BEIJING', '北京市', '北京市', ['北京'], 39.9042, 116.4074),
  city('CN-SH-SHANGHAI', '上海市', '上海市', ['上海'], 31.2304, 121.4737),
  city('CN-TJ-TIANJIN', '天津市', '天津市', ['天津'], 39.0851, 117.1994),
  city('CN-CQ-CHONGQING', '重庆市', '重庆市', ['重庆'], 29.563, 106.5516),
  city('CN-HE-SHIJIAZHUANG', '河北省', '石家庄市', ['石家庄', '河北省石家庄市'], 38.0428, 114.5149),
  city('CN-SX-TAIYUAN', '山西省', '太原市', ['太原', '山西省太原市'], 37.8706, 112.5489),
  city('CN-NM-HOHHOT', '内蒙古自治区', '呼和浩特市', ['呼和浩特', '内蒙古呼和浩特市'], 40.8415, 111.752),
  city('CN-LN-SHENYANG', '辽宁省', '沈阳市', ['沈阳', '辽宁省沈阳市'], 41.8057, 123.4315),
  city('CN-JL-CHANGCHUN', '吉林省', '长春市', ['长春', '吉林省长春市'], 43.8171, 125.3235),
  city('CN-HLJ-HARBIN', '黑龙江省', '哈尔滨市', ['哈尔滨', '黑龙江省哈尔滨市'], 45.8038, 126.5349),
  city('CN-JS-NANJING', '江苏省', '南京市', ['南京', '江苏省南京市'], 32.0603, 118.7969),
  city('CN-JS-SUZHOU', '江苏省', '苏州市', ['苏州', '江苏省苏州市'], 31.2989, 120.5853),
  city('CN-ZJ-HANGZHOU', '浙江省', '杭州市', ['杭州', '浙江省杭州市'], 30.2741, 120.1551),
  city('CN-AH-HEFEI', '安徽省', '合肥市', ['合肥', '安徽省合肥市'], 31.8206, 117.2272),
  city('CN-FJ-FUZHOU', '福建省', '福州市', ['福州', '福建省福州市'], 26.0745, 119.2965),
  city('CN-FJ-XIAMEN', '福建省', '厦门市', ['厦门', '福建省厦门市'], 24.4798, 118.0894),
  city('CN-JX-NANCHANG', '江西省', '南昌市', ['南昌', '江西省南昌市'], 28.6829, 115.8582),
  city('CN-SD-JINAN', '山东省', '济南市', ['济南', '山东省济南市'], 36.6512, 117.1201),
  city('CN-SD-QINGDAO', '山东省', '青岛市', ['青岛', '山东省青岛市'], 36.0671, 120.3826),
  city('CN-HA-ZHENGZHOU', '河南省', '郑州市', ['郑州', '河南省郑州市'], 34.7466, 113.6254),
  city('CN-HA-WUHAN', '湖北省', '武汉市', ['武汉', '湖北省武汉市'], 30.5928, 114.3055),
  city('CN-HN-CHANGSHA', '湖南省', '长沙市', ['长沙', '湖南省长沙市'], 28.2282, 112.9388),
  city('CN-GD-GUANGZHOU', '广东省', '广州市', ['广州', '广东省广州市'], 23.1291, 113.2644),
  city('CN-GD-SHENZHEN', '广东省', '深圳市', ['深圳', '广东省深圳市'], 22.5431, 114.0579),
  city('CN-GX-NANNING', '广西壮族自治区', '南宁市', ['南宁', '广西南宁市'], 22.817, 108.3665),
  city('CN-HI-HAIKOU', '海南省', '海口市', ['海口', '海南省海口市'], 20.044, 110.1999),
  city('CN-SC-CHENGDU', '四川省', '成都市', ['成都', '四川省成都市'], 30.5728, 104.0668),
  city('CN-GZ-GUIYANG', '贵州省', '贵阳市', ['贵阳', '贵州省贵阳市'], 26.647, 106.6302),
  city('CN-YN-KUNMING', '云南省', '昆明市', ['昆明', '云南省昆明市'], 25.0389, 102.7183),
  city('CN-XZ-LHASA', '西藏自治区', '拉萨市', ['拉萨', '西藏拉萨市'], 29.6525, 91.1721),
  city('CN-SN-XIAN', '陕西省', '西安市', ['西安', '陕西省西安市'], 34.3416, 108.9398),
  city('CN-GS-LANZHOU', '甘肃省', '兰州市', ['兰州', '甘肃省兰州市'], 36.0611, 103.8343),
  city('CN-QH-XINING', '青海省', '西宁市', ['西宁', '青海省西宁市'], 36.6171, 101.7782),
  city('CN-NX-YINCHUAN', '宁夏回族自治区', '银川市', ['银川', '宁夏银川市'], 38.4872, 106.2309),
  city('CN-XJ-URUMQI', '新疆维吾尔自治区', '乌鲁木齐市', ['乌鲁木齐', '新疆乌鲁木齐市'], 43.8256, 87.6168),
];

function normalizeCityInput(input: string): string {
  return input.trim().replace(/[\s,，。·]/g, '');
}

export function resolveCityCoordinates(input: string): CityCoordinate | undefined {
  const normalized = normalizeCityInput(input);
  if (!normalized) return undefined;
  return mainlandCities.find((entry) =>
    [entry.name, ...entry.aliases].some((alias) => normalizeCityInput(alias) === normalized),
  );
}

export function listMainlandCities(): readonly CityCoordinate[] {
  return mainlandCities;
}
