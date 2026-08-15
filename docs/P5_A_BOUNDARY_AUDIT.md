# P5-A4a · 四术边界与输入策略审计矩阵

状态：Sol High 独立验收 PASS（2026-08-15）

本文件只说明机器可检查审计合同的范围和当前事实，不把项目回归测试、第三方库返回或 CI 通过提升为四术专业真值，也不表示整个 P5-A 或 Phase 5 已完成。

## 1. 单一事实源与合同

- 合同实现：`src/domains/golden/boundary-input-contract.ts`
- Golden index 导出：`src/domains/golden/index.ts`
- 审计回归：`tests/p5-boundary-input-audit.regression.mjs`
- 合同版本：`p5-a4a-boundary-input.v1`
- 每项必填：`id`、`module`、`category`、`input`/`fixture`、`risk`、`currentBehavior`、`expectedPolicy`、`status`、`validationClass`、`evidenceRefs`、`targetBatch`、`ownerDecisionRequired`、`notes`。

runtime validator 会检查纯 JSON（拒绝函数、`Date`、循环引用、NaN/Infinity）、稳定 kebab-case ID、枚举、证据引用、重复 ID 及状态/目标批次/负责人决策的一致性。所有矩阵项当前均为 `regression-only`，没有项目自身可升级为 `independent-validation` 的条目。

## 2. 矩阵统计

| 模块 | 项数 | covered | gap | decision-required | not-applicable | routed-p5-b |
|---|---:|---:|---:|---:|---:|---:|
| 八字 | 10 | 7 | 1 | 2 | 0 | 0 |
| 紫微 | 9 | 3 | 4 | 1 | 1 | 0 |
| 占星 | 8 | 2 | 4 | 2 | 0 | 0 |
| 六爻 | 9 | 5 | 3 | 0 | 1 | 0 |
| 跨模块 | 5 | 1 | 3 | 0 | 0 | 1 |
| **合计** | **41** | **18** | **15** | **5** | **2** | **1** |

覆盖类别包括：八字公历/农历闰月、节气、日界、真太阳时、固定业务时区、未知时辰/经度、日期范围与历史 DST；紫微时辰、solar/lunar/闰月、日期范围、未知城市与引擎错误；占星精确/近似、坐标、非法坐标、日期范围、跨宿主 TZ 与错误；六爻 seed/date/scope/timezone、非法输入、空问题、用神、跨宿主 TZ、应期承诺与错误；以及跨模块无猜测、错误文案、历史 snapshot、城市覆盖和 a11y 路由。

## 3. 已覆盖的工程事实

- 已有回归锁定八字节气 T-1/T/T+1、22:59/23:00/23:01 日界、Asia/Shanghai 与 UTC-only 复现、缺时辰/缺经度拒绝，以及农历闰月非法组合。
- 紫微已锁定精确时辰的固定样例、未知时辰拒绝和 solar 输入；六爻已锁定固定 seed/date/scope/timezone、空问题/非法用神错误、非法日期校验、应期不承诺与跨宿主 TZ；占星固定坐标跨宿主 TZ deepEqual。
- 新审计回归锁定：占星未知城市坐标缺失时当前传入 `0,0`，虽然标为 approximate、隐藏上升/天顶/宫位，但太阳/月亮经度与已知深圳坐标不同；这是真实 gap，不是“只降低精度”的解释。
- 新审计回归锁定：紫微接受 solar `2024-02-30` 并返回 `solarDate=2024-2-30`；占星同输入依赖第三方库抛出底层英文错误。普通无效 Gregorian 拒绝已分别登记为 P5-A4b 安全输入 gap，公开支持日期范围仍是独立 owner decision，不在本批修复。

## 4. Gap 与可直接授权的小批

