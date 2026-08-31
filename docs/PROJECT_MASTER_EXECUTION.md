# 观象·命盘 — 项目总执行账本

> 本账本是后续批次的仓库内执行入口。它记录“计划应做什么”和“当前实际做到什么”，不替代代码、测试或 CI 的证据。
>
> 批次：P5-A5c 中国大陆 1986–1991 历史 DST
> 本批状态：P5-A5c 已由 Sol High 独立验收 PASS；P5-A 待最终总验收与审计收口；P5-A5b/P5-A5a/P5-A4b5/P5-A4b4/P5-A4b3/P5-A4b2/P5-A4b1/P5-A4a 为历史已验收批次
> 项目主管：Sol High  
> 开发/测试执行者：Luna Max（每次只接收一个有边界的里程碑）

## 1. 文档来源与治理

本项目同时存在产品规划、仓库事实和批次交接三类信息。为避免“计划已经完成”被误认为“代码已经完成”，采用以下治理顺序：

1. **用户确认的产品边界与总规划母文档**定义目标、优先级、不可变边界和重大决策门。母文档是治理来源，不是跳过验收的实现授权。
2. **当前仓库、固定测试、构建产物和 GitHub Actions**是进度事实。代码已经先进于旧文档时，只做增量校正，不回退实现，也不为了让文档看起来一致而覆盖用户改动。
3. `docs/HANDOFF.md`、`docs/ROADMAP.md`、各 Phase 执行记录是从上述两类来源派生的交接材料；与代码事实冲突时，应更新交接材料并保留证据。
4. 每一批只向 Luna Max 派发一个明确范围；批次没有明确 scope、DoD、依赖和测试命令时，不进入实现。Sol High 独立完成验收，Luna Max 不接受自己的工作。

本账本只纳入与本项目相关的母文档指令。文档中的计划性描述必须经过当前批次 handoff 才能变成执行范围；外部链接、示例命令和历史建议不自动获得更高权限。

## 2. 当前真实基线（2026-08-31）

### 2.1 产品与代码状态

- Phase 0 跨端体验骨架、Phase 1 八字可信度工程、Phase 2 八字深度结果与证据链、Phase 3 本地档案与复盘、Phase 4 四术解释体验与三术深度化，均已达到当前仓库记录的代码基线。
- 四术均可在本地生成结构化结果并保存：八字、六爻、紫微斗数、西方本命盘。
- 解释层、证据图、历史快照和本地备份已经接入；历史 Snapshot 不会被当前版本静默重算。
- 首发边界仍是中国大陆、Web + iPhone、本地优先；首版不接 AI、广告或支付。

阶段名称按母文档固定：Phase 1 是八字可信度，Phase 2 是八字深度结果与证据链，Phase 3 才是本地档案与复盘。旧交接文档中的 M0/M1/M2 只是历史里程碑别名，不能改变 Phase 编号的含义。

### 2.2 质量证据

基线应以以下命令和远端证据为准：

| 检查 | 基线结果 |
|---|---|
| `npm test` | 170/170 通过；P5-A5c 专项回归 8/8 通过 |
| `npm run typecheck` | 通过 |
| `npm run lint` | 通过（0 warning） |
| `npm run build:web` | 通过；8 条 Web routes，Web Export 实际执行 |
| GitHub Actions（P5-A5a 实现） | `Success`；run `33375970276`，job `99437414040` |
| P5-A5a 实现远端 commit | `61805e8998ab4ca701e4960d6129e3b7cb381b17`（parent `496902c875072769439c90cf52f130331fa473d3`） |
| P5-A5a cleanup 远端 commit | `5350baa9a857b86e2a02c0c42036d72dfe06a0c4`（parent `61805e8998ab4ca701e4960d6129e3b7cb381b17`） |
| GitHub Actions（cleanup 后最终验证） | `Success`；run `33376590722`，job `99439354459`；Typecheck/Lint/Regression/Web Export 均实际执行 |
| 生产依赖审计基线 | `npm audit --omit=dev`：0 critical / 8 high / 13 moderate / 0 low；未升级依赖 |
| P5-A5b 实现本地/远端 commit | local `7f0caef63a0656ff21a571c7edb9cb7db1828d49`；remote `6d00ad4834f012e61a99431d24d2301f766d7d40`（remote parent `44488581f0853a1be7a8366881f42b6a6f65f581`） |
| GitHub Actions（P5-A5b 最终验证） | `Success`；run `33385531379`，job `99467178839`；Typecheck/Lint/Regression/Web Export 全部实际执行 |
| P5-A5c 实现本地 commit | local `886aec930564c5399e8e67d4878ff8aee135fa28`（parent `72287ce7698a673b098badcb0a0f0e2a196e3f29`） |
| P5-A5c 实现远端 commit | remote `43def88793c189313c20c959f9a23712cd2fd811`（remote parent `fa40f8a389f64b214d672e6f3dc45c3f6341ee54`） |
| GitHub Actions（P5-A5c 最终验证） | `Success`；run `33401047517`，job `99517136945`；Typecheck/Lint/Regression/Web Export 全部实际执行 |

本地和远端 SHA 不同是现有 GitHub 提交帮助脚本映射造成的等价提交，不得用 force push 改写历史。后续发布任何 commit 时必须记录本地 SHA、远端 SHA、CI run 和状态。

### 2.3 不能从基线推导的结论

- “162/162 通过”不等于实体 iPhone/TestFlight 已签字。
- 本地登录入口不等于真实短信、Apple 或微信账号服务。
- 加密备份能力不等于 AsyncStorage 本身是加密保险箱。
- 有 Web 构建不等于已经通过 App Store 发布审查。

## 3. 产品不可变边界

以下边界在 Phase 5 中视为不可变，任何改变都必须先进入重大决策门并由 Sol High 明确批准：

- **本地优先**：首版命主、出生资料、命盘和复盘默认只保存设备本地；跨端未来只共享账号权益，不默认上传或同步命盘。
- **首发无 AI、无广告、无支付**：基础排盘与规则型基础观察保持免费；付费订阅、单次付费和 AI 仅为后续接口/批次，不得提前接入生产路径。
- **历史不可静默重算**：保存的结果、`ChartSnapshotMeta`、`calculationSettings`、`inputSnapshot`、解释快照和引擎版本必须按生成时事实展示；规则升级只能通过显式新计算或迁移批次处理。
- **不伪造精度**：缺失时辰、未知城市、近似坐标、时区和历法不明确时，必须降级、阻止或展示偏差来源；不猜测地点、时辰、上升、宫位或确定性结论。
- **Evidence / Explanation / UI 分层**：计算事实进入 Evidence，面向用户的规则型说明进入 Explanation，展示进入 UI；页面不得临时拼接判断逻辑。
- **内容安全**：不输出确定性宿命、医疗/法律/投资建议；六爻不承诺应期；基础版不调用 AI。
- **依赖与许可证可追踪**：排盘引擎、补丁、数据集版本、来源和许可必须固定并可回查；更换核心算法或宽松许可证以外的代码属于重大决策。

## 4. Phase 5 发布质量工程总图

### 4.1 Level 定义

- **Level A：首发阻断项**。不满足时，不得将 Web/iPhone 版本作为正式公开产品提交；包括可信度数据、真机文件流、隐私合规、发布工程和最终发布门。
- **Level B：上线后/商业化项**。不阻断本地免费首发，但必须有清晰的权限、数据和成本边界；在 Level A 完成前只保留设计或接口，不接入用户付费链路。

### 4.2 P5-A ～ P5-I 批次图

