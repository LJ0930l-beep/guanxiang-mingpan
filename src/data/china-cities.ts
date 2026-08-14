export interface CityCoordinate {
  name: string;
  aliases: string[];
  latitude: number;
  longitude: number;
}

const mainlandCities: CityCoordinate[] = [
  { name: '北京市', aliases: ['北京'], latitude: 39.9042, longitude: 116.4074 },
  { name: '上海市', aliases: ['上海'], latitude: 31.2304, longitude: 121.4737 },
  { name: '广州市', aliases: ['广州', '广东省广州市'], latitude: 23.1291, longitude: 113.2644 },
  { name: '深圳市', aliases: ['深圳', '广东省深圳市'], latitude: 22.5431, longitude: 114.0579 },
  { name: '杭州市', aliases: ['杭州', '浙江省杭州市'], latitude: 30.2741, longitude: 120.1551 },
  { name: '南京市', aliases: ['南京', '江苏省南京市'], latitude: 32.0603, longitude: 118.7969 },
  { name: '成都市', aliases: ['成都', '四川省成都市'], latitude: 30.5728, longitude: 104.0668 },
  { name: '重庆市', aliases: ['重庆'], latitude: 29.563, longitude: 106.5516 },
  { name: '武汉市', aliases: ['武汉', '湖北省武汉市'], latitude: 30.5928, longitude: 114.3055 },
  { name: '西安市', aliases: ['西安', '陕西省西安市'], latitude: 34.3416, longitude: 108.9398 },
  { name: '天津市', aliases: ['天津'], latitude: 39.0851, longitude: 117.1994 },
  { name: '苏州市', aliases: ['苏州', '江苏省苏州市'], latitude: 31.2989, longitude: 120.5853 },
  { name: '长沙市', aliases: ['长沙', '湖南省长沙市'], latitude: 28.2282, longitude: 112.9388 },
  { name: '郑州市', aliases: ['郑州', '河南省郑州市'], latitude: 34.7466, longitude: 113.6254 },
  { name: '青岛市', aliases: ['青岛', '山东省青岛市'], latitude: 36.0671, longitude: 120.3826 },
  { name: '厦门市', aliases: ['厦门', '福建省厦门市'], latitude: 24.4798, longitude: 118.0894 },
  { name: '沈阳市', aliases: ['沈阳', '辽宁省沈阳市'], latitude: 41.8057, longitude: 123.4315 },
  { name: '哈尔滨市', aliases: ['哈尔滨', '黑龙江省哈尔滨市'], latitude: 45.8038, longitude: 126.5349 },
  { name: '昆明市', aliases: ['昆明', '云南省昆明市'], latitude: 25.0389, longitude: 102.7183 },
  { name: '海口市', aliases: ['海口', '海南省海口市'], latitude: 20.044, longitude: 110.1999 },
];

export function resolveCityCoordinates(input: string): CityCoordinate | undefined {
  const normalized = input.replace(/\s/g, '');
  return mainlandCities.find((city) =>
    [city.name, ...city.aliases].some((alias) => normalized.includes(alias) || alias.includes(normalized)),
  );
}