| 主题 | 当前状态 | 建议处置 | 目标 |
|---|---|---|---|
| 八字东西经真太阳时跨日、更多闰月/日期边界 | 已有部分 fixture，覆盖不完整 | 只新增边界 fixture 和回归，保持当前公式/规则不变 | P5-A4b |
| 紫微/占星公历合法性与错误 taxonomy | 紫微可能接受无效日期；占星依赖底层错误 | P5-A4b 先建立统一输入 contract、错误码和失败分类；UI/读屏 copy 另行进入 P5-C | P5-A4b / P5-C |
| 跨模块无猜测闭环（占星 0,0 fallback） | 已确认会改变行星位置，不能标 covered | 修复占星缺失坐标语义后再重新审计四术统一策略 | P5-A4b |
| 占星未知坐标 0,0 | 已确认会改变行星位置 | 明确拒绝或定义坐标缺失计算语义，并显示偏差来源 | P5-A4b |
| 六爻非法 seed、日期和引擎错误 | 日期有 shared 校验，seed/错误 taxonomy 不完整 | 固定可接受 seed 格式、错误分类和恢复动作 | P5-A4b |
| 跨模块错误文案、读屏和减少动态效果 | 尚无完整矩阵 | 在不改计算语义前提下做 UX/a11y 门禁 | P5-C |

## 5. 必须请示负责人的决策

以下事项会改变公开规则或承诺，审计只登记、不替负责人选择：

1. 八字公开支持日期范围、超范围输入的拒绝/降级和历史日期策略（case：`bazi-supported-date-range`）。
2. 紫微/占星公开支持日期范围与历法限制、超范围输入的拒绝/降级和历史日期策略（cases：`ziwei-date-range`、`astrology-date-range`）。
3. 中国大陆 1986–1991 历史夏令时是否支持、采用何种数据来源、是否影响既有快照复现（case：`bazi-historical-dst`）。
4. 占星缺时辰是否允许近似模式、允许展示哪些结果以及偏差文案（case：`astrology-missing-time`）。

普通无效公历日期在紫微/占星的拒绝属于安全的 P5-A4b 输入 gap（`ziwei-invalid-gregorian-date`、`astrology-invalid-gregorian-date`），不占用 owner decision；第三方错误分类和中文文案另行 route P5-A4b/P5-C。

`ownerDecisionRequired` 标记 5 个 contract cases，归并为上述 4 个 owner decisions（八字日期范围 1 项、紫微/占星日期范围 2 项、历史 DST 1 项、占星缺时辰近似 1 项）；城市完整覆盖不是本批决策，已 route 到 P5-B；失败文案与无障碍呈现 route 到 P5-C。

## 6. 验收证据

- 实现 local `2cf82d402e2f840ebf7c29bf47ee3b167fab9688`，remote `c7055e8962b3b21dd8b78c8f5c64769e9528daf0`。
- [GitHub Actions run 31879638540](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/31879638540) 为 `completed/success`；Typecheck、Lint、Regression tests 与 Web Export 均实际执行并 Success。
- 主管本地独立复跑 `git diff --check`、typecheck、lint、`npm test`（112/112）和 `build:web`（8 routes），全部 PASS。
- 唯一非阻断 warning：runner 将 `actions/checkout@v4`、`actions/setup-node@v4` 的 Node 20 action runtime 强制为 Node 24。该项登记为后续 CI maintenance，本批不修改 workflow。

## 7. 结论与边界

P5-A4a 已完成“盘点 + 合同 + 机器门禁 + 只读 probes”的实现，并通过 Sol High 独立验收 **PASS**。该结论只覆盖审计合同、机器门禁和已登记的工程现状，不把项目回归、第三方库返回或 CI 通过提升为四术专业真值。P5-A 不能因此关闭：真实 gap 尚未修复，决策项尚未批准，P5-A4b/P5-B/P5-C 仍需单独 handoff；整个 P5-A 与 Phase 5 仍未完成。任何对外文案只能说当前输入边界和工程回归已被记录，不能说四术结论已经获得专业验证。

## 8. P5-A4b1 resolution overlay（Sol High 独立验收 PASS）

P5-A4a 的审计 registry 是 immutable snapshot，本节不修改其 41 项条目或 `covered / gap / decision-required / not-applicable / routed-p5-b = 18 / 15 / 5 / 2 / 1` 统计。新增纯 JSON 合同 `p5-a4b-input-resolution.v1` 只关闭以下三个原始 `gap`，每项均保留原 `auditCaseId` 并指向 `P5-A4b`：