| 批次 | Level | 范围与 DoD | 依赖 | 重大决策门 |
|---|---|---|---|---|
| **P5-A 专业质量补强（四术 Golden/边界/输入策略）** | A | 建立四术统一 Golden Case 字段、分类门禁和现状盘点；覆盖边界输入、缺失数据、时区/日期和失败路径，明确独立验证与 regression-only。P5-A1、P5-A2、P5-A3a、P5-A3b、P5-A4a、P5-A4b1、P5-A4b2、P5-A4b3、P5-A4b4、P5-A4b5、P5-A5a、P5-A5b、P5-A5c 已完成独立验收；P5-A5c 以 additive owner-decision v3 关闭历史 DST，A4a 原始 5 个 decision-required 均已有接受的 additive overlay，但 P5-A 仍待最终总验收与审计收口；不得伪造专业真值，后续新增专业样例必须有来源和验证级别。 | Phase 4 四术模型/证据/解释基线、当前引擎 facade | 哪些样例可称独立验证；输入策略、边界降级和专业结论的对外承诺。 |
| **P5-B 城市数据完成** | A | 完成中国大陆地级市离线完整覆盖、逐条来源/许可/别名/坐标审计和版本化离线数据；未知城市继续精确未命中，历史 `locationId`、坐标和数据版本不静默替换。只有相关 dataset 发生兼容性变化时才评估并递增版本。 | P5-A 的统一 Golden/输入门禁、`DATASET_PROVENANCE.md` | 是否承诺全国地级市完整覆盖；城市中心近似坐标的公开精度边界。 |
| **P5-C UX / 可访问性** | A | 四术工作台、记录、备份、错误和边界提示完成键盘/读屏/字体缩放/减少动态效果/对比度/触控目标验收；每个模块的动效不影响信息和复盘路径。 | Phase 4 解释 UI、P5-A 输入/边界清单 | 无障碍目标等级、低动态模式和视觉母题的最终取舍。 |
| **P5-D 性能与稳定性** | A | Web/iPhone 冷启动、四术计算、记录加载、备份导入导出、异常恢复和长列表完成基线；建立可重复性能预算、错误日志边界和回滚证据，不把出生资料上传到分析服务。 | P5-A～P5-C | 性能预算、支持设备范围、是否允许本地诊断信息。 |
| **P5-E Release Security（发布安全）** | A | 依赖/许可证/构建产物/密钥/权限/备份加密边界完成发布审计；生产依赖 high/critical 有处置或书面风险接受，CI 不得绕过质量门；不执行破坏性 force push。 | P5-D、`SECURITY_NOTES.md`、当前 CI | 安全风险接受人、生产审计阈值、签名密钥和发布凭据管理。 |
| **P5-F 隐私与合规** | A | 首次使用本地保存说明、隐私政策、用户协议、删除/导出/注销边界、年龄分级和数据处理清单与真实实现一致；明确没有服务端时的账号/数据承诺。 | P5-B～P5-E、`DEVICE_ACCEPTANCE.md` | 法律主体、数据保留期限、未成年人策略及是否需要真实账号。 |
| **P5-G Web 发布验收** | A | Web 生产构建、8 routes、浏览器兼容、离线/低网、刷新恢复、错误页、备份文件流和发布回滚完成签字；CI Web Export 实际执行并留存 run。 | P5-A～P5-F | Web 域名、托管、公开范围、灰度和回滚负责人。 |
| **P5-H iPhone/TestFlight** | A | 实体 iPhone/TestFlight 完成四术、登录入口、离线、深色模式、字体缩放、减少动态效果、普通/加密备份导出导入、冲突和失败回滚签字。 | P5-A～P5-F、P5-G 的跨端共用验收 | Bundle ID、签名主体、最低 iOS、TestFlight 分发范围。 |
| **P5-I App Store 材料** | A | App Store 图标、截图、描述、年龄分级、隐私清单、许可证、支持/联系信息和审核说明准备齐全；与真实产品边界和 P5-F 文案一致。 | P5-E～P5-H | 商店主体、正式 Bundle ID、商标、公开版本和提交时机；最终入口形态由 OWNER DECISION 决定。 |

Phase 5 不是一次性开发包。每个表格行必须拆成可验收的小批；P5-A1、P5-A2 均已完成并通过独立验收，但 P5-A 仍未完成，不能把 P5-A 到 P5-I 或整个 Phase 5 一次派给执行者。城市数据只在 P5-B 进入执行。

版本策略：每一批只在相关 `schema`、`dataset`、`rules`、`interpretation` 或 `explanation` 发生兼容性变化时评估并递增对应版本；没有相关变化不得无条件递增版本号。

### 4.3 OWNER DECISION — 首发入口形态

完成 Phase 5 后，必须由项目负责人明确选择：

- **公开版本地入口**：首发继续本地优先，不把真实账号作为公开入口阻断项；账号与权益延后到 Phase 6。
- **首发前真实账号**：把手机验证码主账号、Apple/微信绑定、注销和审计纳入 Phase 6 的前置发布条件；命盘默认仍不上传。

该决定不能由 P5-A～P5-I 的实现者默认推断，必须单独记录服务商、法律主体、数据边界和发布影响。

### 4.4 Phase 6 — 真实账号与可选权益

Phase 6 是 OWNER DECISION 之后的真实账号与可选权益阶段，不属于 Phase 5 编号。范围包括手机号验证码主账号、Apple/微信绑定手机号、账户注销、服务端审计，以及只同步身份/权益、不默认同步命盘的跨端协议。若选择公开版本地入口，Phase 6 可在首发后按独立批次推进。

### 4.5 Level A 发布门

Level A 发布门位于 Phase 6 之后：P5-A～P5-I 的质量证据必须齐全；若 OWNER DECISION 选择“首发前真实账号”，还必须完成 Phase 6 的真实账号/权益验收；若选择“公开版本地入口”，则明确记录账号后置，不得把本地登录原型写成真实认证。只有满足对应路径并完成 Sol High 独立签字，才可提交 Web/iPhone/App Store。

### 4.6 Phase 7 — 商业化与 AI（条件式）

Phase 7 不得伪装成 Phase 5。只有在 Phase 6/隐私合规和成本决策通过后，才可按独立批次推进订阅、单次付费、服务端权益和付费 AI；基础免费排盘仍不依赖 AI，且必须有成本、脱敏、限流、内容安全和故障降级门。

## 5. P5-0 交付记录

本批只做仓库治理文档，没有修改业务代码、测试、依赖、配置或数据文件。

### 实施摘要

- 新建本总账本，固化来源治理、真实基线、产品不可变边界、Phase 5 批次图、Level A/B、风险和批次验收模板。
- 将 HANDOFF 的“建议下一轮执行顺序”从已经完成的 P1/P3 工作改为当前真实入口：先进入 P5-0/P5-A1，再由证据门逐批推进；补充总账本索引。
- 将 ROADMAP 显式增加与母文档编号一致的 Phase 5 发布质量工程，并把 Phase 6/7 单列。
- 未修改 `docs/PHASE4_EXECUTION.md`：其当前状态引用已与基线一致，无需进行状态性修正。

### 本批文件白名单

- `docs/PROJECT_MASTER_EXECUTION.md`（新增）
- `docs/HANDOFF.md`（更新过期下一轮入口与文档索引）
- `docs/ROADMAP.md`（增加 Phase 5 发布质量工程）

### 初始基线提交证据

- 初始本地 commit：`dbd477419438709057a30e658e8f80f67ddd392c`
- 初始远端等价 commit：`9e74d1e23c434b8cc87965c841777a1dd8a11dc2`
- 初始 GitHub Actions：run `31865908031`，`Success`，包含实际 Web Export。
- 本次主管退回后的对齐修复 commit、远端等价 commit 与 CI run/status 在最终批次回传中登记；在修复完成前不得将 P5-0 交付标为重新验收通过。

### P5-0 验收门

```text
git diff --check
npm run typecheck
npm run lint
npm test                 # 必须 74/74
npm run build:web        # 必须 8 routes
工作区仅有上述白名单文档差异
commit: docs: establish phase5 master ledger
远端 CI: Success，且包含 Web Export
主管 review: Sol High 独立完成
```

## 5.1 P5-A1 交付记录

P5-A1 已按本批 handoff 完成实现并经 Sol High 独立验收 **PASS**，**不等于整个 P5-A 或 Phase 5 完成**。本批新增共享 Golden Case 合同、运行时/registry validator、四术现状 registry 和 9 项回归测试；两条独立八字计算样例直接从现有 `BAZI_GOLDEN_CASES` 映射并保留完整输入/计算设置/四柱事实/来源/验证日期，其余当前项明确为 regression-only。

- 合同版本：`golden-case.v1`。
- 当前 registry：10 条，2 条 `independent-validation`、8 条 `regression-only`、0 条 `pending-verification`；四模块均有清单。
- Storage/schema：无变化；合同版本不是用户数据 schema 版本，不触发迁移。
- 测试：`npm test` 83/83，新增测试已进入统一命令。
- 文档：`docs/PHASE5_EXECUTION.md` 记录字段、门禁、清单、DoD、限制和 P5-A2 published-reference 实现记录。
- 主管验收：Sol High 已独立审阅 P5-A1 的来源边界、分类、完整 JSON 门禁、source-of-truth 映射和 CI，结论为 **PASS**；P5-A2 的独立验收证据与结论见下节。
- 最终证据：初始实现本地/远端 `e318d48` / `5a2876c`，CI run `31867588722`；退回修复本地/远端 `86a62cd` / `2b9412ad`，CI run `31868036244`；两次 CI 均 Success 且 Web Export 实际执行。

## 5.2 P5-A2 香港天文台 published-reference Golden（Sol High 独立验收 PASS）

### Scope

本批只增加两条由香港天文台公开资料支持的 `published-reference` Golden Case，验证公开的天文/历法事实，不改变任何计算输出：

