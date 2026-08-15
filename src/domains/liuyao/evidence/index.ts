import type { NormalizedLiuyaoChart } from '@/domains/liuyao/model/normalized-chart';
import { LIUYAO_EVIDENCE_RULE_VERSION, type LiuyaoEvidenceGraph, type LiuyaoEvidenceNode } from '@/domains/liuyao/evidence/evidence-types';

export type { LiuyaoEvidenceGraph, LiuyaoEvidenceNode } from '@/domains/liuyao/evidence/evidence-types';

export function buildLiuyaoEvidenceGraph(
  chart: NormalizedLiuyaoChart,
  source: { engineVersion: string },
): LiuyaoEvidenceGraph {
  const questionNode: LiuyaoEvidenceNode = {
    id: 'liuyao:question:frame',
    type: 'question.frame',
    subjectRefs: [],
    label: `问题：${chart.question}`,
    facts: { question: chart.question },
    weight: 'major',
    ruleVersion: LIUYAO_EVIDENCE_RULE_VERSION,
    source: 'chart',
  };
  const yongShenNode: LiuyaoEvidenceNode = {
    id: 'liuyao:yongshen:selection',
    type: 'yongshen.selection',
    subjectRefs: [],
    label: `用神方向：${chart.yongShenTarget}`,
    facts: { target: chart.yongShenTarget },
    weight: 'major',
    ruleVersion: LIUYAO_EVIDENCE_RULE_VERSION,
    source: 'chart',
  };
  const lineStrengthNodes = chart.lines.map((line) => ({
    id: `${line.id}:strength`,
    type: 'line.strength',
    subjectRefs: [line.id],
    label: `${line.position}爻${line.strength ? ` · ${line.strength}` : ' · 状态待核'}`,
    facts: { position: line.position, strength: line.strength, evidence: line.evidence, liuQin: line.liuQin, wuXing: line.wuXing },
    weight: line.isShiYao || line.isYingYao ? 'major' : 'medium',
    ruleVersion: LIUYAO_EVIDENCE_RULE_VERSION,
    source: 'chart',
  } satisfies LiuyaoEvidenceNode));
  const shiYingLines = chart.lines.filter((line) => line.isShiYao || line.isYingYao);
  const shiYingNode: LiuyaoEvidenceNode = {
    id: 'liuyao:shi-ying:relation',
    type: 'shi-ying',
    subjectRefs: shiYingLines.map((line) => line.id),
    label: `世应：${shiYingLines.map((line) => `${line.position}爻${line.isShiYao ? '世' : '应'}`).join('、') || '未返回'}`,
    facts: { shiPosition: chart.lines.find((line) => line.isShiYao)?.position, yingPosition: chart.lines.find((line) => line.isYingYao)?.position },
    weight: 'major',
    ruleVersion: LIUYAO_EVIDENCE_RULE_VERSION,
    source: 'chart',
  };
  const movingNodes = chart.lines.filter((line) => line.isChanging).map((line) => ({
    id: `${line.id}:change`,
    type: 'moving-change',
    subjectRefs: [line.id],
    label: `${line.position}爻动变`,
    facts: { position: line.position, liuQin: line.liuQin, naJia: line.naJia, wuXing: line.wuXing },
    weight: 'major',
    ruleVersion: LIUYAO_EVIDENCE_RULE_VERSION,
    source: 'chart',
  } satisfies LiuyaoEvidenceNode));
  const voidNode: LiuyaoEvidenceNode = {
    id: 'liuyao:void:fact',
    type: 'void.fact',
    subjectRefs: [],
    label: `空亡：${chart.kongWang}`,
    facts: { kongWang: chart.kongWang },
    weight: 'medium',
    ruleVersion: LIUYAO_EVIDENCE_RULE_VERSION,
    source: 'chart',
  };
  const structureNode: LiuyaoEvidenceNode = {
    id: 'liuyao:hexagram:structure',
    type: 'hexagram.structure',
    subjectRefs: [],
    label: chart.changedHexagramName ? `${chart.hexagramName}变${chart.changedHexagramName}` : `${chart.hexagramName}静卦`,
    facts: { hexagramName: chart.hexagramName, changedHexagramName: chart.changedHexagramName, hexagramGong: chart.hexagramGong },
    weight: 'major',
    ruleVersion: LIUYAO_EVIDENCE_RULE_VERSION,
    source: 'chart',
  };
  const timeNode: LiuyaoEvidenceNode = {
    id: 'liuyao:time:fact',
    type: 'time.fact',
    subjectRefs: [],
    label: `干支时间：${chart.ganZhiTime}`,
    facts: { ganZhiTime: chart.ganZhiTime, date: chart.date },
    weight: 'medium',
    ruleVersion: LIUYAO_EVIDENCE_RULE_VERSION,
    source: 'chart',
  };
  return {
    evidenceVersion: LIUYAO_EVIDENCE_RULE_VERSION,
    source: { modelVersion: chart.modelVersion, engineVersion: source.engineVersion },
    nodes: [questionNode, yongShenNode, structureNode, timeNode, ...lineStrengthNodes, shiYingNode, ...movingNodes, voidNode],
  };
}