| auditCaseId | 本批关闭事实 |
|---|---|
| `p5-a4a-ziwei-invalid-gregorian-date` | Ziwei solar 进入 iztro 前严格拒绝非法/非 `YYYY-MM-DD` Gregorian 日期。 |
| `p5-a4a-astrology-invalid-gregorian-date` | Astrology solar 进入第三方 Horoscope 前严格拒绝非法/非 `YYYY-MM-DD` Gregorian 日期。 |
| `p5-a4a-astrology-invalid-coordinate` | Astrology 显式坐标在 Origin 前要求成对、finite、纬度 `[-90,90]`、经度 `[-180,180]`。 |

overlay validator 强制 `auditCaseId` 存在于本 registry、原状态为 `gap` 且 target 为 `P5-A4b`，并检查纯 JSON、唯一 resolution/audit ID 和 `tests/` 引用；不预填 commit SHA。A4a 的未知城市 `0,0` probe 仍保留为 gap：两坐标都缺失继续沿现有 resolver/`0,0` 行为，城市命中仍为 exact。

本批不解决 cross error taxonomy、unknown-coordinate `0,0` 语义、公开日期支持范围、DST、缺时辰、Astrology lunar 策略或其余 gap/decision-required；P5-A 与 Phase 5 仍未完成。实现 local `0d279c677c1c05eb2492f9ae3b779267feb8b165` / remote `8ab5c6981c89590f6f19fabdc688c34ae60650ed`；[CI run 31882220415](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/31882220415) 为 `completed/success`，Typecheck、Lint、Regression tests 与 Web Export 均实际执行，Web Export 未 skip；主管本地 `git diff --check`、typecheck、lint、`npm test` 120/120、`npm run build:web` 8 routes 全部 PASS。Node 20 action runtime warning 继续沿既有非阻断 CI maintenance 登记。Sol High 独立验收结论：**P5-A4b1 PASS**；该结论不表示整个 P5-A 或 Phase 5 已完成。
## 9. P5-A4b2 六爻输入 resolution overlay（Sol High 独立验收 PASS）

P5-A4a 的 41 项 registry 与 `covered / gap / decision-required / not-applicable / routed-p5-b = 18 / 15 / 5 / 2 / 1` immutable snapshot 不变；P5-A4b1 的 v1 overlay 原三项 export、registry 和 validator 不变。本小批只关闭六爻两个原始 gap。

| auditCaseId | 本批关闭事实 |
|---|---|
| `p5-a4a-liuyao-invalid-date` | `normalizeLiuyaoDate` 先拒绝非法原始 civil 年月日时分秒、缺时间、24:00、分/秒 60、坏 offset、非字符串和 offset 下 Feb30，再把 Z/`±HH:MM`/`±HHMM` 转为 `Asia/Shanghai` 秒级民用时间。 |
| `p5-a4a-liuyao-invalid-seed` | `normalizeLiuyaoSeed` 只以 trim 判空、按原始 Unicode code-point 长度 1～256 校验，保留合法原字符串；自动 seed 同样验证，scope 继续固定。 |

新增纯 JSON `p5-a4b-input-resolution.v2` 五项 registry（原三项 + 上述两项），版本感知、resolution/audit ID 唯一、每项关联原始 `gap` 与 `targetBatch=P5-A4b`，不写 commit SHA。A4a 旧 probe 不再要求空 seed 成功；`0,0` probe 与其他统计保持不变。

实现新增 `tests/p5-liuyao-input-validation.regression.mjs` 8 项回归并接入统一 `npm test`；实现 local `0815612cb8e2261325828ccf0d07e51525f34280` / remote `a976b4f07a2d516713db10cb2c0f2b53c98aa51a`；GitHub Actions run `31884436927` 为 `completed/success`，validate job `95011564415` 的 Typecheck、Lint、Regression tests 与 Web export 均实际执行并成功；主管本地独立门禁 `git diff --check`、typecheck、lint、`npm test` 128/128、build:web 8 routes 均 PASS（Web Export 实际执行）。Sol High 独立验收结论：**P5-A4b2 PASS**。覆盖 legal local/seconds/millis、Z/`+08:00`/`+0800`、非法 date/offset/seed 矩阵、Unicode payload/inputSnapshot、deepEqual、自动 seed 和 UTC/Asia/Shanghai 结果/错误一致性。六爻 engine/cross error taxonomy、unknown-coordinate `0,0`、公开日期范围、DST、缺时辰、owner decisions 及其余 gap/decision-required 仍未完成，P5-A 与 Phase 5 仍未完成。