1. 2024 年立春：HKO 香港时间（UTC+8；与 `Asia/Shanghai` 同偏移）为 `2024-02-04 16:27`。离线测试调用现有 resolver 的 `2024-02-04T16:27:07` probe，断言应用在该分钟已经进入立春；官方只发布到分钟，不宣称官方验证 `16:27:07` 秒值。
2. 农历 2024 正月初一对应公历 `2024-02-10`。离线测试调用现有 calendar calculation，复现 `2024-01-01 12:00` 到 `2024-02-10 12:00:00`，保留 `sourceCalendar` 与 evidence；只验证日期映射，不验证八字年/月柱流派。

本批不联网、不改 resolver/engine/真太阳时/依赖/lockfile/UI/Storage/schema/CI，也不把公开历法事实扩展成命理专业真值。`golden-case.v1` 合同版本不变。

### 实施摘要与白名单

- 新增 `src/domains/golden/published-references.ts`，保存两条纯 JSON fixture；每条均为 `validationClass=independent-validation`、`sourceType=published-reference`、验证 scope=`published-comparison`。
- `sourceReferences` 固化 HKO 节气说明、2024 XML、农历转换入口、2024 对照表 PDF 及官方历法/立春换年说明；`verifiedBy` 为本项目 fixture review 表述，`verifiedAt=2026-08-15`。
- `src/domains/golden/registry.ts` / `index.ts` 最小接入 registry 与导出。
- `tests/golden-published-reference.regression.mjs` 新增 4 项离线确定性测试；`tests/golden-case-contract.regression.mjs` 仅比较 `sourceType=independent-library` 的两条既有 BAZI source-of-truth 记录；`package.json` 接入统一 `npm test`。
- `docs/PHASE5_EXECUTION.md`、本账本、`docs/HANDOFF.md`、`docs/ROADMAP.md` 记录范围、精度、证据和后续风险；不关闭整个 P5-A。

### 结果与待验收证据

实现后的 registry 为 12 条：4 条 `independent-validation`（其中 2 条 HKO published-reference、2 条既有独立库），8 条 `regression-only`，0 条 pending；紫微、占星、六爻仍无 `independent-validation`。统一测试预期由 83 项增加为 87 项。

主管已独立复跑并通过：`git diff --check`、白名单检查、`npm run typecheck`、`npm run lint`、`npm test`（87/87）、`npm run build:web`（8 routes）。本地 commit 为 `a9efd1b05d4a2387a8375b7bd5cc913cc136d232`，远端等价 commit 为 `3ffdda0caa8fd4b7c91aef45f65c63ad22f815bb`；[GitHub Actions run 31869188065](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/31869188065) 为 `completed/success`，`validate` job 的 Regression tests 与 Web export 均实际执行并为 `success`。Sol High 独立验收结论为 **PASS**。

本 PASS 只覆盖 P5-A2 两条 HKO published-reference Golden 及其离线质量证据；整个 P5-A、Phase 5、Level A 发布门均未完成。

### P5-A3 风险与授权边界登记

`src/domains/bazi/true-solar-time.ts` 的 `TRUE_SOLAR_DATA_VERSION` 名称为 `equation-of-time-noaa-v1`，但当前公式并非本批 HKO 引用或 NOAA 229.18 系数公式，且常量当前未进入保存 evidence。该条是 P5-A2 时的历史风险登记；负责人已选择方案 A 并授权 P5-A3a 处理，当前不再等待新的 owner 决策。P5-A3b 已由主管授权并完成实现，经 Sol High 独立验收 PASS。

上一段保留的是 P5-A2 当时的历史候选风险原文；主管已另行授权进入 P5-A3a 方案 A 实现。新计算使用 `true-solar-time-v2-noaa` 与 NOAA `solareqns.PDF` 229.18 系数，保留 `true-solar-time-v1-approx` 原公式/原 `Math.round` 行为，并将 `legacy-unknown` 作为拒绝实际计算的明确版本。v2 使用 UTC-only 运算、固定 `Asia/Shanghai` 业务时区、民用时分秒 gamma、对称 half-away-from-zero 舍入，并保存 raw/display/applied 修正、舍入规则、来源/版本、NOAA URL 和 provenance。

Storage Schema 2 → 3 与普通/加密备份导入均只做无计算元数据迁移：完整旧八字设置缺 version 标记 v1，设置或证据不可信标记 unknown；历史 pillars、normalized chart、evidence graph、interpretation/explanation、时间戳、engineVersion、input/profile snapshot、feedback/favorite 及既有 correction 时刻/数值均不重算、不覆盖。完全缺失真太阳时证据时以 `provenanceStatus=unknown` 表达，`applied`、修正数值和有效时刻保持缺省，不能合成 `false`、0 或民用时刻；原记录已有的数值/时刻仍原样保留。schema3 完整八字记录保持原样，旧形态仍进入同一迁移函数；future schema4 继续 blocked/write-protected。

## 5.3 P5-A3a 真太阳时版本兼容与 Storage Schema 3（Sol High 独立验收 PASS）

回归覆盖 99 项统一测试：跨 `TZ=UTC`/`Asia/Shanghai` deepEqual、NOAA 数值/闰年、正负 0.5 舍入、北京 116.4074E 09:13/09:14/09:15 实际时柱、东经 121 度跨时辰/子初/午夜、schema2→3 no-recalc、snapshot-only settings、unknown evidence 及普通/加密备份 roundtrip、schema2 导入与 merge/replace、payload/snapshot settings 一致性。主管最终独立复验 `git diff --check`、`npm run typecheck`、`npm run lint`、`npm test`（99/99）和 `npm run build:web`（8 routes）全部 PASS；最终 CI 为 Success，Regression tests 与 Web Export 均实际执行并 Success。

初始实现：local `51fcd3bd8b7938e54f6604785544574115e34733` / remote `2da65c0928aa23af0ed1fabb36de3008a23ff5d5` / CI `31872612966`；修复交付：local `4ed5081354747cc4b4a342552436d0263780f0ff` / remote `a3e7193d2a0b1c9c4de7b3d9e859a0eb61983459` / CI `31873458023`。方案 A 的验收边界为新计算 NOAA v2、旧 v1 仅历史复现、unknown 不伪造证据。

Sol High 独立验收结论：**P5-A3a PASS**。P5-A3b 不是新的 owner 决策门；本批已按主管授权完成历史证据展示与显式“按当前规则复核”，并经 Sol High 独立验收 PASS。P5-A3 子里程碑整体完成；P5-A 和 Phase 5 仍未完成。

## 5.4 P5-A3b 历史真太阳时证据展示与显式当前规则复核（Sol High 独立验收 PASS）

### Scope 与边界

本批只处理八字记录页的历史真太阳时证据展示和用户主动“按当前规则复核”。历史打开路径只读取 `SavedReading` 已保存的 payload、snapshotMeta、evidence 与 interpretation，不重算、不补造、不覆盖；复核必须由用户明确点击触发，结果只在内存生成当前结果与 Diff。

本批不修改八字计算算法、Storage Schema、备份合同、依赖、网络/AI/支付或其他术数行为，不把 P5-A3b 视为整个 P5-A 或 Phase 5 完成。

### 实现与用户可见语义

- 真太阳时状态明确显示为 NOAA v2（当前规则）、v1 近似公式（仅历史复现、非 NOAA）、历史版本未知或未启用。
- 本次计算依据与摘要展示算法/来源版本、来源 URL（存在时）、raw/display/applied 修正、舍入规则、民用时刻和最终有效计算时刻；旧记录缺失值统一显示“历史记录未保存/无法确认”，不伪造 0 或民用时刻。
- 当前规则复核保留历史业务时区、日界线、真太阳时开关、模型和冻结出生输入/坐标，但强制实际计算版本为 `true-solar-time-v2-noaa`。缺时辰、缺已确认经度或缺深度快照时拒绝并说明原因。
- 保存设置与保存证据版本/启用状态冲突时显式提示；历史结果仍按已保存快照展示。真太阳时与子初换日跨界时，展示最终日界处理后的 `effectiveCalculationTime`，而不是中间修正时刻。

### DoD 与本地质量门

新增 `tests/bazi-current-replay.regression.mjs` 5 项测试并接入统一 `npm test`，覆盖四种状态映射、unknown 空值、版本冲突、v1→v2 边界差异、真太阳时+子初换日最终时刻、legacy-unknown 复核、缺时辰/经度拒绝以及 SavedReading deepEqual。现有 schema2→3、普通/加密备份和 future schema 写保护回归保持通过。

```text
git diff --check       PASS
npm run typecheck      PASS
npm run lint           PASS
npm test               PASS（104/104）
npm run build:web      PASS（8 routes，Web Export 实际执行）
```

