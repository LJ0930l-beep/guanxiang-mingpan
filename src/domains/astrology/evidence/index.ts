import type { NormalizedAstrologyChart } from '@/domains/astrology/model/normalized-chart';
import { ASTROLOGY_EVIDENCE_RULE_VERSION, type AstrologyEvidenceGraph, type AstrologyEvidenceNode } from '@/domains/astrology/evidence/evidence-types';
import type { AstrologyCalculationPolicy } from '@/domains/astrology/policy';

export type { AstrologyEvidenceGraph, AstrologyEvidenceNode } from '@/domains/astrology/evidence/evidence-types';

export function buildAstrologyEvidenceGraph(
  chart: NormalizedAstrologyChart,
  source: { engineVersion: string; astrologyPolicy?: AstrologyCalculationPolicy },
): AstrologyEvidenceGraph {
  const astrologyPolicy = source.astrologyPolicy;
  const pointNodes: AstrologyEvidenceNode[] = chart.points.map((point) => ({
    id: `${point.id}:placement`,
    type: point.kind === 'angle' ? 'angle.position' : 'point.placement',
    subjectRefs: [point.id],
    label: `${point.label}落${point.sign}`,
    facts: {
      key: point.key,
      sign: point.sign,
      longitude: point.longitude,
      house: point.house,
      kind: point.kind,
    },
    weight: point.key === 'sun' || point.key === 'moon' || point.key === 'ascendant' ? 'major' : 'medium',
    ruleVersion: ASTROLOGY_EVIDENCE_RULE_VERSION,
    source: 'chart',
  }));
  const houseNodes: AstrologyEvidenceNode[] = chart.points
    .filter((point) => point.house !== undefined)
    .map((point) => ({
      id: `${point.id}:house`,
      type: 'house.placement',
      subjectRefs: [point.id],
      label: `${point.label}位于第${point.house}宫`,
      facts: { key: point.key, house: point.house },
      weight: 'medium',
      ruleVersion: ASTROLOGY_EVIDENCE_RULE_VERSION,
      source: 'chart',
    }));
  const aspectNodes: AstrologyEvidenceNode[] = chart.aspects.map((aspect) => ({
    id: `${aspect.id}:structure`,
    type: 'aspect.structure',
    subjectRefs: [aspect.fromRefId, aspect.toRefId],
    label: `${aspect.label} · 容许度${Number.isFinite(aspect.orb) ? aspect.orb.toFixed(2) : '未知'}°`,
    facts: { label: aspect.label, orb: aspect.orb, sourceIndex: aspect.sourceIndex },
    weight: aspect.orb <= 3 ? 'major' : 'medium',
    ruleVersion: ASTROLOGY_EVIDENCE_RULE_VERSION,
    source: 'chart',
  }));
  const retrogradeNodes: AstrologyEvidenceNode[] = chart.points
    .filter((point) => point.retrograde)
    .map((point) => ({
      id: `${point.id}:retrograde`,
      type: 'retrograde.fact',
      subjectRefs: [point.id],
      label: `${point.label}逆行字段为真`,
      facts: { key: point.key, retrograde: true },
      weight: 'minor',
      ruleVersion: ASTROLOGY_EVIDENCE_RULE_VERSION,
      source: 'chart',
    }));
  const precisionNode: AstrologyEvidenceNode = {
    id: 'astrology:precision:mode',
    type: 'precision.caveat',
    subjectRefs: [],
    label: chart.calculationMode === 'exact' ? '出生城市坐标已匹配' : astrologyPolicy?.precision === 'date-level-approximate'
      ? '出生时辰未知，当前为日级近似盘'
      : '出生城市坐标未匹配，当前为近似盘',
    facts: {
      calculationMode: chart.calculationMode,
      precision: astrologyPolicy?.precision ?? (chart.calculationMode === 'exact' ? 'exact' : 'approximate'),
      housesAvailable: chart.calculationMode === 'exact',
      anglesAvailable: chart.calculationMode === 'exact',
      ...(astrologyPolicy ? { astrologyPolicy } : {}),
    },
    weight: 'major',
    ruleVersion: ASTROLOGY_EVIDENCE_RULE_VERSION,
    source: 'derived-rule',
  };
  return {
    evidenceVersion: ASTROLOGY_EVIDENCE_RULE_VERSION,
    source: { modelVersion: chart.modelVersion, engineVersion: source.engineVersion },
    nodes: [...pointNodes, ...houseNodes, ...aspectNodes, ...retrogradeNodes, precisionNode],
  };
}
