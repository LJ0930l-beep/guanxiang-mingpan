import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const source = (relativePath) => readFileSync(join(testDirectory, '..', relativePath), 'utf8');

test('P5-C 状态文案矩阵覆盖 loading/empty/failure/partial/blocked/unknown 且不承诺结果', () => {
  const copy = source('src/constants/ui-copy.ts');
  const statePanel = source('src/components/state-panel.tsx');
  for (const state of ['loading', 'empty', 'failure', 'partial', 'blocked', 'unknown']) {
    assert.match(copy, new RegExp(`${state}:\\s*\\{[\\s\\S]*?title:`));
    assert.match(copy, new RegExp(`${state}:\\s*\\{[\\s\\S]*?body:`));
    assert.match(copy, new RegExp(`${state}:\\s*\\{[\\s\\S]*?announcement:`));
    assert.match(copy, new RegExp(`${state}:\\s*\\{[\\s\\S]*?action:`));
  }
  assert.doesNotMatch(copy, /必然|注定|保证发财|医疗建议|法律意见|投资建议/);
  assert.match(statePanel, /accessibilityLabel=\{`\$\{copy\.announcement\} \$\{resolvedBody\}`\}/);
  assert.match(statePanel, /accessibilityRole=\{isAlert \? 'alert' : 'text'\}/);
  assert.match(statePanel, /accessibilityLiveRegion=\{isAlert \? 'assertive' : 'polite'\}/);
  assert.match(statePanel, /onAction &&/);
});

test('P5-C 页面使用统一状态矩阵并保留本地原型边界', () => {
  const login = source('src/screens/login-screen.tsx');
  const profiles = source('src/screens/profiles-screen.tsx');
  const records = source('src/screens/records-screen.tsx');
  const settings = source('src/app/settings.tsx');

  assert.match(login, /UI_STATE_COPY\.failure/);
  assert.match(login, /当前为本地原型|当前均为本地原型/);
  assert.match(profiles, /UI_STATE_COPY\.(blocked|empty|failure)/);
  assert.match(records, /UI_STATE_COPY\.(blocked|empty|failure)/);
  assert.match(settings, /UI_STATE_COPY\.(blocked|failure)/);
});

test('P5-C 登录页支持键盘顺序、错误 live region 和原型服务提示', () => {
  const login = source('src/screens/login-screen.tsx');

  assert.match(login, /useRef<TextInput \| null>/);
  assert.match(login, /onSubmitEditing=\{\(\) => codeInputRef\.current\?\.focus\(\)\}/);
  assert.match(login, /returnKeyType="next"/);
  assert.match(login, /returnKeyType="done"/);
  assert.match(login, /accessibilityLiveRegion="polite"/);
  assert.match(login, /accessibilityRole=\{messageTone === 'error' \? 'alert' : 'text'\}/);
  assert.match(login, /不连接真实服务/);
});

test('P5-C 命主管理页补齐表单分组、验证焦点、只读/空状态和触控目标', () => {
  const profiles = source('src/screens/profiles-screen.tsx');

  assert.match(profiles, /accessibilityRole="radiogroup"/);
  assert.match(profiles, /nameInputRef\.current\?\.focus\(\)/);
  assert.match(profiles, /birthDateInputRef\.current\?\.focus\(\)/);
  assert.match(profiles, /accessibilityRole="alert"/);
  assert.match(profiles, /accessibilityRole="text"/);
  assert.match(profiles, /minHeight: layout\.minTouch/);
  assert.match(profiles, /autoComplete="name"/);
  assert.match(profiles, /resolveCityCoordinates\(birthCity\)/);
  assert.match(profiles, /listMainlandCities\(\)/);
  assert.match(profiles, /不会按包含关系猜测/);
  assert.match(profiles, /选择\$\{city\.province\}\$\{city\.name\}/);
});

test('P5-C 记录页为列表、筛选、对比、反馈和只读失败状态提供语义', () => {
  const records = source('src/screens/records-screen.tsx');

  assert.match(records, /keyboardShouldPersistTaps="handled"/);
  assert.match(records, /accessibilityRole="checkbox"/);
  assert.match(records, /accessibilityState=\{\{ expanded \}\}/);
  assert.match(records, /accessibilityRole="radiogroup"/);
  assert.match(records, /accessibilityRole="alert"/);
  assert.match(records, /importantForAccessibility="no-hide-descendants"/);
  assert.match(records, /compareToggle: \{ minHeight: layout\.minTouch/);
  assert.match(records, /statusOption: \{ minHeight: layout\.minTouch/);
  assert.match(records, /cardHeader/);
  assert.match(records, /<View style=\{\[styles\.card/);
});

test('P5-C 解释层和快照查看器支持可展开状态、只读说明和 44pt 触控目标', () => {
  const explanation = source('src/components/explanation-layer.tsx');
  const snapshot = source('src/components/snapshot-viewer.tsx');

  assert.match(explanation, /accessibilityState=\{\{ expanded \}\}/);
  assert.match(explanation, /glossaryChip: \{ minHeight: layout\.minTouch/);
  assert.match(explanation, /evidenceAction: \{ minHeight: layout\.minTouch/);
  assert.match(explanation, /moreButton: \{ minHeight: layout\.minTouch/);
  assert.match(snapshot, /accessibilityRole="header"/);
  assert.match(snapshot, /diffButton: \{ minHeight: layout\.minTouch/);
});

test('P5-C Home/Quiet/观象仪保留跨端标题、键盘和 Reduce Motion 语义', () => {
  const home = source('src/screens/home-screen.tsx');
  const quiet = source('src/screens/quiet-screen.tsx');
  const dial = source('src/components/observatory-dial.tsx');

  assert.match(home, /testID="home-screen"/);
  assert.match(home, /accessibilityRole="header"/);
  assert.match(home, /accessibilityHint=/);
  assert.match(quiet, /keyboardShouldPersistTaps="handled"/);
  assert.match(quiet, /testID="quiet-screen"/);
  assert.match(dial, /reduceMotionChanged/);
  assert.match(dial, /subscription\.remove\(\)/);
});

test('P5-C 四术工作区具备真实生成、保存、失败恢复和部分状态通路', () => {
  const moduleWorkspace = source('src/screens/module-workspace.tsx');
  for (const workspace of ['BaziWorkspace', 'LiuyaoWorkspace', 'ZiweiWorkspace', 'AstrologyWorkspace']) {
    assert.match(moduleWorkspace, new RegExp(`function ${workspace}`));
  }
  assert.match(moduleWorkspace, /await saveReading\(\{ profile, payload: next/);
  assert.match(moduleWorkspace, /onRetry=\{run\}/);
  assert.match(moduleWorkspace, /loading=\{busy\}/);
  assert.match(moduleWorkspace, /loading=\{loading\}/);
  assert.match(moduleWorkspace, /StatePanel[\s\S]*state="partial"/);
  assert.match(moduleWorkspace, /testID="astrology-unknown-state"/);
});