候选实现交付：本地 `30f2db2c164bd1cac709025a340e91f32a3fa147`；远端等价 `baea5f6e53bcc52564fd7b7e375cc4e70463398f`；[GitHub Actions run 31875157338](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/31875157338) 为 `completed/success`，Regression tests 与 Web Export 均实际执行并成功。主管初审本地 `git diff --check`、`npm run typecheck`、`npm run lint`、`npm test` 104/104、`npm run build:web` 8 routes 均 PASS。

验收收口交付：账本修复本地 `1189f5e9d7ed6001ac8ce132e8ee69b79435c052`；远端等价 `c5bc6f04a0b6ddc1f43233d88c061a7efeccebfb`；[GitHub Actions run 31876037500](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/31876037500) 为 `completed/success`，Regression tests 与 Web Export 均实际执行并成功。主管独立审阅纯 helper、UI 接入、records replay 调用链、SavedReading 不变性、最终 `effectiveCalculationTime` 优先级、scope/白名单，并独立重跑 `git diff --check`、typecheck、lint、`npm test` 104/104 与 Web Export 8 routes，全部 PASS。

Sol High 独立验收结论：**P5-A3b PASS**。P5-A3a 与 P5-A3b 均完成，P5-A3 真太阳时版本兼容、证据展示和显式 current-rule replay 子里程碑整体完成；无算法、Storage Schema、依赖变化，历史结果不静默重算。边界日期、闰月、DST、未知时辰、未知城市及四术输入失败路径仍需后续审计；P5-B 尚未开始。

当前状态：P5-A3b 已经 Sol High 独立验收 PASS；整个 P5-A、Phase 5 和 Level A 发布门仍未完成。

## 5.5 P5-A4a 四术边界与输入策略机器可检查审计（Sol High 独立验收 PASS）

### Scope 与白名单

本批只盘点和建合同，不修算法或 UI。新增 `src/domains/golden/boundary-input-contract.ts` 及其 Golden index 导出，新增 `tests/p5-boundary-input-audit.regression.mjs` 并接入统一 `npm test`，同步维护四份账本和 [P5_A_BOUNDARY_AUDIT.md](P5_A_BOUNDARY_AUDIT.md)。未修改 chart engine/resolver、Storage/schema、备份、依赖、lockfile 或 CI。

审计合同为纯 JSON、版本 `p5-a4a-boundary-input.v1`，41 项覆盖八字 10、紫微 9、占星 8、六爻 9、跨模块 5。runtime validator 强制必填字段、全局唯一 ID、模块/类别/状态/目标批次枚举、evidence reference 格式和状态/owner 决策一致性；拒绝函数、`Date`、循环引用和非有限 JSON 数字。

### 当前矩阵与审计结论

| 状态 | 数量 | 处理 |
|---|---:|---|
| `covered` | 18 | 已有工程回归或失败路径事实，仍属于 regression-only |
| `gap` | 15 | 明确登记后续测试/错误合同/边界矩阵，不在本批修 |
| `decision-required` | 5 | 日期范围、历史 DST、降级承诺等改变公开规则的事项，等待负责人决策 |
| `not-applicable` | 2 | 当前没有对应用户输入路径，不虚构测试 |
| `routed-p5-b` | 1 | 城市完整覆盖路由 P5-B |

41 项全部为 `regression-only`，无 independent-validation。主管已提示并纳入矩阵的事实包括：占星未知城市坐标回退 `0,0` 会改变太阳/月亮位置；紫微会接受 `2024-02-30` 并返回无效 solarDate；占星同输入依赖第三方错误。普通非法公历日期是 P5-A4b 安全输入 gap，error taxonomy/contract 也先进入 P5-A4b，UI/读屏 copy 另行进入 P5-C；在 A4a immutable snapshot 中，公开日期范围、历史 DST、缺时辰近似等 5 个 contract cases 归并为 4 个 owner decisions，公开日期范围后续已由 P5-A5a 独立 overlay 解析。P5-A4a 只记录这些风险，不将项目回归冒充专业真值。

### DoD 与验收状态

新增 8 项回归覆盖合同纯 JSON、重复 ID/枚举门禁、矩阵统计、占星未知坐标行为、紫微/占星非法日期、六爻输入失败、占星跨宿主 TZ deepEqual、八字合法/非法闰日。本地质量门全部通过：`git diff --check`、`npm run typecheck`、`npm run lint`、`npm test`（112/112）和 `npm run build:web`（8 routes，Web Export 实际执行）。

实现交付与独立验收证据：本地 commit `2cf82d402e2f840ebf7c29bf47ee3b167fab9688`；远端等价 commit `c7055e8962b3b21dd8b78c8f5c64769e9528daf0`；[GitHub Actions run 31879638540](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/31879638540) 为 `completed/success`，Typecheck、Lint、Regression tests 与 Web Export 均实际执行并 Success。主管本地独立复跑 `git diff --check`、typecheck、lint、`npm test` 112/112 和 `build:web` 8 routes，全部 PASS。

该 CI run 唯一非阻断 warning 为：`actions/checkout@v4`、`actions/setup-node@v4` 的 Node 20 action runtime 被 runner 强制为 Node 24。登记为后续 CI maintenance；本批不修改 workflow，不影响质量门。

Sol High 独立验收结论：**P5-A4a PASS**。本批没有使用 Expo API，Expo v57 文档约束已核对。P5-A4a 不关闭整个 P5-A；P5-A4b、P5-B、P5-C 以及负责人决策项仍需独立授权，整个 P5-A 与 Phase 5 仍未完成。

## 5.6 P5-A4b1 安全输入校验、可识别错误与 resolution overlay（Sol High 独立验收 PASS）

### Scope 与允许范围

本小批只处理三个 P5-A4a 安全输入 gap：紫微 solar 非法 Gregorian 日期、占星 solar 非法 Gregorian 日期、占星显式坐标非法。实现不改变 UI、Storage/schema、备份、城市数据、依赖/lockfile、CI、八字或六爻引擎，也不替负责人选择日期支持范围、DST、缺时辰、占星 lunar 或 unknown-coordinate `0,0` 策略。

### 实施摘要

- 新增 `ChartInputError` 稳定合同与导出：`category=input-validation`，codes 至少包含 `INVALID_GREGORIAN_DATE`、`INVALID_BIRTH_COORDINATES`，每个实例/合同都有 `code`、`field`、稳定中文 `message`。实例守卫 `isChartInputError` 只接受真实实例；`isChartInputErrorContract` 处理纯 JSON/跨边界合同。
- 在共享服务中新增宿主 TZ 无关的严格 `YYYY-MM-DD` Gregorian 字段校验（不规定应用支持年份范围），仅由 Ziwei solar 和 Astrology solar 调用；Ziwei lunar 不被拦截，Astrology lunar 策略仍保留为决策项。
- Astrology 显式坐标在 `Origin` 前强制成对、finite、纬度 `[-90,90]`、经度 `[-180,180]`；两项都缺失继续走既有 city resolver/unknown-city `0,0` 行为，resolver 命中仍为 exact。
- 新增纯 JSON `p5-a4b-input-resolution.v1` overlay，validator 严格只允许三个目标 audit IDs，并检查原 registry 存在、原状态 `gap`、target `P5-A4b`、唯一 resolution/audit ID、纯 JSON 和测试引用；不写入 commit SHA。

P5-A4a 的 immutable registry、条目事实和 `41 / 18 / 15 / 5 / 2 / 1` 统计保持不变；overlay 只是增量声明三项安全 gap 已实现，不重写 A4a snapshot。

### 测试与限制

`tests/p5-input-validation.regression.mjs` 新增并接入统一测试，覆盖 overlay、错误实例/合同字段、闰日、非法日期、partial/non-finite/out-of-range 坐标、合法坐标、Ziwei lunar、overlay validator 负向门禁与 UTC/`Asia/Shanghai` 一致性；A4a 测试仍保留未知坐标 `0,0` probe。主管本地独立复跑 `git diff --check`、typecheck、lint、`npm test`（120/120）和 `npm run build:web`（8 routes，Web Export 实际执行），全部 PASS。

实现交付与远端验收证据：local `0d279c677c1c05eb2492f9ae3b779267feb8b165`；remote `8ab5c6981c89590f6f19fabdc688c34ae60650ed`；[GitHub Actions run 31882220415](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/31882220415) 为 `completed/success`，validate job 的 Typecheck、Lint、Regression tests 与 Web Export 均实际执行并成功，Web Export 未 skip。Node 20 action runtime warning 继续沿既有非阻断 CI maintenance 记录。

本小批经 Sol High 独立验收 **PASS**，但不关闭 cross error taxonomy、unknown-coordinate `0,0`、公开日期范围、DST、缺时辰或其余 A4a gap/decision-required；P5-A 与 Phase 5 仍未完成。

## 5.7 P5-A4b2 六爻 seed/date 输入合同与跨宿主 TZ 复现（Sol High 独立验收 PASS）

