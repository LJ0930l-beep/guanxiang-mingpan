# P5-A4a / P5-A5a · 四术边界与输入策略审计矩阵

状态：P5-A4a、P5-A4b1、P5-A4b2、P5-A4b3、P5-A4b4、P5-A4b5 与 P5-A5a 已由 Sol High 独立验收 PASS（2026-08-31）

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
- 新审计回归锁定：紫微接受 solar `2024-02-30` 并返回 `solarDate=2024-2-30`；占星同输入依赖第三方库抛出底层英文错误。普通无效 Gregorian 拒绝已分别登记为 P5-A4b 安全输入 gap；在 A4a immutable snapshot 中，公开支持日期范围仍记录为独立 owner decision，后续已由 P5-A5a overlay 解析。

## 4. Gap 与可直接授权的小批

| 主题 | 当前状态 | 建议处置 | 目标 |
|---|---|---|---|
| 八字真太阳时在 120°E 标准经线两侧的跨日、更多闰月/日期边界 | 已有部分 fixture，覆盖不完整 | 只新增边界 fixture 和回归，保持当前公式/规则不变 | P5-A4b |
| 紫微/占星公历合法性与错误 taxonomy | 紫微可能接受无效日期；占星依赖底层错误 | P5-A4b 先建立统一输入 contract、错误码和失败分类；UI/读屏 copy 另行进入 P5-C | P5-A4b / P5-C |
| 跨模块无猜测闭环（占星 0,0 fallback） | 已确认会改变行星位置，不能标 covered | 修复占星缺失坐标语义后再重新审计四术统一策略 | P5-A4b |
| 占星未知坐标 0,0 | 已确认会改变行星位置 | 明确拒绝或定义坐标缺失计算语义，并显示偏差来源 | P5-A4b |
| 六爻非法 seed、日期和引擎错误 | 日期有 shared 校验，seed/错误 taxonomy 不完整 | 固定可接受 seed 格式、错误分类和恢复动作 | P5-A4b |
| 跨模块错误文案、读屏和减少动态效果 | 尚无完整矩阵 | 在不改计算语义前提下做 UX/a11y 门禁 | P5-C |

## 5. 必须请示负责人的决策（A4a immutable snapshot）

以下事项会改变公开规则或承诺；以下列表和 `decision-required=5` 统计属于 A4a immutable snapshot，审计本体只登记、不在其中替负责人选择：

1. 八字公开支持日期范围、超范围输入的拒绝/降级和历史日期策略（case：`bazi-supported-date-range`）。
2. 紫微/占星公开支持日期范围与历法限制、超范围输入的拒绝/降级和历史日期策略（cases：`ziwei-date-range`、`astrology-date-range`）。
3. 中国大陆 1986–1991 历史夏令时是否支持、采用何种数据来源、是否影响既有快照复现（case：`bazi-historical-dst`）。
4. 占星缺时辰是否允许近似模式、允许展示哪些结果以及偏差文案（case：`astrology-missing-time`）。

普通无效公历日期在紫微/占星的拒绝属于安全的 P5-A4b 输入 gap（`ziwei-invalid-gregorian-date`、`astrology-invalid-gregorian-date`），不占用 owner decision；第三方错误分类和中文文案另行 route P5-A4b/P5-C。

`ownerDecisionRequired` 标记 5 个 contract cases，归并为上述 4 个 owner decisions（八字日期范围 1 项、紫微/占星日期范围 2 项、历史 DST 1 项、占星缺时辰近似 1 项）；城市完整覆盖不是本批决策，已 route 到 P5-B；失败文案与无障碍呈现 route 到 P5-C。P5-A5a 后续以独立 `p5-a5a-owner-decision.v1` overlay 解析三项日期范围 case，不改写本 immutable snapshot；历史 DST 与占星缺时辰近似仍待后续决策/实现。

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

## 10. P5-A4b3 八字真太阳时跨日/子初 resolution overlay（Sol High 独立验收 PASS）

本小批只关闭原始 gap `p5-a4a-bazi-true-solar-cross-day`，状态为 **Sol High 独立验收 PASS**。新增 regression-only 矩阵固定 135°E / 75°E（相对 120°E 标准经线两侧）、正负 `appliedCorrectionMinutes`、民用时刻向前/向后跨日和 `midnight` / `ziEarly` 两种日界线，并分别断言 `civilTime`、含日期 `effectiveTime`、应用修正及最终 `effectiveCalculationTime`。该证据只冻结已验收 NOAA v2 的当前工程输出，不提升为专业或独立真值。

