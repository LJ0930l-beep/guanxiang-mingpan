import { DivinationModule } from '@/types/domain';

export interface ModuleDefinition {
  slug: DivinationModule;
  glyph: string;
  title: string;
  classicalName: string;
  description: string;
  inputHint: string;
  accent: string;
}

export const divinationModules: ModuleDefinition[] = [
  {
    slug: 'bazi',
    glyph: '八',
    title: '八字',
    classicalName: '四柱命理',
    description: '从出生年月日时，查看五行与十神结构。',
    inputHint: '需要出生日期；准确时辰可提升完整度。',
    accent: '#B79B65',
  },
  {
    slug: 'liuyao',
    glyph: '爻',
    title: '六爻',
    classicalName: '纳甲筮法',
    description: '围绕一件具体问题，记录本卦、动变与反馈。',
    inputHint: '可在线起卦，也可录入已有卦象。',
    accent: '#6F9A88',
  },
  {
    slug: 'ziwei',
    glyph: '紫',
    title: '紫微斗数',
    classicalName: '十二宫盘',
    description: '以宫位与星曜关系，观察人生主题分布。',
    inputHint: '出生时辰会直接影响命宫与星曜落宫。',
    accent: '#A98278',
  },
  {
    slug: 'astrology',
    glyph: '星',
    title: '十二星座',
    classicalName: '西方本命盘',
    description: '生成行星、宫位与相位组成的完整星盘。',
    inputHint: '完整宫位需要准确时间与出生地点。',
    accent: '#8E91B1',
  },
];

export const moduleBySlug = Object.fromEntries(
  divinationModules.map((module) => [module.slug, module]),
) as Record<DivinationModule, ModuleDefinition>;