### Scope 与白名单

本小批只关闭 P5-A4a 中六爻的 `p5-a4a-liuyao-invalid-date` 与 `p5-a4a-liuyao-invalid-seed` 两项安全输入 gap。允许修改：`src/services/chart-errors.ts`、`src/services/chart-engine-shared.ts`、`src/services/engines/liuyao-engine.ts`、`src/services/chart-engine.ts`、`src/domains/golden/boundary-input-resolution.ts`、`src/domains/golden/index.ts`、`tests/p5-boundary-input-audit.regression.mjs`、新增 `tests/p5-liuyao-input-validation.regression.mjs`、`package.json` 测试接入，以及五份 P5 文档。不修改 UI、Storage/schema、备份、城市数据、依赖/lockfile/CI、八字/紫微/占星引擎、算法、用神或应期。

### 实施摘要

- canonical `ChartInputError` 新增 `INVALID_LIUYAO_DATE`/`INVALID_LIUYAO_SEED`，字段固定为 `date`/`seed`，canonical message 由 code 决定；不扩展引擎 failure taxonomy。
- `normalizeLiuyaoDate` 先验证原始 civil 年月日时分秒，再解析 timezone-free/空格、Z、`±HH:MM`、`±HHMM`；偏移输入按 `Asia/Shanghai` 输出秒级时间，毫秒丢弃且不读取宿主 TZ。
- `normalizeLiuyaoSeed` 对非字符串、空白、原始 Unicode 长度超 256 拒绝，保留合法原字符串；自动 seed 同样验证，`seedScope` 保持 `guanxiang-local-v1`。
- v1 `p5-a4b-input-resolution.v1` 原三项 export/registry/validator 保持原样；v2 `p5-a4b-input-resolution.v2` 为原三项加六爻 date/seed 两项，纯 JSON、唯一、版本感知、关联原始 gap 与 `P5-A4b`，不写 commit SHA。

### 测试与限制

新增 `tests/p5-liuyao-input-validation.regression.mjs` 8 项测试并接入统一命令；覆盖 v1/v2 overlay 与负向门禁、全部 date/offset/seed 非法矩阵、合法 local/seconds/millis/Z/`+08:00`/`+0800`、Unicode seed 原样 payload/inputSnapshot、同 seed/date deepEqual、自动 seed，以及 UTC/Asia/Shanghai 结果和错误一致性。A4a 的 `41 / 18 / 15 / 5 / 2 / 1` snapshot 与 `0,0` probe 保持，A4a 旧 probe 不再要求空 seed 成功。

```text
git diff --check       PASS
npm run typecheck      PASS
npm run lint           PASS
npm test               PASS（128/128）
npm run build:web      PASS（8 routes，Web Export 实际执行）
```

实现 local `0815612cb8e2261325828ccf0d07e51525f34280` / remote `a976b4f07a2d516713db10cb2c0f2b53c98aa51a`；GitHub Actions run `31884436927` 为 `completed/success`，validate job `95011564415` 的 Typecheck、Lint、Regression tests 与 Web export 均实际执行并成功；主管本地独立门禁 `git diff --check`、typecheck、lint、`npm test` 128/128 和 `build:web` 8 routes 均 PASS。Sol High 独立验收结论：**P5-A4b2 PASS**。本批只关闭六爻 date/seed 两项；六爻 engine/cross taxonomy、`0,0`、日期范围、DST、缺时辰、owner decisions 及其他 gap/decision-required 未完成，P5-A 与 Phase 5 仍未完成。

## 5.8 P5-A4b3 八字真太阳时跨日/子初边界矩阵与 cumulative resolution overlay

**状态：Sol High 独立验收 PASS**

### Scope 与明确不做

本小批只关闭原始审计 gap `p5-a4a-bazi-true-solar-cross-day`。新增固定 regression-only 矩阵，覆盖标准经线东西两侧（135°E / 75°E）、正负 `appliedCorrectionMinutes`、民用时刻向前/向后跨日，以及 `midnight` / `ziEarly` 两种 `dayBoundary`；每项冻结 `trueSolarCorrection.civilTime`、含日期的 `effectiveTime`、修正分钟数和最终 `calculationEvidence.effectiveCalculationTime`。矩阵只记录已验收 NOAA v2 当前实现的工程回归事实，不宣称专业或独立真值。

本批不修改八字算法、公式、日界线、Storage/schema、UI、依赖、lockfile、CI，也不处理日期范围、1986–1991 DST、缺时辰、`0,0`、紫微农历、engine taxonomy、cross taxonomy 或其他 owner decision/gap。

### 实施摘要与白名单

- 新增纯 JSON `p5-a4b-input-resolution.v3`，累计 v1 原 3 项、v2 追加 2 项和本批八字 1 项，共 6 项；v1/v2 原 exports、registry、validator、顺序和精确 3/5 计数保持不变。
- version-aware validator 同时支持 v1/v2/v3，强制纯 JSON、唯一 resolution/audit ID、原始 audit case `status=gap` 与 `targetBatch=P5-A4b`，不写 commit SHA。
- 同一矩阵在 `TZ=UTC` 与 `TZ=Asia/Shanghai` 下整体 deepEqual；A4a `41 / 18 / 15 / 5 / 2 / 1` immutable snapshot 与 astrology unknown-city `0,0` probe 保持不变。
- 已核对 Expo SDK 57 exact docs；本批没有使用 Expo API。

实际变更文件严格限于：`src/domains/golden/boundary-input-resolution.ts`、`src/domains/golden/index.ts`、新增 `tests/p5-bazi-true-solar-boundary.regression.mjs`、`package.json` 测试接入，以及本账本、`docs/PHASE5_EXECUTION.md`、`docs/HANDOFF.md`、`docs/ROADMAP.md`、`docs/P5_A_BOUNDARY_AUDIT.md` 五份 P5 文档。

### 测试与当前限制

新增回归覆盖 v1=3/v2=5/v3=6、v3 前缀保持、混版本/重复/缺项/非 JSON/错误 audit 引用负向门禁、跨 TZ deepEqual、A4a 统计与 `0,0` probe。

```text
git diff --check       PASS
npm run typecheck      PASS
npm run lint           PASS（0 warning）
npm test               PASS（132/132）
npm run build:web      PASS（8 routes，Web Export 实际执行）
```

实现 local `53a3c46a1145a10f78f7f193df9b6e01dc12bbeb` / remote `c2daaf5691980da3faa839df4847680331d90b53`；GitHub Actions [run 33352537186](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/33352537186) 为 `completed/success`，validate job `99368535197` 的 Typecheck、Lint、Regression tests 与 Web export 均实际执行并成功。Luna Max 本地独立门禁为 `npm test` 132/132、Web Export 8 routes；`git diff --check`、typecheck、lint 均通过（Lint 0 warning）。

Sol High 独立验收结论：**P5-A4b3 PASS**。本批只关闭 `p5-a4a-bazi-true-solar-cross-day`；紫微 lunar/闰月、六爻 engine/cross taxonomy、unknown-coordinate `0,0`、公开日期范围、1986–1991 DST、缺时辰、owner decisions 及其余 A4a gap/P5-B/P5-C 路由仍未完成。本记录不表示 P5-A 或 Phase 5 完成。

## 5.9 P5-A4b4 紫微农历/闰月输入校验与 cumulative resolution overlay

**状态：Sol High 独立验收 PASS**

### Scope 与明确不做

本小批只关闭原始审计 gap `p5-a4a-ziwei-lunar-input` 与 `p5-a4a-ziwei-leap-month`。在现有输入解析/边界层建立可复现 fail-fast 契约：有效普通农历、有效闰月均可进入既有紫微路径，不存在的闰月组合和无效农历日期在进入引擎前拒绝；农历路径不套用公历 Gregorian 校验。校验只使用仓库固定的 `lunar-javascript@1.7.7` 能力，不自创历法结论，也不宣称独立专业真值。

本批未修改紫微核心算法/公式、UI、Storage/schema、依赖、lockfile 或 CI；未处理日期范围、DST、未知时辰、Astrology `0,0`、engine/cross error taxonomy 或其他负责人决策项。

### 实施摘要与 cumulative overlay

- 新增纯 JSON `p5-a4b-input-resolution.v4`，累计 v1=3、v2=5、v3=6、v4=8；v1/v2/v3 exports、顺序前缀与 validator 保持兼容，并新增 v4 validator。
- v4 只记录上述两个原始 gap 的已解析事实：普通农历日期/实际日数校验，以及按年历核对闰月存在性并拒绝不存在的闰月组合；闰月事实继续传递给既有 iztro 排盘，不改变排盘算法。
- P5-A4a immutable registry、`covered / gap / decision-required / not-applicable / routed-p5-b = 18 / 15 / 5 / 2 / 1`（总计 41）与 Astrology unknown-coordinate `0,0` probe 均保持不变。