`p5-a4b-input-resolution.v3` 累计 6 项（v1 原 3 + v2 追加 2 + 本批八字 1），v1/v2 原 exports、registry、validator、顺序与精确 3/5 计数保持不变；version-aware validator 同时接受 v1/v2/v3，并要求纯 JSON、唯一 resolution/audit ID、原始 audit case `status=gap` 与 `targetBatch=P5-A4b`，不写 commit SHA。矩阵在 `TZ=UTC` 与 `TZ=Asia/Shanghai` 下整体 deepEqual；A4a `41 / 18 / 15 / 5 / 2 / 1` immutable snapshot 与 astrology `0,0` probe 保持不变。

本批已核对 Expo SDK 57 exact docs，但没有使用 Expo API。其余 A4a gap、owner decisions、六爻 engine/cross taxonomy、`0,0` 语义、日期范围、DST、缺时辰和 P5-B/P5-C 路由仍未完成；不表示整个 P5-A 或 Phase 5 完成。

本地质量命令结果：`git diff --check` PASS、`npm run typecheck` PASS、`npm run lint` PASS（0 warning）、`npm test` PASS（132/132）、`npm run build:web` PASS（8 routes，Web Export 实际执行）。实现 local `53a3c46a1145a10f78f7f193df9b6e01dc12bbeb` / remote `c2daaf5691980da3faa839df4847680331d90b53`；GitHub Actions [run 33352537186](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/33352537186) 为 `completed/success`，validate job `99368535197` 的 Typecheck、Lint、Regression tests 与 Web export 均实际执行并成功。

Sol High 独立验收结论：**P5-A4b3 PASS**。紫微 lunar/闰月、六爻 engine/cross taxonomy、unknown-coordinate `0,0`、公开日期范围、1986–1991 DST、缺时辰、owner decisions 及其余 gap/P5-B/P5-C 路由仍未完成；整个 P5-A 与 Phase 5 仍未完成。

## 11. P5-A4b4 紫微农历/闰月输入 resolution overlay（Sol High 独立验收 PASS）

本节只追加 P5-A4b4 的验收记录；第 1～7 节的 P5-A4a immutable 审计本体、41 项 registry、`covered / gap / decision-required / not-applicable / routed-p5-b = 18 / 15 / 5 / 2 / 1` 统计与 Astrology `0,0` probe 均不变。

本小批只关闭以下两个原始 `gap`：

| auditCaseId | 本批关闭事实 |
|---|---|
| `p5-a4a-ziwei-lunar-input` | 紫微农历路径在进入既有 iztro 引擎前，按固定 `lunar-javascript@1.7.7` 数据校验日期格式、月份和当月实际日数；普通农历有效输入可继续排盘，农历路径不套用 Gregorian 校验。 |
| `p5-a4a-ziwei-leap-month` | 紫微农历闰月路径在进入既有 iztro 引擎前按年历核对闰月存在性；有效闰月可继续排盘，不存在的闰月组合 fail-fast 拒绝。 |

新增纯 JSON `p5-a4b-input-resolution.v4`，累计 v1=3/v2=5/v3=6/v4=8；保留 v1/v2/v3 exports、顺序前缀与 validator，并新增 v4 validator。该日历能力只形成工程输入契约，不自创历法结论、不宣称独立专业或紫微真值；本批未修改算法/公式、UI、Storage/schema、依赖或 CI，也未处理日期范围、DST、未知时辰、engine/cross taxonomy 或 owner decisions。

新增回归覆盖普通农历、有效闰月、无效闰月组合、无效农历日期，以及 `TZ=UTC` 与 `TZ=Asia/Shanghai` deepEqual，且不依赖 OS/process TZ。实现 local `62697525875a6214b19b447c1d08753bfdb18d75` / remote `306fdcdc89090f2c3c018ab8a25c5938b1e74195`，remote parent `e41513d3343c7d081bd17d06521c9410139286ab`；GitHub Actions [run 33357809089](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/33357809089) 与 validate job `99383188584` 均 `completed/success`，Typecheck、Lint、Regression tests 与 Web export 均实际执行并成功；本地 `git diff --check`、typecheck、lint（0 warning）、`npm test` 139/139、`build:web` 8 routes 均 PASS。`npm audit --omit=dev` 生产基线为 0 critical、8 high、13 moderate、0 low，未升级依赖。

