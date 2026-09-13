import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/action-button';
import { AnimatedReveal } from '@/components/animated-reveal';
import { AmbientRing } from '@/components/ambient-ring';
import { PulseDot } from '@/components/pulse-dot';
import { Atmosphere } from '@/components/atmosphere';
import { BottomDock } from '@/components/bottom-dock';
import { ExplanationLayer } from '@/components/explanation-layer';
import { ChartRenderer } from '@/components/chart-renderer';
import { ChartReportPanel } from '@/components/chart-report';
import { ModuleSigil } from '@/components/module-sigil';
import { StatePanel } from '@/components/state-panel';
import { fontFamilies, layout, palette, radii, spacing } from '@/constants/guanxiang';
import { UI_STATE_COPY } from '@/constants/ui-copy';
import { moduleBySlug, type ModuleDefinition } from '@/data/modules';
import { buildBaziTrueSolarEvidenceDisplay } from '@/domains/bazi/true-solar-presentation';
import {
  calculateAstrologyView,
  calculateBaziView,
  calculateLiuyaoView,
  calculateZiweiView,
} from '@/services/chart-engine';
import { useApp } from '@/state/app-context';
import { listGlossaryTerms } from '@/domains/explanation/glossary';
import { describePalaceContext, palaceTheme } from '@/domains/ziwei/interpretation/knowledge';
import type {
  AstrologyChartView,
  BaziChartView,
  LiuyaoChartView,
  ZiweiChartView,
} from '@/types/charts';
import type { BaziDayBoundary, BaziSolarTimeModel } from '@/domains/bazi/types';
import type { BirthProfile, DivinationModule, Gender } from '@/types/domain';
import { castThreeCoins, lineFactsFromCoinValue, LIUYAO_CASTING_RULE_VERSION, type LiuyaoCoinValue } from '@/domains/liuyao/casting';

const moduleIntro: Record<DivinationModule, { step: string; action: string }> = {
  bazi: { step: '四柱落盘', action: '排出四柱' },
  liuyao: { step: '铜钱成卦', action: '起一卦' },
  ziwei: { step: '十二宫启盘', action: '开启命盘' },
  astrology: { step: '黄道校准', action: '生成星盘' },
};

interface ModuleWorkspaceProps {
  slug: DivinationModule;
}

export function ModuleWorkspace({ slug }: ModuleWorkspaceProps) {
  const module = moduleBySlug[slug];
  const { selectedProfile } = useApp();
  return (
    <ModuleScaffold module={module}>
      {!selectedProfile ? <NoProfile /> : (
        <>
          <ProfileBanner module={module} profile={selectedProfile} />
          {slug === 'bazi' && <BaziWorkspace key={selectedProfile.id} profile={selectedProfile} />}
          {slug === 'liuyao' && <LiuyaoWorkspace key={selectedProfile.id} profile={selectedProfile} />}
          {slug === 'ziwei' && <ZiweiWorkspace key={selectedProfile.id} profile={selectedProfile} />}
          {slug === 'astrology' && <AstrologyWorkspace key={selectedProfile.id} profile={selectedProfile} />}
        </>
      )}
    </ModuleScaffold>
  );
}

function ModuleScaffold({ module, children }: { module: ModuleDefinition; children: React.ReactNode }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const desktop = width >= 860;
  return (
    <SafeAreaView style={styles.safeArea}>
      <Atmosphere accent={module.accent} focus="center" />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.container, desktop && styles.containerDesktop]}>
          <Pressable
            accessibilityLabel="返回观象首页"
            accessibilityRole="button"
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/home');
            }}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <MaterialCommunityIcons accessibilityElementsHidden color={palette.brass} importantForAccessibility="no-hide-descendants" name="arrow-left" size={18} />
            <Text style={styles.backText}>返回观象</Text>
          </Pressable>

          <AnimatedReveal>
            <View style={[styles.moduleHero, desktop && styles.moduleHeroDesktop]}>
              <View style={styles.heroSigil}>
                <ModuleSigil accent={module.accent} module={module.slug} size={desktop ? 150 : 118} />
              </View>
              <View style={styles.heroCopy}>
                <Text style={[styles.heroKicker, { color: module.accent }]}>{module.classicalName} · {moduleIntro[module.slug].step}</Text>
                <Text accessibilityRole="header" style={[styles.heroTitle, desktop && styles.heroTitleDesktop]}>{module.title}</Text>
                <Text style={styles.heroDescription}>{module.description}</Text>
                <View style={styles.localBadge}>
                  <MaterialCommunityIcons accessibilityElementsHidden color={palette.patina} importantForAccessibility="no-hide-descendants" name="cellphone-lock" size={15} />
                  <Text style={styles.localBadgeText}>本机计算 · 不调用 AI · 自动保存记录</Text>
                </View>
              </View>
            </View>
          </AnimatedReveal>
          {children}
        </View>
      </ScrollView>
      <BottomDock />
    </SafeAreaView>
  );
}

function NoProfile() {
  const router = useRouter();
  return (
    <StatePanel
      actionLabel="建立命主"
      body="出生资料只保存在当前设备。六爻记录也会归档到所选命主，方便之后反馈复盘。"
      onAction={() => router.push('/profiles')}
      state="empty"
      testID="module-empty-profile"
      title="先建立一位命主"
    />
  );
}

function ProfileBanner({ module, profile }: { module: ModuleDefinition; profile: BirthProfile }) {
  const router = useRouter();
  return (
    <AnimatedReveal delay={70}>
      <View style={styles.profileBanner}>
        <View style={[styles.profileSeal, { borderColor: module.accent }]}><Text style={[styles.profileSealText, { color: module.accent }]}>{profile.name.slice(0, 1)}</Text></View>
        <View style={styles.profileBannerCopy}>
          <Text style={styles.profileLabel}>当前命主</Text>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileMeta}>{profile.birthDate} · {profile.birthTime ?? '时辰未提供'} · {profile.birthCity}</Text>
        </View>
        <Pressable accessibilityLabel="切换命主" accessibilityRole="button" onPress={() => router.push('/profiles')} style={({ pressed }) => [styles.switchProfile, pressed && styles.pressed]}>
          <Text style={styles.switchProfileText}>切换</Text>
        </Pressable>
      </View>
    </AnimatedReveal>
  );
}

function GenderSelector({ value, onChange }: { value: Gender; onChange: (value: Gender) => void }) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>本次排盘性别</Text>
      <View accessibilityLabel="本次排盘性别" accessibilityRole="radiogroup" style={styles.segment}>
        {(['female', 'male'] as const).map((item) => (
          <Pressable
            accessibilityHint={value === item ? '当前选项' : '选择此选项'}
            accessibilityLabel={item === 'female' ? '女' : '男'}
            accessibilityRole="radio"
            accessibilityState={{ selected: value === item }}
            key={item}
            onPress={() => onChange(item)}
            style={[styles.segmentItem, value === item && styles.segmentItemActive]}>
            <Text style={[styles.segmentText, value === item && styles.segmentTextActive]}>{item === 'female' ? '女' : '男'}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.fieldHint}>旧命主没有保存该字段时，仅用于本次排盘，不会自动改写资料。</Text>
    </View>
  );
}