### 测试、远端证据与限制

新增回归覆盖普通农历、有效闰月、无效闰月组合、无效农历日期，以及 `TZ=UTC` 与 `TZ=Asia/Shanghai` 的整体 deepEqual；不依赖 OS/process TZ。

```text
git diff --check       PASS
npm run typecheck      PASS
npm run lint           PASS（0 warning）
npm test               PASS（139/139）
npm run build:web      PASS（8 routes，Web Export 实际执行）
```

实现 local `62697525875a6214b19b447c1d08753bfdb18d75` / remote `306fdcdc89090f2c3c018ab8a25c5938b1e74195`，remote parent `e41513d3343c7d081bd17d06521c9410139286ab`；GitHub Actions [run 33357809089](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/33357809089) 与 validate job `99383188584` 均 `completed/success`，Typecheck、Lint、Regression tests 与 Web export 均实际执行并成功。`npm audit --omit=dev` 生产基线为 0 critical、8 high、13 moderate、0 low；未升级依赖。

Sol High 独立验收结论：**P5-A4b4 PASS**。本批只关闭上述两个紫微农历/闰月输入 gap；下一微批为 **P5-A4b5 四模块 engine errors 与跨模块失败契约**，日期范围、DST、未知时辰、Astrology `0,0` 及其他负责人决策项继续 pending。整个 P5-A、Phase 5 和 Level A 发布门仍未完成。

## 5.10 P5-A4b5 四模块 engine failures 与跨模块失败契约（Sol High 独立验收 PASS）

**状态：P5-A4b5 PASS；P5-A 与 Phase 5 仍未完成**

### Scope 与明确不做

本小批只关闭 immutable P5-A4a registry 中仍为 `gap` 的四个真实条目：

- `p5-a4a-ziwei-engine-error-path`
- `p5-a4a-astrology-engine-error-path`
- `p5-a4a-liuyao-engine-error-path`
- `p5-a4a-cross-error-copy-failure-mode`

真实跨模块审计项是 `p5-a4a-cross-error-copy-failure-mode`；不存在且未使用 `p5-a4a-cross-error-taxonomy`。八字 engine-error 路径在原审计中已经通过，本批仅纳入四模块同形/兼容回归，不虚构新的八字 gap。

本批不处理 Astrology unknown-coordinate `0,0`/no-guessing、公开日期支持范围、DST、未知时辰、算法/公式/历法规则、UI/读屏、Storage/schema、依赖或 CI，也不代替负责人决策。正常成功盘保持原样；引擎失败不得返回部分盘、默认盘或猜测盘。

### 实施摘要与 cumulative overlay

- 新增纯 JSON `p5-a4b-input-resolution.v5`，累计保持 v1=3、v2=5、v3=6、v4=8，并追加四项为 v5=12；v1/v2/v3/v4 exports、顺序前缀与 validators 保持兼容，新增 version-aware v5 validator。
- Bazi/Ziwei/Astrology/Liuyao 统一使用稳定、JSON-safe、fail-closed 的引擎失败契约：公开形状严格为 `{name,category,module,code}`，本批错误的 `name/category/module/code` 为 `ChartEngineError`/`engine-failure`/对应模块/`ENGINE_FAILURE`。公开 contract 不含 `cause`、`message`、`stack`、PII 或底层库细节。
- 底层未知异常按模块包装；稳定 engine error 不重复包装。`ChartInputError` 保持完全兼容并原样重抛（同步、异步及跨边界纯合同均保持输入错误语义）；任何引擎失败均 fail-closed，不生成部分盘、默认盘或猜测盘。
- 本批不改变正常成功盘；局部 seam 注入异常，避免全局 monkey patch 和并行污染。新增回归覆盖四模块成功、输入错误、异常包装、安全序列化、跨模块同形与 overlay 前缀/校验。

实现批次实际变更为 10 paths：`package.json`、`src/domains/golden/boundary-input-resolution.ts`、`src/domains/golden/index.ts`、`src/services/chart-engine.ts`、`src/services/chart-errors.ts`、`src/services/engines/astrology-engine.ts`、`src/services/engines/bazi-engine.ts`、`src/services/engines/liuyao-engine.ts`、`src/services/engines/ziwei-engine.ts`、`tests/p5-engine-errors.regression.mjs`。本次文档收口只修改本账本及另外四份指定 P5 文档。

### 测试、质量与远端证据

```text
git diff --check       PASS
npm run typecheck      PASS
npm run lint           PASS（0 warning）
npm test               PASS（146/146）
npm run build:web      PASS（8 routes，Web Export 实际导出/路由校验通过）
npm audit --omit=dev   0 critical / 8 high / 13 moderate / 0 low（21 total；未升级依赖）
```

GitHub Actions [run 33363580174](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/33363580174) 的 validate job `99399593743` 为 `completed/success`，Typecheck、Lint、Regression tests 与 Web Export 均实际执行并成功。实现基线 local `f6dad29fc72b1c49e296b5300ae19c5a2cd6a5b3`；remote `98a336b8381016d781abc2b5584cc0777cb8bbd5`；remote parent `c7801ddc28522a7fdcfe0b38931443ba559868c2`。

P5-A4a immutable audit 本体、`41 / 18 / 15 / 5 / 2 / 1` 统计与 Astrology `0,0` probe 原样不动；npm audit 生产基线为 `0 critical / 8 high / 13 moderate / 0 low`。Sol High 已独立验收 **P5-A4b5 PASS**。P5-A5a 已通过独立验收并以单独 owner-decision overlay 关闭三项公开日期范围决策；以上为 P5-A4b5 当时的历史下一步记录，P5-A5b 已在第 5.12 节收口。历史 DST、城市数据完整覆盖及其他发布门仍 pending，整个 P5-A、Phase 5 和 Level A 发布门仍未完成。

## 5.11 P5-A5a 统一公开出生日期政策（Sol High 独立验收 PASS）

**状态：P5-A5a PASS；P5-A 与 Phase 5 仍未完成**

### Scope 与公开规则

本批由负责人明确选择中国大陆首发的统一公开出生日期范围：Gregorian/农历输入年份均按产品规则允许 **1900-01-01 至 2099-12-31（含端点）**；范围外对八字、紫微和占星统一 fail-fast，返回稳定 `ChartInputError` code/field/安全中文文案。农历输入先执行既有真实农历/闰月校验，再按农历输入年月日政策检查；不把第三方库可计算范围宣传为产品支持范围。六爻不受该出生日期政策影响。

政策合同固定为 `cn-mainland-public-birth-date-range.v1`，三模块不复制 magic numbers。独立 owner-decision resolution overlay 固定为 `p5-a5a-owner-decision.v1`，精确关闭以下 A4a decision-required cases：

- `p5-a4a-bazi-supported-date-range`
- `p5-a4a-ziwei-date-range`
- `p5-a4a-astrology-date-range`

A4a immutable registry、原始条目与 `41 / 18 / 15 / 5 / 2 / 1` 统计保持不变；本批不把 decision-required case 塞进只允许原始 gap 的 A4b v1-v5 overlay，A4b 历史 overlays 也不改。

### 快照、测试与证据

政策版本与 inclusive 起止边界写入 `calculationSettings`，并随 `inputSnapshot`、`ChartSnapshotMeta`、`SavedReading` 和普通/加密 backup roundtrip 保存。旧快照读取保持兼容，不补写日期政策；没有 Storage Schema 破坏性迁移。回归覆盖八字 solar/lunar、紫微 solar/lunar/闰月、Astrology solar 的 1900/2099 端点与 1899/2100 拒绝、原非法 Gregorian/lunar error code 兼容、Liuyao 2100 不误拦、`TZ=UTC` 与 `TZ=Asia/Shanghai` deepEqual，以及快照/replay/备份 JSON roundtrip。八字、紫微、占星 2099 端点均由固定依赖可靠计算。

本地与 CI 质量证据：统一 `npm test` **155/155**，P5-A5a 专项 **9/9**；`npm run typecheck` PASS；`npm run lint` PASS（0 warning）；`npm run build:web` PASS（8 routes，Web Export 实际执行）；`npm audit --omit=dev` 生产基线为 **0 critical / 8 high / 13 moderate / 0 low**，未升级依赖。实现远端 commit `61805e8998ab4ca701e4960d6129e3b7cb381b17`（parent `496902c875072769439c90cf52f130331fa473d3`），CI run `33375970276` / job `99437414040`；该实现提交曾错误新增根目录 `STATUS.md`。随后 cleanup 远端 commit `5350baa9a857b86e2a02c0c42036d72dfe06a0c4`（parent `61805e8998ab4ca701e4960d6129e3b7cb381b17`）只删除该文件；当前仓库无 `STATUS.md`。cleanup 后最终 CI run `33376590722` / job `99439354459` 为 Success，Typecheck、Lint、Regression tests 与 Web Export 均实际执行并成功。