Sol High 独立验收结论：**P5-A4b4 PASS**。下一微批为 **P5-A4b5 四模块 engine errors 与跨模块失败契约**；负责人决策项继续 pending，整个 P5-A 与 Phase 5 仍未完成。

## 12. P5-A4b5 四模块 engine failures 与跨模块失败 resolution overlay（Sol High 独立验收 PASS）

本节只记录 P5-A4b5 overlay 的增量验收事实；前述 P5-A4a immutable audit 本体、原始 registry、`41 / 18 / 15 / 5 / 2 / 1` 统计与 Astrology `0,0` probe 原样不动。immutable registry 的原始 `gap` 状态不被改写，以下四项由 v5 overlay 记录为本批关闭：

| auditCaseId | 本批关闭事实 |
|---|---|
| `p5-a4a-ziwei-engine-error-path` | 紫微引擎未知异常统一包装为稳定、JSON-safe、fail-closed 的模块化 engine error；不返回部分盘、默认盘或猜测盘。 |
| `p5-a4a-astrology-engine-error-path` | 占星引擎未知异常统一包装为稳定、JSON-safe、fail-closed 的模块化 engine error；正常成功盘和 `0,0`/no-guessing 边界不被改变。 |
| `p5-a4a-liuyao-engine-error-path` | 六爻引擎未知异常统一包装为稳定、JSON-safe、fail-closed 的模块化 engine error；不返回部分盘、默认盘或猜测盘。 |
| `p5-a4a-cross-error-copy-failure-mode` | 四模块跨边界失败结果统一为同形安全 contract，并验证输入错误兼容、稳定错误不重复包装和安全序列化。 |

真实跨模块审计项是 `p5-a4a-cross-error-copy-failure-mode`；不存在且未使用 `p5-a4a-cross-error-taxonomy`。八字 engine-error 路径在 A4a 原审计中已经通过，本批仅纳入 Bazi 的跨模块同形/兼容回归，不虚构新的八字 gap。

四模块公开 engine failure contract 严格为 `{name,category,module,code}`，本批值为 `ChartEngineError`/`engine-failure`/对应模块/`ENGINE_FAILURE`；不暴露 `cause`、`message`、`stack`、PII 或底层库细节。未知异常按模块包装，稳定 engine error 不重复包装；`ChartInputError` 完全兼容并原样重抛。所有 engine failure fail-closed，正常成功盘保持不变；异常注入使用局部 seam，不使用全局 monkey patch 或并行污染。

新增纯 JSON `p5-a4b-input-resolution.v5`，累计 v1=3/v2=5/v3=6/v4=8/v5=12；保留 v1/v2/v3/v4 exports、顺序前缀与 validators，并新增 version-aware v5 validator。回归覆盖四模块成功、输入错误、异常包装、安全序列化、跨模块同形与 overlay 前缀/校验。实现批次实际变更为 10 paths：`package.json`、`src/domains/golden/boundary-input-resolution.ts`、`src/domains/golden/index.ts`、`src/services/chart-engine.ts`、`src/services/chart-errors.ts`、`src/services/engines/astrology-engine.ts`、`src/services/engines/bazi-engine.ts`、`src/services/engines/liuyao-engine.ts`、`src/services/engines/ziwei-engine.ts`、`tests/p5-engine-errors.regression.mjs`。

质量门：`git diff --check` PASS、`npm run typecheck` PASS、`npm run lint` PASS（0 warning）、`npm test` PASS（146/146）、`npm run build:web` PASS（8 routes，Web Export 实际导出/路由校验通过）；`npm audit --omit=dev` 为 0 critical / 8 high / 13 moderate / 0 low（21 total，未升级依赖）。GitHub Actions [run 33363580174](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/33363580174) 的 validate job `99399593743` 为 `completed/success`，Typecheck、Lint、Regression tests 与 Web Export 均实际执行并成功。实现基线 local `f6dad29fc72b1c49e296b5300ae19c5a2cd6a5b3`、remote `98a336b8381016d781abc2b5584cc0777cb8bbd5`、remote parent `c7801ddc28522a7fdcfe0b38931443ba559868c2`。

