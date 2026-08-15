import type { DivinationModule } from '@/types/domain';
import { GLOSSARY_VERSION, type GlossaryTerm } from '@/domains/explanation/types';

const TERMS: GlossaryTerm[] = [
  {
    id: 'glossary:shared:five-elements',
    term: '五行',
    shortDefinition: '木、火、土、金、水五种传统分类，用来描述盘面中的关系与作用。',
    detail: '在观象·命盘中，五行是规则模型的分类语言，不等同于现实世界的物质成分或科学因果。',
    module: 'shared',
    caution: '它需要结合位置、季节和关系阅读，不能只按数量下结论。',
    version: GLOSSARY_VERSION,
  },
  {
    id: 'glossary:bazi:day-master',
    term: '日主',
    shortDefinition: '八字日柱天干，作为观察盘面支持与制约关系的中心。',
    detail: '日主只是分析坐标，不代表一个人的全部性格或人生结果。',
    module: 'bazi',
    caution: '需要结合月令、根气、透干和关系证据综合阅读。',
    version: GLOSSARY_VERSION,
  },
  {
    id: 'glossary:bazi:month-command',
    term: '月令',
    shortDefinition: '出生月份对应的地支，是判断季节背景的重要依据。',
    detail: '月令提供季节语境，但不会单独决定日主强弱。',
    module: 'bazi',
    caution: '观象会同时展示根气、透干与反向证据。',
    version: GLOSSARY_VERSION,
  },
  {
    id: 'glossary:bazi:root',
    term: '通根',
    shortDefinition: '日主同类力量在地支藏干中有对应根气的事实。',
    detail: '根气还要结合本气、中气、余气以及冲合等关系观察。',
    module: 'bazi',
    caution: '有根不等于必然偏强。',
    version: GLOSSARY_VERSION,
  },
  {
    id: 'glossary:bazi:exposure',
    term: '透干',
    shortDefinition: '某个天干力量直接出现在四柱天干层的事实。',
    detail: '透干与藏干是不同层级的盘面信息，解释时会分别标记。',
    module: 'bazi',
    caution: '透出只说明可见位置，不自动等于作用结果。',
    version: GLOSSARY_VERSION,
  },
  {
    id: 'glossary:bazi:ten-gods',
    term: '十神',
    shortDefinition: '以日主为参照，对其他天干与藏干进行关系分类的标签。',
    detail: '十神是传统关系语言，观象只用于解释盘面结构，不把它翻译成确定人格或事件。',
    module: 'bazi',
    caution: '首次出现时应结合具体天干、位置和证据阅读。',
    version: GLOSSARY_VERSION,
  },
  {
    id: 'glossary:bazi:relations',
    term: '合冲刑害',
    shortDefinition: '柱与柱之间被规则识别出的关系事实集合。',
    detail: '这些关系可以成为后续解释的上下文，但不能脱离其他证据直接宣告吉凶。',
    module: 'bazi',
    caution: '不同流派的取法可能不同，本版本会显示规则版本。',
    version: GLOSSARY_VERSION,
  },
  {
    id: 'glossary:ziwei:life-palace',
    term: '命宫',
    shortDefinition: '紫微盘中用于标记出生时刻命宫位置的宫位。',
    detail: '命宫是盘面坐标之一，需和主星、身宫及其他宫位一起观察。',
    module: 'ziwei',
    caution: '命宫位置不是对现实结果的单独断语。',
    version: GLOSSARY_VERSION,
  },
  {
    id: 'glossary:ziwei:body-palace',
    term: '身宫',
    shortDefinition: '紫微盘中用于标记身宫位置的宫位。',
    detail: '观象将身宫保存为可追溯的宫位引用，便于复盘位置与星曜。',
    module: 'ziwei',
    caution: '身宫需要结合命宫与盘面其他证据阅读。',
    version: GLOSSARY_VERSION,
  },
  {
    id: 'glossary:ziwei:four-transform',
    term: '四化',
    shortDefinition: '生年或规则计算出的禄、权、科、忌等变曜标记。',
    detail: '本版本只展示四化落入哪一宫的事实，不把它扩写成确定事件。',
    module: 'ziwei',
    caution: '不同流派的四化表可能不同，需同时查看算法版本。',
    version: GLOSSARY_VERSION,
  },
  {
    id: 'glossary:ziwei:main-star',
    term: '主星',
    shortDefinition: '安置在十二宫中的主要星曜及其亮度字段。',
    detail: '主星是宫位证据的一部分，观象会保留星曜、亮度和宫位引用。',
    module: 'ziwei',
    caution: '单一主星不应脱离宫位与其他证据单独解释。',
    version: GLOSSARY_VERSION,
  },
  {
    id: 'glossary:ziwei:palace-position',
    term: '宫位落点',
    shortDefinition: '宫名与天干地支位置组成的盘面事实。',
    detail: '宫位落点是紫微解释层引用星曜、命身宫和四化的基础。',
    module: 'ziwei',
    caution: '落点属于计算结果，不等同于现实中的单一结论。',
    version: GLOSSARY_VERSION,
  },
];

export const GLOSSARY_TERMS: readonly GlossaryTerm[] = TERMS;

export function getGlossaryTerm(id: string): GlossaryTerm | undefined {
  return TERMS.find((term) => term.id === id);
}

export function listGlossaryTerms(module?: DivinationModule): GlossaryTerm[] {
  return TERMS.filter((term) => term.module === 'shared' || term.module === module);
}
