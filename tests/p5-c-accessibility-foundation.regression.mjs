import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const testDirectory = dirname(fileURLToPath(import.meta.url));
const source = (relativePath) => readFileSync(join(testDirectory, '..', relativePath), 'utf8');

test('P5-C 共享按钮暴露 busy/disabled 状态并隐藏重复的 loading 指示器', () => {
  const actionButton = source('src/components/action-button.tsx');

  assert.match(actionButton, /accessibilityState=\{\{/);
  assert.match(actionButton, /busy: loading/);
  assert.match(actionButton, /disabled: isDisabled/);
  assert.match(actionButton, /accessibilityElementsHidden/);
  assert.match(actionButton, /importantForAccessibility="no-hide-descendants"/);
});

test('P5-C 动效监听系统 Reduce Motion 变化并在清理时停止', () => {
  const animatedReveal = source('src/components/animated-reveal.tsx');

  assert.match(animatedReveal, /const \[reduceMotion, setReduceMotion\] = useState\(true\)/);
  assert.match(animatedReveal, /reduceMotionChanged/);
  assert.match(animatedReveal, /subscription\.remove\(\)/);
  assert.match(animatedReveal, /animation\?\.stop\(\)/);
});

test('P5-C 加载页拥有 progressbar/liveRegion 语义，装饰图形不重复读屏', () => {
  const loadingScreen = source('src/components/loading-screen.tsx');

  assert.match(loadingScreen, /accessibilityRole="progressbar"/);
  assert.match(loadingScreen, /accessibilityLiveRegion="polite"/);
  assert.match(loadingScreen, /accessibilityElementsHidden/);
  assert.match(loadingScreen, /正在校准观象仪/);
});

test('P5-C 主导航提供 tablist/tab 语义与可识别 testID，并避免重复跳转当前页面', () => {
  const bottomDock = source('src/components/bottom-dock.tsx');

  assert.match(bottomDock, /accessibilityLabel="主导航"/);
  assert.match(bottomDock, /accessibilityRole="tablist"/);
  assert.match(bottomDock, /accessibilityRole="tab"/);
  assert.match(bottomDock, /testID=\{`bottom-dock-\$\{item\.label\}`\}/);
  assert.match(bottomDock, /if \(!active\) router\.replace\(item\.href\)/);
});

test('P5-C 记录筛选器区分 action/checkbox/radio，并满足最小触控高度', () => {
  const archiveFilterBar = source('src/components/archive-filter-bar.tsx');

  assert.match(archiveFilterBar, /selectionMode = 'multiple'/);
  assert.match(archiveFilterBar, /isAction \? 'button' : isSingle \? 'radio' : 'checkbox'/);
  assert.match(archiveFilterBar, /isSingle \? \{ selected: active \} : \{ checked: active \}/);
  assert.match(archiveFilterBar, /minHeight: layout\.minTouch/);
  assert.match(archiveFilterBar, /selectionMode="single"/);
  assert.match(archiveFilterBar, /selectionMode="action"/);
});

test('P5-C 品牌印记为装饰元素，不抢占页面读屏顺序', () => {
  const brandMark = source('src/components/brand-mark.tsx');

  assert.match(brandMark, /accessibilityElementsHidden/);
  assert.match(brandMark, /importantForAccessibility="no-hide-descendants"/);
});

test('P5-C 四术工作区为选择器和错误/成功状态提供一致语义', () => {
  const moduleWorkspace = source('src/screens/module-workspace.tsx');

  assert.match(moduleWorkspace, /accessibilityRole="radiogroup"/);
  assert.match(moduleWorkspace, /accessibilityLabel="六爻用神方向"/);
  assert.match(moduleWorkspace, /accessibilityRole="radio"/);
  assert.match(moduleWorkspace, /accessibilityRole="alert"/);
  assert.match(moduleWorkspace, /accessibilityRole="text"/);
  assert.match(moduleWorkspace, /evidenceReferenceAction: \{ minHeight: layout\.minTouch/);
});
