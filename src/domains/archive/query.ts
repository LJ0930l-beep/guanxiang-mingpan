import type { ChartPayload } from '@/types/charts';
import type { DivinationModule, ReadingFeedbackStatus, SavedReading } from '@/types/domain';

export type ArchiveDateRange = 'all' | '7d' | '30d';
export type ArchiveGroupBy = 'none' | 'profile' | 'date';

export interface ArchiveFilterState {
  query: string;
  modules: DivinationModule[];
  profileIds: string[];
  favoritesOnly: boolean;
  feedbackStatuses: ReadingFeedbackStatus[];
  dateRange: ArchiveDateRange;
  groupBy: ArchiveGroupBy;
}

export const DEFAULT_ARCHIVE_FILTER_STATE: ArchiveFilterState = {
  query: '',
  modules: [],
  profileIds: [],
  favoritesOnly: false,
  feedbackStatuses: [],
  dateRange: 'all',
  groupBy: 'none',
};

export interface ArchiveReadingGroup {
  key: string;
  label: string;
  readings: SavedReading[];
}

export interface ArchiveFieldDiff {
  key: string;
  label: string;
  oldValue: string;
  newValue: string;
}

export interface ArchiveReadingComparison {
  allowed: boolean;
  reason?: string;
  sameProfile: boolean;
  sameModule: boolean;
  leftId: string;
  rightId: string;
  fields: ArchiveFieldDiff[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function dayKeyInShanghai(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return typeof value === 'string' ? value.slice(0, 10) : '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function dayOrdinal(dayKey: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (!match) return Number.NaN;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / DAY_MS;
}

function readingSearchText(reading: SavedReading): string {
  const payload = reading.payload as ChartPayload;
  const question = payload.module === 'liuyao' ? payload.question : '';
  return [reading.profileName, reading.title, reading.summary, question].filter(Boolean).join(' ').toLocaleLowerCase('zh-CN');
}

function matchesDateRange(reading: SavedReading, range: ArchiveDateRange, now: Date): boolean {
  if (range === 'all') return true;
  const today = dayOrdinal(dayKeyInShanghai(now));
  const readingDay = dayOrdinal(dayKeyInShanghai(reading.createdAt));
  if (!Number.isFinite(today) || !Number.isFinite(readingDay)) return false;
  const days = range === '7d' ? 7 : 30;
  const age = today - readingDay;
  return age >= 0 && age < days;
}

export function filterArchiveReadings(
  readings: SavedReading[],
  filter: ArchiveFilterState,
  now: Date = new Date(),
): SavedReading[] {
  const query = filter.query.trim().toLocaleLowerCase('zh-CN');
  return readings.filter((reading) => {
    if (query && !readingSearchText(reading).includes(query)) return false;
    if (filter.modules.length > 0 && !filter.modules.includes(reading.module)) return false;
    if (filter.profileIds.length > 0 && !filter.profileIds.includes(reading.profileId)) return false;
    if (filter.favoritesOnly && !reading.favorite) return false;
    if (filter.feedbackStatuses.length > 0 && !(reading.feedback ?? []).some((feedback) => filter.feedbackStatuses.includes(feedback.status))) return false;
    return matchesDateRange(reading, filter.dateRange, now);
  });
}

export function groupArchiveReadings(readings: SavedReading[], groupBy: ArchiveGroupBy): ArchiveReadingGroup[] {
  if (groupBy === 'none') return readings.length > 0 ? [{ key: 'all', label: '', readings }] : [];
  const groups = new Map<string, SavedReading[]>();
  for (const reading of readings) {
    const key = groupBy === 'profile' ? reading.profileId : dayKeyInShanghai(reading.createdAt);
    const group = groups.get(key) ?? [];
    group.push(reading);
    groups.set(key, group);
  }
  return [...groups.entries()].map(([key, group]) => ({
    key,
    label: groupBy === 'profile' ? group[0]?.profileName ?? key : key,
    readings: group,
  }));
}

function stableValue(value: unknown): string {
  if (value === undefined || value === null || value === '') return '未记录';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value, Object.keys(value as Record<string, unknown>).sort());
}

function addDiff(fields: ArchiveFieldDiff[], key: string, label: string, oldValue: unknown, newValue: unknown): void {
  const oldText = stableValue(oldValue);
  const newText = stableValue(newValue);
  if (oldText !== newText) fields.push({ key, label, oldValue: oldText, newValue: newText });
}

function moduleFields(reading: SavedReading): [string, string, unknown][] {
  const payload = reading.payload as ChartPayload;
  if (payload.module === 'bazi') {
    return [
      ['dayMaster', '日主', payload.dayMaster],
      ['focus', '当前观察', payload.focus],
      ['strength', '身强弱', payload.strengthAssessment?.status],
      ['interpretation', '解释层版本', payload.interpretation?.interpretationVersion],
      ['evidenceCount', '证据节点数', payload.evidenceGraph?.nodes.length],
    ];
  }
  if (payload.module === 'liuyao') {
    return [
      ['question', '问题', payload.question],
      ['seed', '起卦种子', payload.seed],
      ['date', '起卦日期', payload.date],
      ['seedScope', '种子范围', payload.seedScope],
      ['hexagram', '本卦', payload.hexagramName],
      ['changedHexagram', '变卦', payload.changedHexagramName],
    ];
  }
  if (payload.module === 'ziwei') {
    return [
      ['soul', '命宫', payload.soul],
      ['body', '身宫', payload.body],
      ['fiveElement', '五行局', payload.fiveElement],
      ['focus', '当前观察', payload.focus],
    ];
  }
  return [
    ['calculationMode', '计算模式', payload.calculationMode],
    ['sunSign', '太阳星座', payload.sunSign],
    ['moonSign', '月亮星座', payload.moonSign],
    ['ascendant', '上升星座', payload.ascendant],
    ['focus', '当前观察', payload.focus],
  ];
}

export function compareArchiveReadings(left: SavedReading, right: SavedReading): ArchiveReadingComparison {
  const sameProfile = left.profileId === right.profileId;
  const sameModule = left.module === right.module;
  if (!sameProfile || !sameModule) {
    return {
      allowed: false,
      reason: !sameProfile ? '只能对比同一命主的记录。' : '只能对比同一模块的记录。',
      sameProfile,
      sameModule,
      leftId: left.id,
      rightId: right.id,
      fields: [],
    };
  }
  const fields: ArchiveFieldDiff[] = [];
  addDiff(fields, 'title', '标题', left.title, right.title);
  addDiff(fields, 'summary', '摘要', left.summary, right.summary);
  addDiff(fields, 'engineVersion', '计算引擎', left.engineVersion, right.engineVersion);
  addDiff(fields, 'interpretationVersion', '解释版本', left.interpretationVersion, right.interpretationVersion);
  addDiff(fields, 'timezone', '业务时区', left.snapshotMeta.calculationSettings.timezone, right.snapshotMeta.calculationSettings.timezone);
  addDiff(fields, 'inputSnapshot', '输入快照', left.inputSnapshot, right.inputSnapshot);
  for (const [key, label, leftValue] of moduleFields(left)) {
    const rightValue = moduleFields(right).find(([rightKey]) => rightKey === key)?.[2];
    addDiff(fields, key, label, leftValue, rightValue);
  }
  return {
    allowed: true,
    sameProfile,
    sameModule,
    leftId: left.id,
    rightId: right.id,
    fields,
  };
}

export { dayKeyInShanghai };
