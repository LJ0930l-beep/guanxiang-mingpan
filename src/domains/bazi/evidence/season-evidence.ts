import type { NormalizedBaziChart } from '@/domains/bazi/model/normalized-chart';
import type { EvidenceNode } from '@/domains/bazi/evidence/evidence-types';

type Element = 'wood' | 'fire' | 'earth' | 'metal' | 'water' | 'unknown';
type SeasonInfluence = 'same' | 'support' | 'pressure' | 'drain' | 'control' | 'neutral';

const ELEMENT_LABELS: Record<Element, string> = {
  wood: '木', fire: '火', earth: '土', metal: '金', water: '水', unknown: '未知',
};

const GENERATES: Record<Exclude<Element, 'unknown'>, Exclude<Element, 'unknown'>> = {
  wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood',
};

const CONTROLS: Record<Exclude<Element, 'unknown'>, Exclude<Element, 'unknown'>> = {
  wood: 'earth', fire: 'metal', earth: 'water', metal: 'wood', water: 'fire',
};

function classify(monthElement: Element, dayMasterElement: Element): SeasonInfluence {
  if (monthElement === 'unknown' || dayMasterElement === 'unknown') return 'neutral';
  if (monthElement === dayMasterElement) return 'same';
  if (GENERATES[monthElement] === dayMasterElement) return 'support';
  if (CONTROLS[monthElement] === dayMasterElement) return 'pressure';
  if (GENERATES[dayMasterElement] === monthElement) return 'drain';
  if (CONTROLS[dayMasterElement] === monthElement) return 'control';
  return 'neutral';
}

export function buildSeasonEvidenceNodes(chart: NormalizedBaziChart): EvidenceNode[] {
  const month = chart.monthBranch;
  const influence = classify(month.element, chart.dayMaster.element);
  return [{
    id: 'evidence:season:month-command',
    type: 'season.month-command',
    subjectRefs: [month.id, chart.dayMaster.id],
    label: `月令 ${month.value}（${ELEMENT_LABELS[month.element]}）对日主 ${chart.dayMaster.value}（${ELEMENT_LABELS[chart.dayMaster.element]}）的季节依据`,
    facts: {
      monthBranch: month.value,
      monthElement: month.element,
      dayMaster: chart.dayMaster.value,
      dayMasterElement: chart.dayMaster.element,
      influence,
      isMonthCommand: true,
      weight: 'major',
    },
    weight: 'major',
    ruleVersion: 'bazi-season-v1',
    source: 'derived-rule',
  }];
}