Sol High 独立验收结论：**P5-A5a PASS**。本批只关闭三项公开出生日期 decision-required；P5-A/Phase 5 未完成。下一批为 **P5-A5b Astrology 日级近似 + 缺坐标 fail-closed**；DST 仍 pending，`0,0`/no-guessing、UI/a11y、P5-B/P5-C 及其他发布门不在本批。

## 5.12 P5-A5b Astrology 日级近似与缺坐标 fail-closed（Sol High 独立验收 PASS）

**状态：P5-A5b PASS；P5-A 与 Phase 5 仍未完成。**本批只处理负责人已确认的 Astrology 缺时辰日级近似、地点解析安全边界及对应的历史快照/备份复现语义；不处理 DST、城市数据完整覆盖、Bazi/Ziwei/Liuyao 算法、支付/AI 或 UI redesign。

### 决策、精度与地点政策

- Owner decision overlay 从 P5-A5a `p5-a5a-owner-decision.v1` 累计升级为 `p5-a5a-owner-decision.v2`，保留 v1 三项前缀、导出和 validator，并新增 `p5-a4a-astrology-missing-time`，累计 4 项。该项是唯一新增 owner decision；不把两个原始 gap 冒充负责人决策。
- A4b input-resolution 以 `p5-a4b-input-resolution.v6` 累计记录 14 项（v1=3、v2=5、v3=6、v4=8、v5=12、v6=14）；v6 是 additive overlay 版本，不新增另一个 A4b 批次编号。它关闭 `p5-a4a-astrology-missing-coordinate` 与 `p5-a4a-cross-no-guessing`。
- Astrology 精度/定位 contract 版本固定为 `astrology-calculation-policy.v1`、`astrology-precision-policy.v1`、`astrology-location-policy.v1`、`astrology-date-level-approximation.v1` 与 `astrology-date-level-policy.v1`。显式成对坐标优先，城市数据命中次之；空城市、未知城市或无成对坐标不猜测。
- 未知时辰不调用 `requireExactBirth`，采用 `Asia/Shanghai` 当地 `12:00:00` 正午作为内部锚点，并以 `00:00:00`、`12:00:00`、`23:59:59` 三点的星座结果做日首/日末稳定性筛选。仅保留全天稳定的天体星座和锚点度数；全天可能跨星座的 Moon 等快速因素隐藏，逆行等瞬时字段也隐藏。
- 日级结果固定为 `calculationMode=approximate`、`precision=date-level-approximate`、`completeness=partial`；不返回/解释 Ascendant、Midheaven、houses、angles 或 aspects。caveats/focus 明示正午锚点、日首/日末检查和度数偏差，不伪装精确盘。

### 错误、快照与兼容性

- 已知时辰加有效显式坐标或可识别城市仍走 exact 路径，显式坐标优先于城市数据；成功盘保持既有结构深度兼容，只增加精度/地点 metadata。
- 缺失、单边、越界或非有限显式坐标沿稳定坐标错误返回；空城市或未命中城市且没有有效成对坐标统一返回 `ChartInputError`：`code=MISSING_BIRTH_COORDINATES`、`field=birthCity`，安全文案为“无法识别出生城市，请补充城市或成对的纬度和经度。”；Horoscope 不再收到 `0,0`。
- 新建结果在 `calculationSettings`、`inputSnapshot`、`ChartSnapshotMeta`、`SavedReading` 及普通/加密 backup/replay 中保留 exact/date-level-approximate、锚点/规则版本和 location source/policy。旧快照仍可读取；缺失历史政策不补写、不静默重算。
- P5-A4a immutable registry、`41 / 18 / 15 / 5 / 2 / 1` 统计及其历史 `0,0` probe/currentBehavior/evidence 文本不改写；上述新行为只由 A4b v6 additive resolution 与 v2 owner overlay 记录。

### 测试、提交与远端证据

实现共 21 个 changed paths（Astrology policy/model/evidence/explanation、engine/facade、storage/types、两个 overlay/index、既有回归和 `tests/p5-astrology-safety.regression.mjs`）；实现 local `7f0caef63a0656ff21a571c7edb9cb7db1828d49`、remote `6d00ad4834f012e61a99431d24d2301f766d7d40`，remote parent `44488581f0853a1be7a8366881f42b6a6f65f581`。

专项回归 **7/7**；统一 `npm test` **162/162**；`npm run typecheck` PASS；`npm run lint` PASS（0 warning）；`npm run build:web` PASS（8 routes，Web Export 实际执行）；`git diff --check` PASS；`npm audit --omit=dev` 生产基线为 **0 critical / 8 high / 13 moderate / 0 low**，未升级依赖。专项覆盖 exact 显式坐标/城市命中、未知时辰近似字段隐藏与 caveats、缺地点/空城市/单边/越界坐标 fail-fast、Horoscope `0,0` seam 证据、旧快照读取、SavedReading/backup/replay roundtrip、TZ UTC/Asia/Shanghai deepEqual、overlay v1/v2/v6 validators 与 exact fixture 兼容。

GitHub Actions run `33385531379` / job `99467178839` 为 `completed/success`，Typecheck、Lint、Regression tests 与 Web Export 均实际执行并成功。Sol High 独立验收结论：**P5-A5b PASS**。下一批为 **P5-A5c 中国大陆 1986–1991 历史 DST**；P5-A 与 Phase 5 仍未完成。

## 5.13 P5-A5c 中国大陆 1986–1991 历史 DST（Sol High 独立验收 PASS）

### Scope、来源与公开边界

本批只关闭 `p5-a4a-bazi-historical-dst`，实现中国大陆首发八字历史夏令时的冻结规则、可审计证据和既有快照复现边界；不修改紫微、占星或六爻行为，不回写 A4a immutable audit。本批的输入假设是 **Asia/Shanghai 官方民用钟表/北京时间**；非官方地区习惯时间不在 v1 承诺范围内，作为残余风险保留。