function BaziDayBoundarySelector({ value, onChange }: { value: BaziDayBoundary; onChange: (value: BaziDayBoundary) => void }) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>日界线规则</Text>
      <View accessibilityLabel="日界线规则" accessibilityRole="radiogroup" style={styles.segment}>
        {([
          ['midnight', '午夜换日'],
          ['ziEarly', '子初换日'],
        ] as const).map(([item, label]) => (
          <Pressable
            accessibilityHint={value === item ? '当前选项' : '选择此换日规则'}
            accessibilityLabel={label}
            accessibilityRole="radio"
            accessibilityState={{ selected: value === item }}
            key={item}
            onPress={() => onChange(item)}
            style={[styles.segmentItem, value === item && styles.segmentItemActive]}>
            <Text style={[styles.segmentText, value === item && styles.segmentTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.fieldHint}>
        午夜换日从 00:00 起切换；子初换日从 23:00 起按次日柱与次日时柱计算。切换规则会改变日柱、时柱，并写入本次命盘快照。
      </Text>
    </View>
  );
}

function BaziTrueSolarSelector({
  enabled,
  model,
  onEnabledChange,
  onModelChange,
  locationKnown,
}: {
  enabled: boolean;
  model: BaziSolarTimeModel;
  onEnabledChange: (value: boolean) => void;
  onModelChange: (value: BaziSolarTimeModel) => void;
  locationKnown: boolean;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>真太阳时修正</Text>
      <View accessibilityLabel="真太阳时修正" accessibilityRole="radiogroup" style={styles.segment}>
        {([['off', '关闭'], ['on', '启用']] as const).map(([item, label]) => (
          <Pressable
            accessibilityHint={enabled === (item === 'on') ? '当前选项' : '选择此修正状态'}
            accessibilityLabel={`真太阳时${label}`}
            accessibilityRole="radio"
            accessibilityState={{ selected: enabled === (item === 'on') }}
            key={item}
            onPress={() => onEnabledChange(item === 'on')}
            style={[styles.segmentItem, enabled === (item === 'on') && styles.segmentItemActive]}>
            <Text style={[styles.segmentText, enabled === (item === 'on') && styles.segmentTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {enabled && (
        <View accessibilityLabel="真太阳时模型" accessibilityRole="radiogroup" style={styles.chipRow}>
          {([
            ['localMeanSolarTime', '地方平太阳时'],
            ['apparentSolarTime', '视太阳时'],
          ] as const).map(([item, label]) => (
            <Pressable accessibilityHint={model === item ? '当前选项' : '选择此模型'} accessibilityLabel={label} accessibilityRole="radio" accessibilityState={{ selected: model === item }} key={item} onPress={() => onModelChange(item)} style={[styles.choiceChip, model === item && styles.choiceChipActive]}>
              <Text style={[styles.choiceChipText, model === item && styles.choiceChipTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <Text style={styles.fieldHint}>
        {enabled
          ? (locationKnown ? '按出生地经度计算；本次修正模型、经度与有效时刻会写入快照。' : '当前命主没有可确认的出生地经度，启用后会拒绝计算，不会猜测坐标。')
          : '关闭时使用 Asia/Shanghai 民用时；不会自动套用设备时区或经度修正。'}
      </Text>
    </View>
  );
}

function WorkspacePanel({ children }: { children: React.ReactNode }) {
  return <AnimatedReveal delay={120} style={styles.workspacePanel}>{children}</AnimatedReveal>;
}

function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  if (!message) return null;
  return (
    <StatePanel
      body={message}
      onAction={onRetry}
      state="failure"
      testID="module-failure"
      title="这次没有完成"
    />
  );
}

function SavedNotice({ saved }: { saved: boolean }) {
  if (!saved) return null;
  return <View accessibilityLabel="本次结果已保存到本地记录" accessibilityLiveRegion="polite" accessibilityRole="text" style={styles.savedNotice}><MaterialCommunityIcons accessibilityElementsHidden color={palette.patina} importantForAccessibility="no-hide-descendants" name="check-circle-outline" size={17} /><Text style={styles.savedText}>本次结果已保存到本地记录</Text></View>;
}

function SaveStateNotice({ state, onRetry }: { state: 'idle' | 'saved' | 'failed'; onRetry: () => void }) {
  if (state === 'saved') return <SavedNotice saved />;
  if (state !== 'failed') return null;
  return (
    <StatePanel
      body="排盘已经完成，但本地保存失败。重试会保存同一份原卦，不会重新起卦或覆盖历史记录。"
      onAction={onRetry}
      state="failure"
      testID="reading-save-failed"
      title="结果未保存"
      actionLabel="重试保存原卦"
    />
  );
}

function Caveats({ items }: { items: string[] }) {
  return (
    <View style={styles.caveatBox}>
      <Text style={styles.caveatTitle}>解读边界</Text>
      {items.map((item) => <Text key={item} style={styles.caveatText}>· {item}</Text>)}
    </View>
  );
}

function BaziEvidencePanel({ result }: { result: BaziChartView }) {
  const [expanded, setExpanded] = useState(false);
  const evidence = result.calculationEvidence;
  const conversion = evidence.calendarConversion;
  const location = evidence.locationUsed;
  const trueSolarDisplay = buildBaziTrueSolarEvidenceDisplay(result.calculationSettings, evidence);
  const row = (label: string, value: string) => (
    <View key={label} style={styles.evidenceDetailRow}>
      <Text style={styles.evidenceDetailLabel}>{label}</Text>
      <Text style={styles.evidenceDetailValue}>{value}</Text>
    </View>
  );
  return (
    <View style={styles.evidencePanel}>
      <Pressable
        accessibilityLabel={expanded ? '收起本次八字计算依据' : '展开本次八字计算依据'}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((current) => !current)}
        style={({ pressed }) => [styles.evidencePanelHeader, pressed && styles.pressed]}>
        <View>
          <Text style={styles.evidencePanelKicker}>CALCULATION EVIDENCE</Text>
          <Text style={styles.evidencePanelTitle}>本次计算依据</Text>
        </View>
        <Text style={styles.evidencePanelAction}>{expanded ? '收起' : '展开'}</Text>
      </Pressable>
      {expanded && (
        <View style={styles.evidenceDetails}>
          {row('输入历法', evidence.sourceCalendar === 'lunar' ? '农历' : '公历')}
          {trueSolarDisplay.rows.map(([label, value]) => row(label, value))}
          {row('业务时区', evidence.timezone)}
          {row('日界规则', evidence.dayBoundaryRule === 'ziEarly' ? '子初换日（23:00）' : '午夜换日（00:00）')}
          {row('历法换算', conversion.note)}
          {row('换算数据', `${conversion.dataSource}@${conversion.dataVersion} · ${conversion.resolverVersion}`)}
          {row('节气依据', evidence.solarTermBoundary.currentMonthBasis ?? evidence.solarTermBoundary.note)}
          {row('出生地', location
            ? `${location.name}${location.province ? ` · ${location.province}` : ''} · ${location.latitude}, ${location.longitude} · ${location.datasetVersion}`
            : '未命中离线城市表，未声明坐标精度')}
          {trueSolarDisplay.conflictMessage && row('一致性提示', trueSolarDisplay.conflictMessage)}
          {evidence.warnings.length > 0 && row('提示', evidence.warnings.join('；'))}
        </View>
      )}
    </View>
  );
}

function formatEvidenceFacts(facts: Record<string, unknown>): string {
  return Object.entries(facts)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${Array.isArray(value) ? value.join('、') : String(value)}`)
    .join(' · ');
}

function BaziInterpretationExplorer({ result }: { result: BaziChartView }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rawEvidenceId, setRawEvidenceId] = useState<string | null>(null);
  const evidenceById = new Map(result.evidenceGraph.nodes.map((node) => [node.id, node]));
  const confidenceLabel = { high: '高置信', medium: '中置信', low: '低置信' } as const;
  return (
    <View style={styles.interpretationExplorer}>
      <View style={styles.interpretationHeading}>
        <View>
          <Text style={styles.resultSectionKicker}>INTERPRETATION LAYERS</Text>
          <Text style={styles.interpretationTitle}>深度判断</Text>
        </View>
        <Text style={styles.interpretationVersion}>{result.interpretation.interpretationVersion}</Text>
      </View>
      <View style={styles.strengthOverview}>
        <View style={styles.strengthStatusSeal}>
          <Text style={styles.strengthStatusText}>
            {result.strengthAssessment.status === 'strong' ? '偏强' : result.strengthAssessment.status === 'weak' ? '偏弱' : result.strengthAssessment.status === 'conflict' ? '冲突' : result.strengthAssessment.status === 'balanced' ? '平衡' : '待定'}
          </Text>
          <Text style={styles.strengthConfidence}>{confidenceLabel[result.strengthAssessment.confidence]}</Text>
        </View>
        <View style={styles.strengthOverviewCopy}>
          <Text style={styles.strengthOverviewTitle}>先看结论，再查看依据</Text>
          <Text style={styles.strengthOverviewText}>{result.interpretation.results[0]?.conclusion}</Text>
        </View>
      </View>
      {!!result.interpretation.structureTags.length && (
        <View style={styles.structureTagRow}>
          {result.interpretation.structureTags.map((tag) => <Text key={tag.id} style={styles.structureTag}>{tag.label}</Text>)}
        </View>
      )}
      <View style={styles.interpretationList}>
        {result.interpretation.results.map((item) => {
          const expanded = expandedId === item.id;
          const refs = [...item.evidenceRefs, ...item.counterEvidenceRefs.filter((ref) => !item.evidenceRefs.includes(ref))];
          return (
            <View key={item.id} style={styles.interpretationCard}>
              <Pressable
                accessibilityLabel={`${expanded ? '收起' : '展开'}${item.title}判断依据`}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={() => setExpandedId((current) => current === item.id ? null : item.id)}
                style={({ pressed }) => [styles.interpretationCardHeader, pressed && styles.pressed]}>
                <View style={styles.interpretationCardCopy}>
                  <View style={styles.interpretationCardTitleRow}><Text style={styles.interpretationCardTitle}>{item.title}</Text><Text style={styles.confidenceChip}>{confidenceLabel[item.confidence]}</Text></View>
                  <Text style={styles.interpretationConclusion}>{item.conclusion}</Text>
                </View>
                <Text style={styles.interpretationToggle}>{expanded ? '收起' : '查看依据'}</Text>
              </Pressable>
              {expanded && (
                <View style={styles.interpretationEvidenceList}>
                  {refs.length === 0 && <Text style={styles.emptyEvidenceText}>本条没有可展开的证据节点。</Text>}
                  {refs.map((ref) => {
                    const node = evidenceById.get(ref);
                    if (!node) return null;
                    const isCounter = item.counterEvidenceRefs.includes(ref);
                    const rawOpen = rawEvidenceId === ref;
                    return (
                      <View key={ref} style={styles.evidenceReference}>
                        <View style={styles.evidenceReferenceHeader}>
                          <Text style={[styles.evidenceReferenceType, isCounter && styles.evidenceReferenceCounter]}>{isCounter ? '反证' : '依据'}</Text>
                          <Text style={styles.evidenceReferenceLabel}>{node.label}</Text>
                          <Pressable accessibilityLabel={`${rawOpen ? '收起' : '展开'}证据${ref}`} accessibilityRole="button" onPress={() => setRawEvidenceId((current) => current === ref ? null : ref)} style={({ pressed }) => [styles.evidenceReferenceAction, pressed && styles.pressed]}>
                            <Text style={styles.evidenceReferenceActionText}>{rawOpen ? '收起' : '原始证据'}</Text>
                          </Pressable>
                        </View>
                        {rawOpen && <View style={styles.rawEvidence}><Text style={styles.rawEvidenceId}>{ref}</Text><Text style={styles.rawEvidenceFacts}>{formatEvidenceFacts(node.facts)}</Text><Text style={styles.rawEvidenceRule}>规则 {node.ruleVersion} · 来源 {node.source}</Text></View>}
                      </View>
                    );
                  })}
                  {item.caveats.map((caveat) => <Text key={caveat} style={styles.interpretationCaveat}>提示：{caveat}</Text>)}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function FocusList({ items }: { items: string[] }) {
  return (
    <View style={styles.focusList}>
      <Text style={styles.resultSectionTitle}>基础观察</Text>
      {items.map((item, index) => (
        <AnimatedReveal delay={120 + index * 70} key={item} style={styles.focusRow}>
          <Text style={styles.focusIndex}>{String(index + 1).padStart(2, '0')}</Text>
          <Text style={styles.focusText}>{item}</Text>
        </AnimatedReveal>
      ))}
    </View>
  );
}

function BaziWorkspace({ profile }: { profile: BirthProfile }) {
  const { saveReading } = useApp();
  const [gender, setGender] = useState<Gender>(profile.gender ?? 'female');
  const [dayBoundary, setDayBoundary] = useState<BaziDayBoundary>('midnight');
  const [trueSolarTime, setTrueSolarTime] = useState(false);
  const [solarTimeModel, setSolarTimeModel] = useState<BaziSolarTimeModel>('apparentSolarTime');
  const [result, setResult] = useState<BaziChartView | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'failed'>('idle');
  const [inputChanged, setInputChanged] = useState(false);
  const [liunianText, setLiunianText] = useState('');
  const liunianYear = /^\d{4}$/.test(liunianText.trim()) ? Number(liunianText.trim()) : undefined;
  const run = async () => {
    setBusy(true);
    try {
      setError('');
      setSaveState('idle');
      const next = calculateBaziView(profile, gender, { bazi: { dayBoundary, trueSolarTime, solarTimeModel: trueSolarTime ? solarTimeModel : 'none', ...(liunianYear !== undefined ? { liunianYear } : {}) } });
      setResult(next);
      setInputChanged(false);
      try {
        await saveReading({ profile, payload: next, title: `${next.dayMaster}日主 · 四柱命盘`, summary: next.focus[0] });
        setSaveState('saved');
      } catch {
        setSaveState('failed');
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '排盘失败，请检查出生资料。');
    } finally {
      setBusy(false);
    }
  };
  const retrySave = async () => {
    if (!result) return;
    setBusy(true);
    try {
      await saveReading({ profile, payload: result, title: `${result.dayMaster}日主 · 四柱命盘`, summary: result.focus[0] });
      setSaveState('saved');
      setError('');
    } catch {
      setSaveState('failed');
    } finally {
      setBusy(false);
    }
  };
  return (
    <WorkspacePanel>
      <View style={styles.workspaceHeading}><View><Text style={styles.workspaceKicker}>PILLAR CALIBRATION</Text><Text style={styles.workspaceTitle}>让四柱依次落位</Text></View><Text style={styles.workspaceMeta}>年 · 月 · 日 · 时</Text></View>
      {!profile.gender && <GenderSelector onChange={(value) => { setGender(value); if (result) setInputChanged(true); }} value={gender} />}
      {!profile.timeKnown && <StatePanel body="当前命主未提供出生时辰。八字将提供年、月、日三柱部分盘：时柱不补造，大运与流年对照需要准确时辰。" state="partial" testID="bazi-partial-mode" title="未知时辰 · 部分盘" />}
      <BaziDayBoundarySelector onChange={(value) => { setDayBoundary(value); if (result) setInputChanged(true); }} value={dayBoundary} />
      <BaziTrueSolarSelector enabled={trueSolarTime} locationKnown={profile.longitude != null} model={solarTimeModel} onEnabledChange={(value) => { setTrueSolarTime(value); if (result) setInputChanged(true); }} onModelChange={(value) => { setSolarTimeModel(value); if (result) setInputChanged(true); }} />
      {profile.timeKnown && <View><Text style={styles.fieldLabel}>流年对照年份（选填）</Text>
      <TextInput
        accessibilityLabel="流年对照年份"
        keyboardType="numbers-and-punctuation"
        onChangeText={(value) => { setLiunianText(value); if (result) setInputChanged(true); }}
        placeholder="例如 2024；留空则只排大运"
        placeholderTextColor="#65736D"
        style={styles.textInput}
        value={liunianText}
      /></View>}
      <Text style={styles.workspaceDescription}>{profile.timeKnown ? '以保存的历法、日期与时辰排出天干地支、十神、藏干、纳音及柱间关系。' : '部分盘只排出年、月、日三柱与已支持的结构证据；补充时辰后可得到完整四柱与大运对照。'}</Text>
      <ErrorNotice message={error} onRetry={run} />
      {inputChanged && <StatePanel body="输入已变化；当前结果仍是上一次输入的快照，请重新排盘后再保存。" state="partial" testID="reading-input-stale" title="结果需要重新计算" />}
      <ActionButton accessibilityLabel="排出八字四柱" loading={busy} onPress={run}>{result ? '重新排盘' : '排出四柱'}</ActionButton>
      {result && <BaziResult key={result.generatedAt} result={result} />}
      <SaveStateNotice onRetry={retrySave} state={saveState} />
    </WorkspacePanel>
  );
}

function BaziResult({ result }: { result: BaziChartView }) {
  const trueSolarDisplay = buildBaziTrueSolarEvidenceDisplay(result.calculationSettings, result.calculationEvidence);
  return (
      <View style={styles.resultArea}>
      <View style={styles.resultHeading}><View><Text style={styles.resultEyebrow}>四柱命盘{result.completeness === 'partial' ? ' · 部分盘' : ''}</Text><Text style={styles.resultTitle}>{result.dayMaster}日主</Text></View><Text style={styles.engineTag}>{result.engineVersion}</Text></View>
      <ChartReportPanel report={result.report} />
      <View style={styles.pillarGrid}>
        {result.pillars.map((pillar, index) => (
          <AnimatedReveal delay={index * 90} key={pillar.key} style={styles.pillarCard}>
            <Text style={styles.pillarLabel}>{pillar.label}</Text>
            <Text style={styles.pillarStem}>{pillar.stem}</Text>
            <View style={styles.pillarDivider} />
            <Text style={styles.pillarBranch}>{pillar.branch}</Text>
            <Text style={styles.pillarTenGod}>{pillar.tenGod ?? '日主'}</Text>
            <Text style={styles.pillarDetail}>{pillar.hiddenStems.join('  ')}</Text>
            <Text style={styles.pillarDetail}>{pillar.naYin}</Text>
          </AnimatedReveal>
        ))}
      </View>
      <ChartRenderer payload={result} compact />
      <View style={styles.evidenceStrip}><Text style={styles.evidenceLabel}>旬空</Text><Text style={styles.evidenceValue}>{result.kongWang}</Text></View>
      <View style={styles.evidenceStrip}>
        <Text style={styles.evidenceLabel}>月柱依据</Text>
        <Text style={styles.evidenceValue}>{result.calculationEvidence.solarTermBoundary.currentMonthBasis ?? result.calculationEvidence.solarTermBoundary.note}</Text>
      </View>
      <View style={styles.evidenceStrip}>
        <Text style={styles.evidenceLabel}>日界线</Text>
        <Text style={styles.evidenceValue}>{result.calculationEvidence.dayBoundaryRule} · {result.calculationEvidence.effectiveCalculationTime ?? '历史记录未保存有效计算时刻'}</Text>
      </View>
      <View style={styles.evidenceStrip}>
        <Text style={styles.evidenceLabel}>真太阳时</Text>
        <Text style={styles.evidenceValue}>{trueSolarDisplay.summary}</Text>
      </View>
      {result.partialChart && (
        <View style={styles.dayunPanel} testID="bazi-partial-panel">
          <Text style={styles.resultSectionTitle}>部分盘范围与候选</Text>
          <Text style={styles.factorValue}>{result.partialChart.basis}</Text>
          <Text style={styles.factorValue}>计算锚点：{result.partialChart.anchor}；缺失柱：{result.partialChart.missingPillars.map((key) => ({ year: '年柱', month: '月柱', day: '日柱', hour: '时柱' }[key])).join('、')}</Text>
          {result.partialChart.candidates.map((candidate) => (
            <Text key={candidate.pillar} style={styles.factorValue}>{candidate.label}候选：{candidate.options.map((option) => `${option.ganZhi}（${option.basis}）`).join('；')}</Text>
          ))}
          {result.partialChart.candidates.length === 0 && <Text style={styles.factorValue}>年月日柱在日内锚点变化下保持稳定，无候选分歧。</Text>}
        </View>
      )}
      {result.timeLayer && (
        <View style={styles.dayunPanel} testID="bazi-time-layer">
          <Text style={styles.resultSectionTitle}>大运 · {result.timeLayer.directionLabel}</Text>
          <Text style={styles.factorValue}>起运 {result.timeLayer.qiYun.years}年{result.timeLayer.qiYun.months}月{result.timeLayer.qiYun.days}日（{result.timeLayer.qiYun.date}）· 依据节气 {result.timeLayer.qiYun.anchorTerm}（{result.timeLayer.qiYun.anchorTermTime}）</Text>
          <Text style={styles.factorValue}>{result.timeLayer.ageConvention}</Text>
          <View style={styles.dayunGrid}>
            {result.timeLayer.dayuns.map((entry) => (
              <View key={entry.index} style={styles.dayunCell}>
                <Text style={styles.dayunGanZhi}>{entry.ganZhi}</Text>
                <Text style={styles.dayunMeta}>{entry.startAge}-{entry.endAge}岁</Text>
                <Text style={styles.dayunMeta}>{entry.startDate}起</Text>
              </View>
            ))}
          </View>
          {result.timeLayer.liunian && (
            <View style={styles.dayunLiunian}>
              <Text style={styles.dayunLiunianTitle}>流年 {result.timeLayer.liunian.year} · {result.timeLayer.liunian.yearGanZhi}</Text>
              <Text style={styles.factorValue}>流年天干十神：{result.timeLayer.liunian.yearStemTenGod}{result.timeLayer.liunian.coveredByDayun ? ` · 第${result.timeLayer.liunian.coveredByDayun.index}运（${result.timeLayer.liunian.coveredByDayun.ganZhi}）覆盖` : ` · ${result.timeLayer.liunian.coverageNote ?? '不在大运覆盖范围内'}`}</Text>
              {result.timeLayer.liunian.branchRelations.length > 0 && <Text style={styles.factorValue}>与原局地支：{result.timeLayer.liunian.branchRelations.map((item) => `${item.targetPillar}${item.targetBranch}${item.kind}`).join('、')}</Text>}
              {result.timeLayer.liunian.branchRelations.length === 0 && <Text style={styles.factorValue}>与原局地支未检出已支持的六合/六冲关系。</Text>}
            </View>
          )}
          {result.timeLayer.caveats.map((caveat) => <Text key={caveat} style={styles.interpretationCaveat}>提示：{caveat}</Text>)}
        </View>
      )}
      <ExplanationLayer evidenceNodes={result.evidenceGraph.nodes} glossaryTerms={listGlossaryTerms('bazi')} snapshot={result.explanation} />
      <BaziInterpretationExplorer result={result} />
      <BaziEvidencePanel result={result} />
      {!!result.relations.length && <View style={styles.tagWrap}>{result.relations.map((item, index) => <Text key={`${item}-${index}`} style={styles.evidenceTag}>{item}</Text>)}</View>}
      <FocusList items={result.focus} />
      <Caveats items={result.caveats} />
    </View>
  );
}

const liuyaoTargets = ['父母', '官鬼', '妻财', '子孙', '兄弟'] as const;
type LiuyaoManualLine = { position: number; yinYang: '阴' | '阳'; isChanging: boolean; value: LiuyaoCoinValue };

function manualCoinValue(yinYang: '阴' | '阳', isChanging: boolean): LiuyaoCoinValue {
  if (yinYang === '阳') return isChanging ? 9 : 7;
  return isChanging ? 6 : 8;
}

function LiuyaoWorkspace({ profile }: { profile: BirthProfile }) {
  const { saveReading } = useApp();
  const [question, setQuestion] = useState('');
  const [target, setTarget] = useState<(typeof liuyaoTargets)[number]>('父母');
  const [castingMode, setCastingMode] = useState<'auto' | 'interactive' | 'manual'>('auto');
  const [manualYaos, setManualYaos] = useState<LiuyaoManualLine[]>([]);
  const [result, setResult] = useState<LiuyaoChartView | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'failed'>('idle');
  const [inputChanged, setInputChanged] = useState(false);
  const [error, setError] = useState('');
  const manualYaosRef = useRef<LiuyaoManualLine[]>([]);
  const castingBusyRef = useRef(false);
  const [castingBusy, setCastingBusy] = useState(false);
  const commitManualYaos = (next: LiuyaoManualLine[]) => {
    manualYaosRef.current = next;
    setManualYaos(next);
  };
  const castInteractiveLine = () => {
    if (castingBusyRef.current || manualYaosRef.current.length >= 6) return;
    castingBusyRef.current = true;
    setCastingBusy(true);
    const thrown = castThreeCoins();
    const current = manualYaosRef.current;
    if (current.length >= 6) {
      castingBusyRef.current = false;
      setCastingBusy(false);
      return;
    }
    const nextLine: LiuyaoManualLine = {
      position: current.length + 1,
      ...lineFactsFromCoinValue(thrown.value),
    };
    commitManualYaos([...current, nextLine]);
    setInputChanged(true);
    castingBusyRef.current = false;
    setCastingBusy(false);
  };
  const toggleManualLine = (position: number) => {
    const current = manualYaosRef.current;
    const existing = current.find((line) => line.position === position);
    const next = !existing
      ? [...current, { position, yinYang: '阳' as const, isChanging: false, value: 7 as const }].sort((a, b) => a.position - b.position)
      : current.map((line) => line.position === position
        ? { ...line, yinYang: (line.yinYang === '阳' ? '阴' : '阳') as '阴' | '阳', value: manualCoinValue(line.yinYang === '阳' ? '阴' : '阳', line.isChanging) }
        : line);
    commitManualYaos(next);
    setInputChanged(true);
  };
  const toggleManualChange = (position: number) => {
    const current = manualYaosRef.current;
    const existing = current.find((line) => line.position === position);
    const next = !existing
      ? [...current, { position, yinYang: '阳' as const, isChanging: true, value: 9 as const }].sort((a, b) => a.position - b.position)
      : current.map((line) => line.position === position
        ? { ...line, isChanging: !line.isChanging, value: manualCoinValue(line.yinYang, !line.isChanging) }
        : line);
    commitManualYaos(next);
    setInputChanged(true);
  };
  const run = async () => {
    if (question.trim().length < 4) return setError('请写下一个具体问题，至少 4 个字。');
    if ((castingMode === 'interactive' || castingMode === 'manual') && manualYaos.length !== 6) return setError('请先完成六条爻，再生成这份原卦。');
    setLoading(true);
    setError('');
    setSaveState('idle');
    try {
      const next = await calculateLiuyaoView(question.trim(), target, {
        liuyao: {
          method: castingMode,
          ...(manualYaos.length ? { manualYaos } : {}),
        },
      });
      setResult(next);
      setInputChanged(false);
      try {
        await saveReading({ profile, payload: next, title: `${next.hexagramName}${next.changedHexagramName ? ` → ${next.changedHexagramName}` : ''}`, summary: next.question });
        setSaveState('saved');
      } catch {
        setSaveState('failed');
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '起卦失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };
  const retrySave = async () => {
    if (!result) return;
    setLoading(true);
    try {
      await saveReading({ profile, payload: result, title: `${result.hexagramName}${result.changedHexagramName ? ` → ${result.changedHexagramName}` : ''}`, summary: result.question });
      setSaveState('saved');
      setError('');
    } catch {
      setSaveState('failed');
    } finally {
      setLoading(false);
    }
  };
  return (
    <WorkspacePanel>
      <View style={styles.coinHeading}>
        <View><Text style={styles.workspaceKicker}>SIX-LINE CASTING</Text><Text style={styles.workspaceTitle}>一事一问，六次成爻</Text></View>
        <View style={styles.coinRow}>{[0, 1, 2].map((item) => <View key={item} style={styles.coin}><View style={styles.coinHole} /></View>)}</View>
      </View>
      <Text style={styles.fieldLabel}>你想问的具体事情</Text>
      <TextInput
        accessibilityLabel="六爻占问问题"
        multiline
        onChangeText={(value) => { setQuestion(value); if (result) setInputChanged(true); }}
        placeholder="例如：这次工作机会是否值得继续推进？"
        placeholderTextColor="#65736D"
        style={[styles.textInput, styles.questionInput]}
        value={question}
      />
      <Text style={styles.fieldLabel}>起卦方式</Text>
      <View accessibilityLabel="六爻起卦方式" accessibilityRole="radiogroup" style={styles.chipRow}>
        {([['auto', '快捷自动'], ['interactive', '六次投掷'], ['manual', '手工录入']] as const).map(([value, label]) => (
          <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: castingMode === value }} onPress={() => { setCastingMode(value); commitManualYaos([]); if (result) setInputChanged(true); }} style={[styles.choiceChip, castingMode === value && styles.choiceChipActive]}>
            <Text style={[styles.choiceChipText, castingMode === value && styles.choiceChipTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {castingMode === 'interactive' && <View style={styles.interactiveCast}><Text style={styles.fieldHint}>三枚铜钱法（规则 {LIUYAO_CASTING_RULE_VERSION}）：每条独立投掷三枚，记录 6/7/8/9 点；未完成六次前不会生成原卦。当前页面中断不会伪造“已完成”，请从下一次投掷继续或重新开始。</Text><ActionButton accessibilityLabel="投掷下一爻" disabled={manualYaos.length >= 6 || castingBusy} onPress={castInteractiveLine}>投掷第 {manualYaos.length + 1} 爻</ActionButton>{manualYaos.map((line) => <Text key={line.position} style={styles.fieldHint}>{line.position}爻：{line.value}点 · {line.yinYang} · {line.isChanging ? '动' : '静'}</Text>)}</View>}
      {castingMode === 'manual' && <View style={styles.manualLines}><Text style={styles.fieldHint}>点击左侧切换阴/阳，右侧切换动/静；每条会同步记录 6/7/8/9 点，生成后可在盘面逐条核对。</Text>{[1, 2, 3, 4, 5, 6].map((position) => { const line = manualYaos.find((item) => item.position === position); return <View key={position} style={styles.manualLine}><Pressable accessibilityLabel={`切换${position}爻阴阳`} accessibilityRole="button" onPress={() => toggleManualLine(position)} style={styles.manualLineMain}><Text style={styles.yaoPosition}>{position}爻</Text><Text style={styles.yaoPrimary}>{line ? `${line.value}点 · ${line.yinYang}` : '待录入'}</Text></Pressable><Pressable accessibilityLabel={`切换${position}爻动静`} accessibilityRole="button" onPress={() => toggleManualChange(position)} style={styles.manualChange}><Text style={styles.yaoSecondary}>{line ? (line.isChanging ? '动爻' : '静爻') : '动/静'}</Text></Pressable></View>; })}</View>}
       <Text style={styles.fieldLabel}>用神方向</Text>
       <View accessibilityLabel="六爻用神方向" accessibilityRole="radiogroup" style={styles.chipRow}>{liuyaoTargets.map((item) => <Pressable accessibilityHint={target === item ? '当前选项' : '选择此用神方向'} accessibilityLabel={item} accessibilityRole="radio" accessibilityState={{ selected: target === item }} key={item} onPress={() => { setTarget(item); if (result) setInputChanged(true); }} style={[styles.choiceChip, target === item && styles.choiceChipActive]}><Text style={[styles.choiceChipText, target === item && styles.choiceChipTextActive]}>{item}</Text></Pressable>)}</View>
      <Text style={styles.fieldHint}>不确定时可先选“父母”用于文书、方案与信息；起卦后仍应在复盘中核对取用。</Text>
      <ErrorNotice message={error} onRetry={run} />
      {inputChanged && <StatePanel body="问题、用神或起卦事实已变化；当前结果仅对应上一次输入。" state="partial" testID="reading-input-stale" title="当前结果需要重新起卦" />}
      {loading && <Text accessibilityLiveRegion="polite" accessibilityRole="text" style={styles.loadingText}>{UI_STATE_COPY.loading.announcement}</Text>}
      <ActionButton accessibilityLabel="摇动铜钱起六爻卦" loading={loading} onPress={run}>{result ? '重新起卦' : '摇钱成卦'}</ActionButton>
      {result && <LiuyaoResult key={result.generatedAt} result={result} />}
      <SaveStateNotice onRetry={retrySave} state={saveState} />
    </WorkspacePanel>
  );
}

function LiuyaoResult({ result }: { result: LiuyaoChartView }) {
  return (
    <View style={styles.resultArea}>
      <View style={styles.hexagramHeading}>
        <View><Text style={styles.resultEyebrow}>本卦</Text><Text style={styles.hexagramName}>{result.hexagramName}</Text><Text style={styles.hexagramMeta}>{result.hexagramGong}</Text></View>
        <MaterialCommunityIcons color={palette.hairlineStrong} name="arrow-right" size={24} />
        <View style={styles.changedHexagram}><Text style={styles.resultEyebrow}>变卦</Text><Text style={styles.hexagramName}>{result.changedHexagramName ?? '无变卦'}</Text></View>
      </View>
      <Text style={styles.questionEcho}>“{result.question}”</Text>
      <ChartReportPanel report={result.report} />
      <View style={styles.yaoResultStack}>
        {result.lines.map((line, index) => (
          <AnimatedReveal delay={index * 75} key={line.position} style={styles.yaoResultRow}>
            <Text style={styles.yaoPosition}>{line.position}</Text>
            <View style={styles.yaoMark}>
              {line.yinYang === '阳' ? <View style={styles.yangLine} /> : <View style={styles.yinLine}><View style={styles.yinHalf} /><View style={styles.yinHalf} /></View>}
            </View>
            <View style={styles.yaoChangeWrap}>{line.isChanging && <PulseDot color="#D8A05F" />}<Text style={styles.yaoChange}>{line.isChanging ? '动' : '静'}</Text></View>
            <View style={styles.yaoCopy}><Text style={styles.yaoPrimary}>{line.liuShen} · {line.liuQin} · {line.naJia}{line.wuXing}</Text><Text style={styles.yaoSecondary}>{line.isShiYao ? '世爻 · ' : line.isYingYao ? '应爻 · ' : ''}{line.strength ?? '状态待核'}{line.evidence.length ? ` · ${line.evidence.join('、')}` : ''}</Text></View>
          </AnimatedReveal>
        ))}
      </View>
      <ChartRenderer payload={result} compact />
      <View style={styles.timeEvidence}><Text style={styles.timeText}>{result.ganZhiTime}</Text><Text style={styles.timeText}>{result.kongWang}</Text></View>
      <ExplanationLayer
        snapshot={result.explanation}
        evidenceNodes={result.evidenceGraph.nodes}
        glossaryTerms={listGlossaryTerms('liuyao')}
      />
      <FocusList items={result.focus} />
      <Caveats items={result.caveats} />
    </View>
  );
}

function ZiweiWorkspace({ profile }: { profile: BirthProfile }) {
  const { saveReading } = useApp();
  const [gender, setGender] = useState<Gender>(profile.gender ?? 'female');
  const [result, setResult] = useState<ZiweiChartView | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'failed'>('idle');
  const [inputChanged, setInputChanged] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      setError('');
      setSaveState('idle');
      const next = calculateZiweiView(profile, gender);
      setResult(next);
      setInputChanged(false);
      try {
        await saveReading({ profile, payload: next, title: `${next.fiveElement} · 十二宫命盘`, summary: next.focus[0] });
        setSaveState('saved');
      } catch {
        setSaveState('failed');
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '排盘失败，请检查出生资料。');
    } finally {
      setBusy(false);
    }
  };
  const retrySave = async () => {
    if (!result) return;
    setBusy(true);
    try {
      await saveReading({ profile, payload: result, title: `${result.fiveElement} · 十二宫命盘`, summary: result.focus[0] });
      setSaveState('saved');
      setError('');
    } catch {
      setSaveState('failed');
    } finally {
      setBusy(false);
    }
  };
  return (
    <WorkspacePanel>
      <View style={styles.workspaceHeading}><View><Text style={styles.workspaceKicker}>TWELVE PALACES</Text><Text style={styles.workspaceTitle}>以命宫为轴，十二宫展开</Text></View><Text style={styles.workspaceMeta}>命 · 身 · 四化</Text></View>
      {!profile.gender && <GenderSelector onChange={(value) => { setGender(value); if (result) setInputChanged(true); }} value={gender} />}
      <Text style={styles.workspaceDescription}>依据出生年月日时安命身宫、主星辅星与生年四化。不同流派差异会随算法版本一同记录。</Text>
      <ErrorNotice message={error} onRetry={run} />
      {inputChanged && <StatePanel body="性别输入已变化；当前十二宫仍是上一次排盘的快照，请重新启盘。" state="partial" testID="reading-input-stale" title="命盘需要重新计算" />}
      <ActionButton accessibilityLabel="生成紫微斗数十二宫命盘" loading={busy} onPress={run}>{result ? '重新启盘' : '开启十二宫'}</ActionButton>
      {result && <ZiweiResult key={result.generatedAt} result={result} />}
      <SaveStateNotice onRetry={retrySave} state={saveState} />
    </WorkspacePanel>
  );
}

function ZiweiResult({ result }: { result: ZiweiChartView }) {
  const { width } = useWindowDimensions();
  const wide = width >= 740;
  const [selectedPalace, setSelectedPalace] = useState<string | null>(null);
  const selected = result.normalizedChart.palaces.find((palace) => palace.name === selectedPalace);
  const selectedOpposite = selected?.oppositePalaceRefId ? result.normalizedChart.palaces.find((palace) => palace.id === selected.oppositePalaceRefId) : undefined;
  const selectedTrines = selected?.trinePalaceRefIds.map((id) => result.normalizedChart.palaces.find((palace) => palace.id === id)?.name).filter((value): value is string => Boolean(value)) ?? [];
  return (
    <View style={styles.resultArea}>
      <View style={styles.ziweiSummary}>
        <View pointerEvents="none" style={styles.ambientAnchor}><AmbientRing size={148} /></View>
        <View><Text style={styles.resultEyebrow}>五行局</Text><Text style={styles.resultTitle}>{result.fiveElement}</Text></View>
        <View><Text style={styles.resultEyebrow}>命主 / 身主</Text><Text style={styles.ziweiMetaValue}>{result.lifeMasterStar} / {result.bodyMasterStar}</Text></View>
        <View><Text style={styles.resultEyebrow}>农历</Text><Text style={styles.ziweiMetaValue}>{result.lunarDate}</Text></View>
      </View>
      <ChartReportPanel report={result.report} />
      <ExplanationLayer
        snapshot={result.explanation}
        evidenceNodes={result.evidenceGraph.nodes}
        glossaryTerms={listGlossaryTerms('ziwei')}
      />
      <View style={styles.palaceBoard}>
        {result.palaces.map((palace, index) => (
          <AnimatedReveal delay={(index % 6) * 55} key={`${palace.name}-${palace.stemBranch}`} style={[styles.palaceCard, wide ? styles.palaceCardWide : styles.palaceCardNarrow]}>
            <Pressable
              accessibilityLabel={`查看${palace.name}及三方四正`}
              accessibilityRole="button"
              onPress={() => setSelectedPalace((current) => current === palace.name ? null : palace.name)}
              style={({ pressed }) => [styles.palacePressable, pressed && styles.pressed]}>
            <View style={styles.palaceTop}><Text style={styles.palaceName}>{palace.name}</Text><Text style={styles.palaceBranch}>{palace.stemBranch}{palace.isBodyPalace ? ' · 身' : ''}</Text></View>
            <Text style={styles.palaceStars}>{palace.stars.length ? palace.stars.join('  ') : '空宫'}</Text>
            <Text style={styles.palaceMinor}>{palace.minorStars.join(' · ') || '辅星从略'}</Text>
            <Text style={styles.palaceDecade}>{palace.decadalRange}</Text>
            </Pressable>
          </AnimatedReveal>
        ))}
      </View>
      <ChartRenderer payload={result} compact />
      {selected && (
        <AnimatedReveal key={selected.id} delay={0} distance={8}>
          <View style={[styles.selectedPalace, selected.id === result.normalizedChart.lifePalaceRefId && styles.selectedPalaceLife]}>
            <Text style={styles.resultSectionTitle}>{selected.name} · {palaceTheme(selected.name)}</Text>
            <Text style={styles.factorValue}>对宫：{selectedOpposite?.name ?? '未记录'} · 三方：{selectedTrines.join('、') || '未记录'}</Text>
            <Text style={styles.factorValue}>主星：{selected.majorStarRefs.map((id) => result.normalizedChart.stars.find((star) => star.id === id)?.name).filter((name): name is string => Boolean(name)).join('、') || '无主星（按流派可借对宫）'}</Text>
            {describePalaceContext(result.normalizedChart, selected.id).map((paragraph) => (
              <Text key={paragraph.slice(0, 24)} style={styles.palaceReading}>{paragraph}</Text>
            ))}
            <Text style={styles.interpretationCaveat}>提示：以上为星曜特质、化象倾向与宫位主题的结构组合，不同流派解读可能不同，不构成现实事件结论。</Text>
          </View>
        </AnimatedReveal>
      )}
      <View style={styles.mutagenRow}>{result.mutagens.map((item, index) => <Text key={`${item}-${index}`} style={styles.mutagenTag}>{item}</Text>)}</View>
      <FocusList items={result.focus} />
      <Caveats items={result.caveats} />
    </View>
  );
}

function AstrologyWorkspace({ profile }: { profile: BirthProfile }) {
  const { saveReading } = useApp();
  const [result, setResult] = useState<AstrologyChartView | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'failed'>('idle');
  const [inputChanged, setInputChanged] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      setError('');
      setSaveState('idle');
      const next = calculateAstrologyView(profile);
      setResult(next);
      setInputChanged(false);
      try {
        await saveReading({ profile, payload: next, title: `${next.sunSign} · 本命星盘`, summary: next.focus[0] });
        setSaveState('saved');
      } catch {
        setSaveState('failed');
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '星盘计算失败，请检查出生资料。');
    } finally {
      setBusy(false);
    }
  };
  const retrySave = async () => {
    if (!result) return;
    setBusy(true);
    try {
      await saveReading({ profile, payload: result, title: `${result.sunSign} · 本命星盘`, summary: result.focus[0] });
      setSaveState('saved');
      setError('');
    } catch {
      setSaveState('failed');
    } finally {
      setBusy(false);
    }
  };
  return (
    <WorkspacePanel>
      <View style={styles.workspaceHeading}><View><Text style={styles.workspaceKicker}>TROPICAL ZODIAC</Text><Text style={styles.workspaceTitle}>校准黄道、宫位与相位</Text></View><Text style={styles.workspaceMeta}>行星 · 宫位 · 相位</Text></View>
      <Text style={styles.workspaceDescription}>准确时刻用于判断宫位与上升。未提供时辰不会猜测；内置城市可本地匹配，未匹配时只生成近似盘，并明确隐藏上升与宫位。</Text>
      <ErrorNotice message={error} onRetry={run} />
      {inputChanged && <StatePanel body="当前命主资料已变化；星盘结果仍是上一次输入的快照，请重新校准。" state="partial" testID="reading-input-stale" title="星盘需要重新计算" />}
      <ActionButton accessibilityLabel="生成西方占星本命盘" loading={busy} onPress={run}>{result ? '重新校准' : '生成本命星盘'}</ActionButton>
      {result && <AstrologyResult key={result.generatedAt} result={result} />}
      <SaveStateNotice onRetry={retrySave} state={saveState} />
    </WorkspacePanel>
  );
}

const planetShort: Record<string, string> = { sun: '日', moon: '月', mercury: '水', venus: '金', mars: '火', jupiter: '木', saturn: '土', uranus: '天', neptune: '海', pluto: '冥', ascendant: '升', midheaven: '顶' };

function AstrologyResult({ result }: { result: AstrologyChartView }) {
  const { width } = useWindowDimensions();
  const wheelSize = Math.min(300, width - 76);
  const plotted = useMemo(() => result.factors.filter((factor) => factor.key !== 'midheaven').slice(0, 11), [result.factors]);
  const [showAllAspects, setShowAllAspects] = useState(false);
  const center = wheelSize / 2;
  const radius = wheelSize * 0.39;
  return (
    <View style={styles.resultArea}>
      <ChartReportPanel report={result.report} />
      <View style={styles.astroHero}>
        <View style={[styles.astroWheel, { width: wheelSize, height: wheelSize, borderRadius: wheelSize / 2 }]}>
          <View pointerEvents="none" style={styles.ambientAnchor}><AmbientRing size={Math.round(wheelSize * 0.82)} duration={32000} /></View>
          <View style={[styles.astroWheelMiddle, { borderRadius: wheelSize }]} />
          <View style={[styles.astroWheelInner, { borderRadius: wheelSize }]}><Text style={styles.astroCenterSign}>{result.sunSign.replace('座', '')}</Text><Text style={styles.astroCenterMeta}>太阳星座</Text></View>
          {Array.from({ length: 12 }).map((_, index) => <View key={index} style={[styles.zodiacTick, { transform: [{ rotate: `${index * 30}deg` }, { translateY: -(wheelSize / 2 - 9) }] }]} />)}
          {plotted.map((factor, index) => {
            const radians = ((factor.longitude - 90) * Math.PI) / 180;
            return (
              <AnimatedReveal delay={index * 45} key={factor.key} style={[styles.planetPoint, { left: center + Math.cos(radians) * radius - 14, top: center + Math.sin(radians) * radius - 14 }]}>
                <Text style={styles.planetPointText}>{planetShort[factor.key] ?? factor.label.slice(0, 1)}</Text>
              </AnimatedReveal>
            );
          })}
        </View>
        <View style={styles.astroAnchors}>
          {[['太阳', result.sunSign], ['月亮', result.moonSign ?? '未返回'], ['上升', result.ascendant ?? '坐标待补'], ['天顶', result.midheaven ?? '坐标待补']].map(([label, value]) => <View key={label} style={styles.anchorRow}><Text style={styles.anchorLabel}>{label}</Text><Text style={styles.anchorValue}>{value}</Text></View>)}
          <Text style={[styles.modeTag, result.calculationMode === 'approximate' && styles.modeTagPartial]}>{result.calculationMode === 'exact' ? '完整盘' : '近似盘'}</Text>
        </View>
      </View>
      <ChartRenderer payload={result} compact />
      {result.calculationMode === 'approximate' && (
        <StatePanel
          body="出生时辰未提供；只展示全天稳定的日期级落座，宫位、上升与相位保持隐藏。"
          state="partial"
          testID="astrology-partial-state"
          title="日期级近似盘"
        />
      )}
      {!result.sunSign || result.sunSign === '全天跨越星座，未显示' ? (
        <StatePanel
          body="当天跨越星座，当前没有足够依据展示太阳落座。"
          state="unknown"
          testID="astrology-unknown-state"
          title="太阳落座暂不可用"
        />
      ) : null}
      <ExplanationLayer
        snapshot={result.explanation}
        evidenceNodes={result.evidenceGraph.nodes}
        glossaryTerms={listGlossaryTerms('astrology')}
      />
      <Text style={styles.resultSectionTitle}>行星落座</Text>
      <View style={styles.factorGrid}>{result.factors.filter((item) => !['ascendant', 'midheaven'].includes(item.key)).map((factor) => <View key={factor.key} style={styles.factorRow}><Text style={styles.factorName}>{factor.label}</Text><Text style={styles.factorValue}>{factor.sign} {factor.degree}{factor.house ? ` · 第${factor.house}宫` : ''}{factor.retrograde ? ' · 逆行' : ''}</Text></View>)}</View>
      <Text style={styles.resultSectionTitle}>主要相位</Text>
      <View style={styles.aspectList}>{(showAllAspects ? result.aspects : result.aspects.slice(0, 8)).map((aspect, index) => <View key={`${aspect.from}-${aspect.to}-${aspect.label}-${index}`} style={styles.aspectRow}><Text style={styles.aspectBodies}>{aspect.from} — {aspect.to}</Text><Text style={styles.aspectType}>{aspect.label} · {aspect.orb}</Text></View>)}</View>
      {result.aspects.length > 8 && <Pressable accessibilityRole="button" accessibilityState={{ expanded: showAllAspects }} onPress={() => setShowAllAspects((current) => !current)} style={styles.aspectToggle}><Text style={styles.aspectToggleText}>{showAllAspects ? '收起相位' : `显示全部 ${result.aspects.length} 组相位`}</Text></Pressable>}
      <FocusList items={result.focus} />
      <Caveats items={result.caveats} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.obsidian },
  scrollContent: { paddingBottom: 120 },
  container: { width: '100%', maxWidth: 980, alignSelf: 'center', paddingHorizontal: layout.mobileGutter },
  containerDesktop: { paddingHorizontal: layout.desktopGutter },
  backButton: { minHeight: layout.minTouch, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
  backText: { color: palette.brass, fontFamily: fontFamilies.body, fontSize: 12 },
  moduleHero: { alignItems: 'center', paddingVertical: spacing.x6, gap: spacing.x5 },
  moduleHeroDesktop: { minHeight: 260, flexDirection: 'row', justifyContent: 'center', gap: spacing.x10 },
  heroSigil: { flexShrink: 0 },
  heroCopy: { flexShrink: 1, maxWidth: 560, alignItems: 'center' },
  heroKicker: { fontFamily: fontFamilies.data, fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase' },
  heroTitle: { marginTop: spacing.x2, color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 34, letterSpacing: 3, textAlign: 'center' },
  heroTitleDesktop: { fontSize: 44 },
  heroDescription: { marginTop: spacing.x3, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 15, lineHeight: 25, textAlign: 'center' },
  localBadge: { marginTop: spacing.x4, minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: spacing.x2, borderWidth: 1, borderColor: 'rgba(93,143,128,0.34)', borderRadius: radii.pill, paddingHorizontal: spacing.x3 },
  localBadgeText: { color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11 },
  profileBanner: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: spacing.x3, borderTopWidth: 1, borderBottomWidth: 1, borderColor: palette.hairline, paddingVertical: spacing.x3 },
  profileSeal: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 22, backgroundColor: palette.deepJade },
  profileSealText: { fontFamily: fontFamilies.display, fontSize: 17 },
  profileBannerCopy: { flex: 1, minWidth: 0 },
  profileLabel: { color: palette.brass, fontFamily: fontFamilies.body, fontSize: 9, letterSpacing: 1.8 },
  profileName: { marginTop: 2, color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 15, fontWeight: '600' },
  profileMeta: { marginTop: 3, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11 },
  switchProfile: { minWidth: 60, minHeight: layout.minTouch, alignItems: 'center', justifyContent: 'center' },
  switchProfileText: { color: palette.paleBrass, fontFamily: fontFamilies.body, fontSize: 12 },
  noProfile: { marginTop: spacing.x6, alignItems: 'center', borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.panel, backgroundColor: palette.deepJade, padding: spacing.x8 },
  panelTitle: { color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 24 },
  panelDescription: { maxWidth: 480, marginTop: spacing.x3, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 13, lineHeight: 22, textAlign: 'center' },
  compactButton: { marginTop: spacing.x5, minWidth: 150 },
  workspacePanel: { marginTop: spacing.x6, borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.panel, backgroundColor: 'rgba(8, 26, 22, 0.9)', padding: spacing.x5 },
  workspaceHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.x3 },
  workspaceKicker: { color: palette.brass, fontFamily: fontFamilies.data, fontSize: 9, letterSpacing: 2.2 },
  workspaceTitle: { marginTop: spacing.x2, color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 23, letterSpacing: 1 },
  workspaceMeta: { flexShrink: 0, color: palette.ashGreen, fontFamily: fontFamilies.data, fontSize: 10 },
  workspaceDescription: { marginTop: spacing.x4, marginBottom: spacing.x5, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 13, lineHeight: 22 },
  fieldBlock: { marginTop: spacing.x5 },
  fieldLabel: { marginTop: spacing.x4, marginBottom: spacing.x2, color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 13 },
  fieldHint: { marginTop: spacing.x2, marginBottom: spacing.x4, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 18 },
  segment: { flexDirection: 'row', borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, padding: 3, backgroundColor: palette.obsidian },
  segmentItem: { flex: 1, minHeight: layout.minTouch, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  segmentItemActive: { backgroundColor: palette.jadeMist },
  segmentText: { color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 13 },
  segmentTextActive: { color: palette.ricePaper },
  textInput: { minHeight: 48, borderWidth: 1, borderColor: palette.hairlineStrong, borderRadius: radii.input, backgroundColor: palette.obsidian, color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 16, paddingHorizontal: spacing.x4, paddingVertical: spacing.x3 },
  questionInput: { minHeight: 104, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x2, marginBottom: spacing.x1 },
  choiceChip: { minHeight: layout.minTouch, justifyContent: 'center', borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.pill, paddingHorizontal: spacing.x4 },
  choiceChipActive: { borderColor: palette.patina, backgroundColor: 'rgba(93,143,128,0.12)' },
  choiceChipText: { color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 12 },
  choiceChipTextActive: { color: palette.ricePaper },
  errorNotice: { marginBottom: spacing.x4, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.x2, borderLeftWidth: 2, borderLeftColor: palette.cinnabar, backgroundColor: 'rgba(159,81,67,0.1)', padding: spacing.x3 },
  errorText: { flex: 1, color: '#DCA091', fontFamily: fontFamilies.body, fontSize: 12, lineHeight: 19 },
  savedNotice: { marginTop: spacing.x4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.x2 },
  savedText: { color: palette.patina, fontFamily: fontFamilies.body, fontSize: 11 },
  interactiveCast: { marginTop: spacing.x2 },
  manualLines: { marginTop: spacing.x2, borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, padding: spacing.x2 },
  manualLine: { minHeight: layout.minTouch, flexDirection: 'row', alignItems: 'center', gap: spacing.x3, borderBottomWidth: 1, borderColor: palette.hairline, paddingHorizontal: spacing.x2 },
  manualLineMain: { flex: 1, minHeight: layout.minTouch, flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
  manualChange: { minHeight: layout.minTouch, justifyContent: 'center', paddingHorizontal: spacing.x2 },
  loadingText: { marginTop: spacing.x3, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 18, textAlign: 'center' },
  resultArea: { marginTop: spacing.x8, borderTopWidth: 1, borderColor: palette.hairline, paddingTop: spacing.x6 },
  resultHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.x4 },
  resultEyebrow: { color: palette.brass, fontFamily: fontFamilies.body, fontSize: 9, letterSpacing: 2 },
  resultTitle: { marginTop: spacing.x1, color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 27, letterSpacing: 1 },
  engineTag: { color: palette.ashGreen, fontFamily: fontFamilies.data, fontSize: 9 },
  pillarGrid: { marginTop: spacing.x5, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x2 },
  pillarCard: { minWidth: 126, flexBasis: '22%', flexGrow: 1, alignItems: 'center', borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.card, backgroundColor: palette.obsidian, padding: spacing.x4 },
  pillarLabel: { color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 10, letterSpacing: 2 },
  pillarStem: { marginTop: spacing.x3, color: palette.paleBrass, fontFamily: fontFamilies.display, fontSize: 36 },
  pillarDivider: { width: 20, height: 1, marginVertical: spacing.x2, backgroundColor: palette.hairlineStrong },
  pillarBranch: { color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 36 },
  pillarTenGod: { marginTop: spacing.x2, color: palette.brass, fontFamily: fontFamilies.body, fontSize: 11 },
  pillarDetail: { marginTop: spacing.x2, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 9, lineHeight: 15, textAlign: 'center' },
  evidenceStrip: { marginTop: spacing.x4, flexDirection: 'row', alignItems: 'center', gap: spacing.x4, borderTopWidth: 1, borderBottomWidth: 1, borderColor: palette.hairline, paddingVertical: spacing.x3 },
  dayunPanel: { marginTop: spacing.x4, borderWidth: 1, borderColor: palette.hairlineStrong, borderRadius: radii.input, backgroundColor: 'rgba(8, 26, 22, 0.68)', padding: spacing.x4 },
  dayunGrid: { marginTop: spacing.x3, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x2 },
  dayunCell: { minWidth: 88, flexGrow: 1, alignItems: 'center', borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, paddingVertical: spacing.x2, paddingHorizontal: spacing.x1 },
  dayunGanZhi: { color: palette.paleBrass, fontFamily: fontFamilies.display, fontSize: 18 },
  dayunMeta: { marginTop: 2, color: palette.ashGreen, fontFamily: fontFamilies.data, fontSize: 9 },
  dayunLiunian: { marginTop: spacing.x3, borderTopWidth: 1, borderColor: palette.hairline, paddingTop: spacing.x3 },
  dayunLiunianTitle: { color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 15 },
  evidenceLabel: { color: palette.brass, fontFamily: fontFamilies.body, fontSize: 11 },
  evidenceValue: { flex: 1, color: palette.ricePaper, fontFamily: fontFamilies.data, fontSize: 11 },
  evidencePanel: { marginTop: spacing.x4, borderWidth: 1, borderColor: palette.hairlineStrong, borderRadius: radii.input, backgroundColor: 'rgba(8, 26, 22, 0.68)' },
  evidencePanelHeader: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.x3, paddingHorizontal: spacing.x4, paddingVertical: spacing.x3 },
  evidencePanelKicker: { color: palette.brass, fontFamily: fontFamilies.data, fontSize: 8, letterSpacing: 1.8 },
  evidencePanelTitle: { marginTop: 3, color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 16 },
  evidencePanelAction: { color: palette.paleBrass, fontFamily: fontFamilies.body, fontSize: 11 },
  evidenceDetails: { borderTopWidth: 1, borderColor: palette.hairline, paddingHorizontal: spacing.x4, paddingBottom: spacing.x3 },
  evidenceDetailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.x3, borderBottomWidth: 1, borderColor: palette.hairline, paddingVertical: spacing.x3 },
  evidenceDetailLabel: { width: 72, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 10 },
  evidenceDetailValue: { flex: 1, color: palette.ricePaper, fontFamily: fontFamilies.data, fontSize: 10, lineHeight: 16 },
  interpretationExplorer: { marginTop: spacing.x6, borderTopWidth: 1, borderColor: palette.hairline, paddingTop: spacing.x5 },
  interpretationHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.x3 },
  resultSectionKicker: { color: palette.brass, fontFamily: fontFamilies.data, fontSize: 8, letterSpacing: 1.8 },
  interpretationTitle: { marginTop: spacing.x1, color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 21 },
  interpretationVersion: { color: palette.ashGreen, fontFamily: fontFamilies.data, fontSize: 9 },
  strengthOverview: { marginTop: spacing.x4, flexDirection: 'row', alignItems: 'center', gap: spacing.x4, borderWidth: 1, borderColor: palette.hairlineStrong, borderRadius: radii.input, backgroundColor: 'rgba(93,143,128,0.08)', padding: spacing.x4 },
  strengthStatusSeal: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.paleBrass, borderRadius: 36, backgroundColor: palette.deepJade },
  strengthStatusText: { color: palette.paleBrass, fontFamily: fontFamilies.display, fontSize: 20 },
  strengthConfidence: { marginTop: 2, color: palette.ashGreen, fontFamily: fontFamilies.data, fontSize: 9 },
  strengthOverviewCopy: { flex: 1 },
  strengthOverviewTitle: { color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 12, fontWeight: '600' },
  strengthOverviewText: { marginTop: spacing.x2, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 18 },
  structureTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x2, marginTop: spacing.x3 },
  structureTag: { color: palette.paleBrass, fontFamily: fontFamilies.body, fontSize: 10, borderWidth: 1, borderColor: palette.hairlineStrong, borderRadius: radii.pill, paddingHorizontal: spacing.x3, paddingVertical: spacing.x2 },
  interpretationList: { marginTop: spacing.x4, gap: spacing.x2 },
  interpretationCard: { borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, backgroundColor: palette.obsidian },
  interpretationCardHeader: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing.x3, paddingHorizontal: spacing.x4, paddingVertical: spacing.x3 },
  interpretationCardCopy: { flex: 1 },
  interpretationCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
  interpretationCardTitle: { color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 15 },
  confidenceChip: { color: palette.patina, fontFamily: fontFamilies.data, fontSize: 9, borderWidth: 1, borderColor: palette.patina, borderRadius: radii.pill, paddingHorizontal: spacing.x2, paddingVertical: 2 },
  interpretationConclusion: { marginTop: spacing.x2, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 18 },
  interpretationToggle: { flexShrink: 0, color: palette.paleBrass, fontFamily: fontFamilies.body, fontSize: 10 },
  interpretationEvidenceList: { borderTopWidth: 1, borderColor: palette.hairline, paddingHorizontal: spacing.x4, paddingBottom: spacing.x3 },
  emptyEvidenceText: { paddingVertical: spacing.x3, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 10 },
  evidenceReference: { borderBottomWidth: 1, borderColor: palette.hairline, paddingVertical: spacing.x3 },
  evidenceReferenceHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
  evidenceReferenceType: { color: palette.patina, fontFamily: fontFamilies.data, fontSize: 9 },
  evidenceReferenceCounter: { color: '#D88978' },
  evidenceReferenceLabel: { flex: 1, color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 10, lineHeight: 16 },
  evidenceReferenceAction: { minHeight: layout.minTouch, justifyContent: 'center', paddingHorizontal: spacing.x2 },
  evidenceReferenceActionText: { color: palette.paleBrass, fontFamily: fontFamilies.body, fontSize: 9 },
  rawEvidence: { marginTop: spacing.x2, borderLeftWidth: 1, borderLeftColor: palette.patina, backgroundColor: 'rgba(93,143,128,0.06)', padding: spacing.x3 },
  rawEvidenceId: { color: palette.brass, fontFamily: fontFamilies.data, fontSize: 8, lineHeight: 13 },
  rawEvidenceFacts: { marginTop: spacing.x1, color: palette.ashGreen, fontFamily: fontFamilies.data, fontSize: 9, lineHeight: 15 },
  rawEvidenceRule: { marginTop: spacing.x1, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 9, lineHeight: 14 },
  interpretationCaveat: { marginTop: spacing.x2, color: '#C5A878', fontFamily: fontFamilies.body, fontSize: 10, lineHeight: 17 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x2, marginTop: spacing.x3 },
  evidenceTag: { color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 10, borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.pill, paddingHorizontal: spacing.x3, paddingVertical: spacing.x2 },
  focusList: { marginTop: spacing.x6 },
  resultSectionTitle: { marginTop: spacing.x5, marginBottom: spacing.x3, color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 18, letterSpacing: 1 },
  focusRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.x3, borderTopWidth: 1, borderColor: palette.hairline, paddingVertical: spacing.x3 },
  focusIndex: { width: 24, color: palette.brass, fontFamily: fontFamilies.data, fontSize: 10 },
  focusText: { flex: 1, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 12, lineHeight: 20 },
  caveatBox: { marginTop: spacing.x5, borderLeftWidth: 2, borderLeftColor: palette.patina, backgroundColor: 'rgba(93,143,128,0.08)', padding: spacing.x4 },
  caveatTitle: { color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 11, fontWeight: '600' },
  caveatText: { marginTop: spacing.x2, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 18 },
  coinHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.x3 },
  coinRow: { flexDirection: 'row', gap: -7 },
  coin: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.patina, borderRadius: 17, backgroundColor: palette.obsidian },
  coinHole: { width: 9, height: 9, borderWidth: 1, borderColor: palette.patina },
  hexagramHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.x4 },
  changedHexagram: { alignItems: 'flex-end' },
  hexagramName: { marginTop: spacing.x1, color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 25 },
  hexagramMeta: { marginTop: spacing.x1, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 10 },
  questionEcho: { marginTop: spacing.x4, color: palette.paleBrass, fontFamily: fontFamilies.display, fontSize: 14, lineHeight: 23, textAlign: 'center' },
  yaoResultStack: { marginTop: spacing.x5, gap: spacing.x2 },
  yaoResultRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: spacing.x3, borderBottomWidth: 1, borderColor: palette.hairline, paddingVertical: spacing.x2 },
  yaoPosition: { width: 14, color: palette.ashGreen, fontFamily: fontFamilies.data, fontSize: 10 },
  yaoMark: { width: 82 },
  yangLine: { width: '100%', height: 5, borderRadius: 3, backgroundColor: palette.paleBrass },
  yinLine: { width: '100%', height: 5, flexDirection: 'row', justifyContent: 'space-between' },
  yinHalf: { width: '43%', height: 5, borderRadius: 3, backgroundColor: palette.paleBrass },
  yaoChange: { width: 22, color: palette.brass, fontFamily: fontFamilies.body, fontSize: 10 },
  yaoCopy: { flex: 1, minWidth: 0 },
  yaoPrimary: { color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 11 },
  yaoSecondary: { marginTop: 3, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 9, lineHeight: 14 },
  timeEvidence: { marginTop: spacing.x4, gap: spacing.x1, borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, padding: spacing.x3 },
  timeText: { color: palette.ashGreen, fontFamily: fontFamilies.data, fontSize: 10, lineHeight: 17 },
  ziweiSummary: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.x5, borderBottomWidth: 1, borderColor: palette.hairline, paddingBottom: spacing.x4 },
  ziweiMetaValue: { marginTop: spacing.x2, color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 13 },
  palaceBoard: { marginTop: spacing.x4, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x2 },
  palaceCard: { minHeight: 138, borderWidth: 1, borderColor: palette.hairline, borderRadius: radii.input, backgroundColor: palette.obsidian, padding: spacing.x3 },
  palaceCardWide: { flexBasis: '23%', flexGrow: 1 },
  palaceCardNarrow: { flexBasis: '47%', flexGrow: 1 },
  palaceTop: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.x2 },
  palaceName: { color: palette.paleBrass, fontFamily: fontFamilies.display, fontSize: 15 },
  palaceBranch: { color: palette.brass, fontFamily: fontFamilies.data, fontSize: 9 },
  palaceStars: { marginTop: spacing.x3, color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 18 },
  palaceMinor: { marginTop: spacing.x2, color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 9, lineHeight: 15 },
  palaceDecade: { marginTop: 'auto', color: palette.patina, fontFamily: fontFamilies.data, fontSize: 9 },
  selectedPalace: { marginTop: spacing.x4, borderLeftWidth: 2, borderLeftColor: palette.brass, paddingLeft: spacing.x3 },
  selectedPalaceLife: { borderLeftColor: '#E4C089' },
  palacePressable: { flex: 1 },
  palaceReading: { marginTop: spacing.x2, color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 11, lineHeight: 18 },
  ambientAnchor: { position: 'absolute', top: '50%', left: '50%', width: 0, height: 0, zIndex: 0 },
  yaoChangeWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  mutagenRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x2, marginTop: spacing.x4 },
  mutagenTag: { color: palette.paleBrass, fontFamily: fontFamilies.body, fontSize: 10, borderWidth: 1, borderColor: palette.hairlineStrong, borderRadius: radii.pill, paddingHorizontal: spacing.x3, paddingVertical: spacing.x2 },
  astroHero: { alignItems: 'center', gap: spacing.x5 },
  astroWheel: { position: 'relative', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.hairlineStrong, backgroundColor: palette.obsidian },
  astroWheelMiddle: { position: 'absolute', top: '12%', right: '12%', bottom: '12%', left: '12%', borderWidth: 1, borderColor: 'rgba(142,145,177,0.42)' },
  astroWheelInner: { width: '44%', height: '44%', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.hairline, backgroundColor: palette.deepJade },
  astroCenterSign: { color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 23, letterSpacing: 2 },
  astroCenterMeta: { marginTop: spacing.x1, color: palette.brass, fontFamily: fontFamilies.body, fontSize: 9, letterSpacing: 1.5 },
  zodiacTick: { position: 'absolute', width: 1, height: 9, backgroundColor: palette.paleBrass, opacity: 0.5 },
  planetPoint: { position: 'absolute', width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#8E91B1', borderRadius: 14, backgroundColor: palette.deepJade },
  planetPointText: { color: '#C8CAE1', fontFamily: fontFamilies.display, fontSize: 11 },
  astroAnchors: { width: '100%', maxWidth: 420, borderTopWidth: 1, borderColor: palette.hairline },
  anchorRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: palette.hairline },
  anchorLabel: { color: palette.ashGreen, fontFamily: fontFamilies.body, fontSize: 11 },
  anchorValue: { color: palette.ricePaper, fontFamily: fontFamilies.display, fontSize: 14 },
  modeTag: { alignSelf: 'flex-start', marginTop: spacing.x3, color: palette.patina, fontFamily: fontFamilies.body, fontSize: 10, borderWidth: 1, borderColor: palette.patina, borderRadius: radii.pill, paddingHorizontal: spacing.x3, paddingVertical: spacing.x1 },
  modeTagPartial: { color: palette.brass, borderColor: palette.brass },
  factorGrid: { borderTopWidth: 1, borderColor: palette.hairline },
  factorRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.x4, borderBottomWidth: 1, borderColor: palette.hairline },
  factorName: { color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 11 },
  factorValue: { flex: 1, color: palette.ashGreen, fontFamily: fontFamilies.data, fontSize: 10, textAlign: 'right' },
  aspectList: { borderTopWidth: 1, borderColor: palette.hairline },
  aspectRow: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.x3, borderBottomWidth: 1, borderColor: palette.hairline },
  aspectBodies: { color: palette.ricePaper, fontFamily: fontFamilies.body, fontSize: 11 },
  aspectType: { color: '#B5B7D0', fontFamily: fontFamilies.data, fontSize: 10 },
  aspectToggle: { minHeight: layout.minTouch, justifyContent: 'center', alignItems: 'center', marginTop: spacing.x2, borderWidth: 1, borderColor: palette.hairlineStrong, borderRadius: radii.input },
  aspectToggleText: { color: palette.paleBrass, fontFamily: fontFamilies.body, fontSize: 10 },
  pressed: { opacity: 0.68 },
});