Sol High 独立验收结论：**P5-A4b5 PASS**。本节形成时 Astrology `0,0`/no-guessing、日期范围、DST、未知时辰及其他负责人决策项仍 pending；随后 P5-A5a 已以独立 overlay 解析三项公开日期范围决策。当前下一步为 **P5-A5b Astrology 日级近似 + 缺坐标 fail-closed**。本节不表示 P5-A 或 Phase 5 完成。

## 13. P5-A5a 统一公开出生日期政策 owner-decision overlay（Sol High 独立验收 PASS）

### 13.1 决策与独立 overlay

负责人确认中国大陆首发公开出生日期统一采用 **1900-01-01 至 2099-12-31（含端点）**。版本化政策常量/contract 为 `cn-mainland-public-birth-date-range.v1`，八字、紫微、占星范围外统一 fail-fast，保持稳定 `ChartInputError` code/field/安全中文文案；八字/紫微农历输入先做真实农历与闰月校验，再按农历输入年份/日期范围检查。六爻不受该出生日期政策影响。

本批新增独立、JSON-safe、版本感知的 `p5-a5a-owner-decision.v1`，精确解析以下三项 A4a `decision-required` case：

| auditCaseId | 本批决策 |
|---|---|
| `p5-a4a-bazi-supported-date-range` | 八字公开出生日期 inclusive `1900-01-01..2099-12-31`，范围外拒绝。 |
| `p5-a4a-ziwei-date-range` | 紫微公开出生日期 inclusive `1900-01-01..2099-12-31`，范围外拒绝。 |
| `p5-a4a-astrology-date-range` | 占星公开出生日期 inclusive `1900-01-01..2099-12-31`，范围外拒绝。 |

该 overlay 独立于只允许原始 gap 的 A4b v1-v5；A4a immutable registry 本体、原始条目与 `covered / gap / decision-required / not-applicable / routed-p5-b = 18 / 15 / 5 / 2 / 1` 统计不变，A4b v1-v5 overlays 不变。三项 case 的决策关闭不改变 A4a 历史统计含义。

### 13.2 可复现快照与回归

政策版本及 inclusive 起止边界进入 `calculationSettings`，并通过 `inputSnapshot`、`ChartSnapshotMeta`、`SavedReading` 和普通/加密 backup roundtrip 保存；旧快照读取兼容且不补写日期政策，不做 Storage Schema 破坏性迁移。八字 solar/lunar、紫微 solar/lunar/闰月、Astrology solar 均覆盖 1900/2099 端点与 1899/2100 拒绝；既有非法 Gregorian/lunar error code 兼容，Liuyao 2100 日期不被误拦。TZ UTC 与 Asia/Shanghai 对同一 fixture deepEqual，2099 三模块均可由固定依赖可靠计算。

专项回归 **9/9**，统一 `npm test` **155/155**；`npm run typecheck` PASS；`npm run lint` PASS（0 warning）；`npm run build:web` PASS（8 routes，Web Export 实际执行）；`npm audit --omit=dev` 生产基线为 **0 critical / 8 high / 13 moderate / 0 low**，未升级依赖。

### 13.3 提交链与最终 CI

实现远端 commit `61805e8998ab4ca701e4960d6129e3b7cb381b17`（parent `496902c875072769439c90cf52f130331fa473d3`），GitHub Actions run `33375970276` / job `99437414040`；该实现提交错误新增根目录 `STATUS.md`。cleanup 远端 commit `5350baa9a857b86e2a02c0c42036d72dfe06a0c4`（parent `61805e8998ab4ca701e4960d6129e3b7cb381b17`）仅删除 `STATUS.md`，当前仓库无该文件；最终 CI run `33376590722` / job `99439354459` 为 Success，Typecheck、Lint、Regression tests 与 Web Export 均实际执行并成功。

Sol High 独立验收结论：**P5-A5a PASS**。本批只关闭三项日期 decision-required；P5-A 仍未完成。下一批为 **P5-A5b Astrology 日级近似 + 缺坐标 fail-closed**；DST、缺时辰与 `0,0`/no-guessing 仍 pending。