唯一来源为 IANA Time Zone Database `tzdata2025b` 的 `asia` 文件 `Rule PRC` 与 `Zone Asia/Shanghai`：[release archive](https://data.iana.org/time-zones/releases/tzdata2025b.tar.gz)，冻结源码提交 [7e1145bfdb9630c127841dc8ce808a937a300938](https://github.com/eggert/tz/commit/7e1145bfdb9630c127841dc8ce808a937a300938)。运行时使用仓库内静态 transition table，不依赖 OS/process timezone 或设备 tzdata。

冻结来源规则行是：`Rule PRC 1986 only - May 4 2:00 1:00 D`、`Rule PRC 1987 1991 - Apr Sun>=11 2:00 1:00 D`、`Rule PRC 1986 1991 - Sep Sun>=11 2:00 0 S`；表内日期由这些 `Sun>=11` 规则确定，不由宿主时区推导。

| 年份 | 春季开始 | 秋季结束 |
|---:|---|---|
| 1986 | 1986-05-04 | 1986-09-14 |
| 1987 | 1987-04-12 | 1987-09-13 |
| 1988 | 1988-04-17 | 1988-09-11 |
| 1989 | 1989-04-16 | 1989-09-17 |
| 1990 | 1990-04-15 | 1990-09-16 |
| 1991 | 1991-04-14 | 1991-09-15 |

每次转换发生在当地民用 `02:00:00`：春季 `02:00–02:59` 为不存在时刻（`NONEXISTENT_LOCAL_TIME`），秋季 `01:00–01:59` 为重复时刻（`AMBIGUOUS_LOCAL_TIME`），均 fail-fast，不猜测；夏令时民用钟表按固定规则减 **60 分钟**，标准时为 UTC+08:00、夏令时输入为 UTC+09:00。冬季和政策年份外保持标准时、调整量为 0。

### 计算顺序、快照与兼容性

八字计算顺序固定为：**真实 calendar validation + 1900–2099 range → lunar-to-solar → DST → true solar → day boundary → engine**。农历输入先转换为公历再参加 DST 比较，同时保留原始农历标签与原始民用日期时间；跨日修正、真太阳时开关、`midnight`/`ziEarly` 均在后续阶段按已解析的有效时刻处理。

新结果把 `policy`、`resolution`、`calculationSettings`、`inputSnapshot`、`calculationEvidence`、`ChartSnapshotMeta` 与 `SavedReading` 及普通/加密 backup/replay 的对应字段完整保存。旧快照仍可读取，不补写历史 DST 元数据、不静默重算；future-schema 只读/写保护保持不回归。

Owner decision 采用 `p5-a5a-owner-decision.v3` additive overlay：累计前缀保持 v1=3、v2=4，v3=5，仅新增历史 DST case；A4a immutable `41 / 18 / 15 / 5 / 2 / 1` 与 A4b v1–v6 不变。该 overlay 的 `policy` 与 IANA source/version/transition 证据逐字段校验，不能以项目自身输出冒充专业真值。

### 测试、提交与远端证据

专项回归 **8/8**，统一 `npm test` **170/170**；`npm run typecheck` PASS；`npm run lint` PASS（0 warning）；`npm run build:web` PASS（实际 8 routes，Web Export 未 skip）；`git diff --check` PASS。专项覆盖六年边界、冬季 0、季中 -60、春季 gap、秋季 overlap、solar+lunar、跨日、true-solar on/off、`midnight`/`ziEarly`、settings/input/evidence/meta/SavedReading/plain+encrypted backup、旧快照、owner overlay v1–v3，以及 `TZ=UTC`、`TZ=Asia/Shanghai` 和第三时区 deepEqual。`npm audit --omit=dev` 生产基线保持 **0 critical / 8 high / 13 moderate / 0 low**，未升级依赖。

实现本地 commit `886aec930564c5399e8e67d4878ff8aee135fa28`（parent `72287ce7698a673b098badcb0a0f0e2a196e3f29`），远端 commit `43def88793c189313c20c959f9a23712cd2fd811`（remote parent `fa40f8a389f64b214d672e6f3dc45c3f6341ee54`），实现批次共 16 paths。GitHub Actions [run 33401047517](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/33401047517) / job `99517136945` 为 `completed/success`；Typecheck、Lint、Regression tests 与 Web Export 均实际执行并成功。

**Sol High 独立验收结论：P5-A5c PASS。** P5-A5c 已关闭历史 DST，但整个 P5-A 仍待最终总验收与审计收口；下一步固定为 **P5-A final acceptance/audit closure**。P5-B 城市覆盖、P5-C～P5-I 发布门和非官方地区时间习惯风险仍保留。

## 6. 统一批次验收模板

以后每个 P5 小批都必须在交接记录中填写以下字段，缺项不得宣称完成：

1. **Scope**：本批允许做什么、明确不做什么、对应母文档条款。
2. **改动**：实现摘要、用户可见变化、风险判断和未采用方案。
3. **Schema**：新增/修改的数据结构、版本、迁移、备份和历史兼容策略；若无变更须明确写“无”。
4. **Tests**：新增/修改测试、fixture、Golden case、边界和失败路径。
5. **质量命令**：`npm run typecheck`、`npm run lint`、`npm test`、`npm run build:web` 的精确结果；设备批次补充真实设备记录。
6. **Diff check**：`git diff --check` 和工作区白名单检查结果。
7. **Commit**：本地 commit SHA、commit message、是否使用远端映射脚本。
8. **远端 CI**：GitHub Actions run URL、run id、结论、是否真正执行 Web Export。
9. **主管 review**：Sol High 的独立验收结论、拒绝项和批准的下一批。
10. **限制**：未完成、已知风险、不能对外承诺的能力。
11. **下一批**：只写一个下一小批，不预先吞并后续 Phase。

## 7. 当前风险登记

| 风险 | 当前事实 | 处理门槛 |
|---|---|---|
| 城市数据不完整 | 当前离线表不是全国完整地级市库，且坐标为城市中心近似值。 | P5-B 分批盘点、来源/许可复核；只有 dataset 发生兼容性变化时才递增 datasetVersion；未知地点继续明确未命中。 |
| 生产依赖审计 | 本批复核 `npm audit --omit=dev` 生产基线为 0 critical、8 high、13 moderate、0 low（21 total）。 | Expo/RN 兼容升级后复审；公开发布前要求 high/critical 清零或完成主管/合规书面决策。 |
| iPhone/TestFlight | Web 和自动化基线已过，真实设备文件流尚未签字。 | P5-H 完成全量设备验收并留存证据。 |
| 真实登录 | 手机验证码、Apple、微信只是本地原型流程，无真实服务端认证。 | OWNER DECISION 明确是否作为首发阻断项；若选择首发前账号，再由 Phase 6 完成服务商、注销和审计。 |
| 合规/发布材料 | 隐私政策、用户协议、注销、商店主体/截图/许可证和年龄分级未闭环。 | P5-E/P5-F/P5-I 逐项签字前不得对外提交。 |
| Node 测试 loader/module warning | 当前测试使用 Node experimental strip-types/loader，可能产生 warning；不影响本基线结果，但升级 Node 或依赖时需复核。 | 维护统一 `npm test`，在兼容 Node 版本升级时消除或记录 warning。 |
| 中国大陆历史 DST 的地区时间假设 | P5-A5c 只承诺 `Asia/Shanghai` 官方民用钟表/北京时间；非官方地区习惯时间不纳入 v1，不能从该规则推导其他地区历史民用时刻。 | 作为公开范围和残余风险保留；若扩展地区或时间习惯，必须新增来源、版本、owner 决策与独立边界回归。 |
| GitHub Actions action runtime warning | CI run `31879638540` 成功，但 runner 将 `actions/checkout@v4`、`actions/setup-node@v4` 的 Node 20 action runtime 强制为 Node 24；不影响本批四项质量门。 | 后续 CI maintenance 单独升级/复核 workflow；本批不修改 workflow。 |
| 真太阳时来源标签（P5-A2 历史风险登记） | `TRUE_SOLAR_DATA_VERSION` 名称为 `equation-of-time-noaa-v1`，但当时公式并非 HKO 引用或 NOAA 229.18 系数公式，且常量未进入保存 evidence。 | 负责人已选择方案 A 并授权 P5-A3a：当前实现使用 NOAA v2、保留 v1 复现与历史兼容；P5-A3b 已按主管授权完成展示/显式复核实现并经 Sol High 独立验收 PASS，不构成新的 owner 决策门。 |

> 上述真太阳时表格行是 P5-A2 历史登记；当前 P5-A3a 方案 A 与 P5-A3b 显式复核/UI 展示均已经 Sol High 独立验收 PASS，P5-A3 子里程碑整体完成，不构成新的 owner 决策门。

## 8. 下一步授权边界

主管在 P5-0 验收后已授权并完成实现、且已独立验收通过 **P5-A1：四术 Golden Case 统一合同、分类门禁与现状盘点**；**P5-A2 香港天文台 published-reference Golden 已完成实现并经 Sol High 独立验收 PASS**：

- 定义四术 Golden Case 的统一字段、分类策略、输入边界、预期证据、精度和版本合同，形成当前四术用例清单；覆盖至少节气边界、子初、闰月、跨日、未知时辰、未知城市、业务时区和六爻固定种子。
- 对每条用例标注 `independent-validation`、`regression-only` 或待验证；未有独立来源/专业复核的用例只能作为 regression-only，不得伪造专业真值或“权威正确”结论。
- P5-A1 仅做当前四术用例和门禁现状盘点；城市覆盖、来源/许可逐条补全属于 P5-B，不进入 P5-A。
- P5-A2 仅增加 HKO 公开资料支持的两条 published-reference Golden 与离线测试，不改变任何 resolver/engine 输出；立春只比较分钟，农历只比较日期，且不验证四柱流派结论。
- P5-A2 已给出 scope、DoD、测试、SHA、CI 和风险记录，并经 Sol High 独立验收 PASS；P5-A3a 已按方案 A 完成实现与最小兼容修复，并经 Sol High 独立验收 PASS。P5-A3b 的记录页显式复核/UI 展示不是新的 owner 决策门，已按主管授权完成实现并经 Sol High 独立验收 PASS，范围为历史证据展示与显式“按当前规则复核”。

P5-A1、P5-A2、P5-A3a、P5-A3b、P5-A4a、P5-A4b1、P5-A4b2、P5-A4b3、P5-A4b4、P5-A4b5、P5-A5a、P5-A5b、P5-A5c 已经 Sol High 独立验收通过；P5-A3 子里程碑已完成。P5-A4b5 仅以 v5 overlay 关闭四个真实 engine-error/cross-copy gap，P5-A5a 以独立 `p5-a5a-owner-decision.v1` overlay 关闭三项公开日期范围决策，P5-A5b 以 owner-decision v2 新增一项缺时辰决策并以 A4b v6 关闭两个原始 Astrology 安全 gap，P5-A5c 以 owner-decision v3 关闭中国大陆 1986–1991 历史 DST；A4a immutable audit、A4b v1-v6 overlays 和 P5-B/P5-C 路由不代表算法已修复。日级近似仍明确为 partial，不能当作精确星盘；P5-B 城市数据完整覆盖、UI/a11y 和其他发布门仍未完成。下一步固定为 P5-A final acceptance/audit closure。整个 P5-A、Phase 5 和 Level A 发布门仍未完成；任何 Level B 工作暂不进入实现。
