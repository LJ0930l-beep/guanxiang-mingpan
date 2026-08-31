# 观象·命盘路线图

## M0 — 跨端体验骨架（已完成）

- 登录入口与本地原型会话
- 原创设计系统与响应式首页
- 多命主本地模型
- 四术模块路由
- 类型、Lint、Web 构建和浏览器流程验证

## M1 — 确定性排盘核心（可用基线已完成）

- [x] 建立统一的模块结果协议与引擎版本字段。
- [x] 接入公历、农历、闰月、时辰、内置城市坐标基础层。
- [x] 完成八字、西方本命盘、紫微斗数与六爻的本地基础排盘。
- [x] 每个模块输出可追溯的规则型基础观察，不使用生成式 AI。
- [x] 建立首批四模块固定样例与缺失时辰/未知城市边界回归测试（`npm test`）。
- [x] 建立 `ChartSnapshotMeta`、`calculationSettings`、`inputSnapshot`、六爻 seed/date/scope 持久化和四模块独立计算器 facade。
- [x] P1-A：建立独立来源八字 Golden Case 框架、`BaziCalculationSettings` 与 `BaziCalculationEvidence`；真太阳时与日界规则由后续批次正式启用。
- [x] P1-B：接入带来源/版本/精度的节气边界解析，记录最近/下一节气、边界窗口和月柱节令依据，并完成 T-1/T/T+1 与跨 TZ 回归。
- [x] P1-C：落实午夜 / 子初日界线，23:00 子初换日写入有效计算时刻、设置与证据，并加入 22:59/23:00/23:01 回归。
- [x] P1-D：接入 UTC-only 真太阳时修正（地方平太阳时 / 视太阳时），记录标准经线、经度、修正分钟数、精度与有效时刻，并完成跨 TZ 回归。
- [x] 建立带版本、来源、许可和精确匹配规则的大陆首发城市离线索引（当前覆盖直辖市、省会/自治区首府及常用地级市）。
- [ ] 为边界日期、闰月、子时换日、夏令时和未知时辰建立固定金标准测试集。
- [ ] 扩充至全国地级市完整坐标及逐条来源许可、增加流派选择；子初换日和真太阳时已完成第一版。

## M2 — 本地档案与备份

- 命盘记录、收藏、反馈和复盘
- 已完成：命盘结果、命主、算法版本、快照元数据与基础观察自动归档；旧版未版本化数据会迁移；命主/记录支持编辑、删除、清空与二次确认；支持带版本的本机 JSON 备份导出与导入；记录支持收藏筛选和按日事实反馈。
- 已完成：密码保护的加密备份导出与恢复（scrypt + AES-256-GCM，随机 salt/nonce，密码不落盘）。
- 已完成：统一 `npm test`、Asia/Shanghai 跨 TZ 六爻复现、future schema 写保护与 GitHub Actions CI 基线。
- [x] 带版本号的本地数据迁移
- [x] 设备迁移时的冲突预览、合并/替换策略与失败回滚（见 `src/storage/import-plan.ts`、`src/storage/transaction.ts`）
- [x] Web 下载/选择与 iOS 文件 App 分享/选择的文件流实现
- [ ] 实体 iPhone / TestFlight 文件流最终签字（见 [DEVICE_ACCEPTANCE.md](DEVICE_ACCEPTANCE.md)）

## M2.5 — 四术解释体验与三术深度化（Phase 4 代码基线已完成）

- [x] 公共 `ExplanationSnapshot` / `ExplanationBlock` / Glossary 协议和历史 Diff。
- [x] 八字 8 类解释块与 Golden。
- [x] 紫微标准化十二宫/星曜/命身宫/四化模型、证据图与解释层。
- [x] 占星精确/近似标准化模型、角点/宫位/相位证据与精度边界解释。
- [x] 六爻问题/用神/旺衰/世应/动变/空亡证据与不承诺应期的解释层。
- [x] 四模块解释快照备份 deepEqual、只读记录查看、Glossary 点击和内容安全 Golden。
- [x] 最后一批 GitHub Actions 绿色确认（含 Web Export）。
- [ ] iPhone/TestFlight 文件流签字和发布前合规材料。

## Phase 5 — 发布质量工程（P5-0 已完成，P5-A1/P5-A2/P5-A3a/P5-A3b/P5-A4a/P5-A4b1/P5-A4b2/P5-A4b3/P5-A4b4/P5-A4b5/P5-A5a/P5-A5b PASS；P5-A3 子里程碑已完成，P5-A 未完成）

Phase 5 以 [PROJECT_MASTER_EXECUTION.md](PROJECT_MASTER_EXECUTION.md) 为总执行账本，按一个小批一个小批推进，不把整阶段一次交给执行者。P5-A1 的已验收基线为 83/83；P5-A2 已由主管独立复跑 87/87、Web 8 routes，并取得 GitHub Actions completed/success；P5-A3a 已经主管最终独立复验并 PASS，统一回归为 99/99；P5-A3b 已经 Sol High 独立验收 PASS，本地质量门为 104/104 与 Web Export 8 routes，候选实现 local `30f2db2c164bd1cac709025a340e91f32a3fa147`、remote `baea5f6e53bcc52564fd7b7e375cc4e70463398f`、CI `31875157338 completed/success`，账本修复 local `1189f5e9d7ed6001ac8ce132e8ee69b79435c052`、remote `c5bc6f04a0b6ddc1f43233d88c061a7efeccebfb`、CI `31876037500 completed/success`；两次 CI 的 Regression tests 与 Web Export 均实际执行。P5-A3 子里程碑整体完成。P5-A4a 新增 41 项边界审计合同与 8 项回归，local `2cf82d402e2f840ebf7c29bf47ee3b167fab9688`、remote `c7055e8962b3b21dd8b78c8f5c64769e9528daf0`、CI `31879638540 completed/success`；该 run 的 Typecheck、Lint、Regression tests 与 Web Export 均实际执行，主管本地独立复跑 112/112 与 Web Export 8 routes PASS。P5-A4b1 已经 Sol High 独立验收 PASS：实现新增 8 项输入校验/overlay 回归，A4a snapshot 与三项之外的规则不变；实现 local `0d279c677c1c05eb2492f9ae3b779267feb8b165` / remote `8ab5c6981c89590f6f19fabdc688c34ae60650ed`，CI `31882220415` completed/success，Typecheck、Lint、Regression tests 与 Web Export 均实际执行；主管本地 120/120 与 Web Export 8 routes PASS。P5-A4b2 已由 Sol High 独立验收 PASS：新增六爻 date/seed 输入合同、v2 overlay 五项和 8 项回归；实现 local `0815612cb8e2261325828ccf0d07e51525f34280` / remote `a976b4f07a2d516713db10cb2c0f2b53c98aa51a`；GitHub Actions run `31884436927` completed/success，主管本地独立门禁 128/128、Web 8 routes 均 PASS。P5-A4b3 已由 Sol High 独立验收 PASS：新增八字真太阳时标准经线两侧跨日/子初 regression-only 矩阵与 v3 overlay 六项；实现 local `53a3c46a1145a10f78f7f193df9b6e01dc12bbeb` / remote `c2daaf5691980da3faa839df4847680331d90b53`；GitHub Actions run `33352537186` completed/success，validate job `99368535197` 的 Typecheck、Lint、Regression tests 与 Web export 均实际执行并成功；Luna Max 本地独立门禁 132/132、Web Export 8 routes，`git diff --check`、typecheck、lint 均通过（Lint 0 warning）。P5-A4b4 已由 Sol High 独立验收 PASS：只关闭 `p5-a4a-ziwei-lunar-input` 与 `p5-a4a-ziwei-leap-month`，v4 overlay 累计 v1=3/v2=5/v3=6/v4=8，保留 v1/v2/v3 exports、顺序前缀与 validator 并新增 v4 validator；实现 local `62697525875a6214b19b447c1d08753bfdb18d75` / remote `306fdcdc89090f2c3c018ab8a25c5938b1e74195`，remote parent `e41513d3343c7d081bd17d06521c9410139286ab`，GitHub Actions run `33357809089`、validate job `99383188584` completed/success，Typecheck、Lint、Regression tests 与 Web export 均实际执行并成功，主管本地 139/139、Web Export 8 routes；`npm audit --omit=dev` 生产基线为 0 critical/8 high/13 moderate/0 low。P5-A4b5 已由 Sol High 独立验收 PASS：只关闭 `p5-a4a-ziwei-engine-error-path`、`p5-a4a-astrology-engine-error-path`、`p5-a4a-liuyao-engine-error-path` 与真实跨模块项 `p5-a4a-cross-error-copy-failure-mode`，v5 overlay 累计 v1=3/v2=5/v3=6/v4=8/v5=12；实现 local `f6dad29fc72b1c49e296b5300ae19c5a2cd6a5b3` / remote `98a336b8381016d781abc2b5584cc0777cb8bbd5`，remote parent `c7801ddc28522a7fdcfe0b38931443ba559868c2`，GitHub Actions run `33363580174`、validate job `99399593743` completed/success，Typecheck、Lint、Regression tests 与 Web export 均实际执行并成功，主管本地 146/146、Web Export 8 routes，`npm audit --omit=dev` 为 0 critical/8 high/13 moderate/0 low。A4a `41 / 18 / 15 / 5 / 2 / 1` 与 Astrology `0,0` probe 不变；跨模块失败 contract 公开形状为 `{name,category,module,code}`，安全、fail-closed、稳定错误不重复包装且 `ChartInputError` 原样兼容，未知异常不返回部分/默认/猜测盘。不存在且未使用 `p5-a4a-cross-error-taxonomy`。P5-A4b5 已通过验收；P5-A5a 随后以独立 `p5-a5a-owner-decision.v1` overlay 关闭三项公开日期范围决策，统一 inclusive `1900-01-01..2099-12-31`，不修改 A4a immutable registry/statistics 或 A4b v1-v5 overlays。P5-A5b 已由 Sol High 独立验收 PASS：owner-decision v2 累计 4 项，仅新增缺时辰决策；A4b v6 累计 14 项，关闭缺坐标与跨模块 no-guessing 两个原始 gap。未知时辰固定 Asia/Shanghai 正午锚点并比较日首/日末稳定性，结果 `date-level-approximate`/`partial`，隐藏角点/宫位/相位与不稳定时间敏感因素；未知城市/无成对坐标 fail-fast，不再传入 `0,0`。实现 local `7f0caef63a0656ff21a571c7edb9cb7db1828d49` / remote `6d00ad4834f012e61a99431d24d2301f766d7d40`，remote parent `44488581f0853a1be7a8366881f42b6a6f65f581`；Actions run `33385531379`/job `99467178839` 全部 Success。下一步为 P5-A5c 中国大陆 1986–1991 历史 DST；整个 P5-A 与 Phase 5 仍未完成。

- [x] **P5-0 项目总账本与启动基线**：固化治理来源、Phase 0～4 真实基线、不可变产品边界、Level A/B、风险和批次验收模板。
- [ ] **P5-A 专业质量补强（四术 Golden/边界/输入策略）**：P5-A1、P5-A2、P5-A3a、P5-A3b、P5-A4a、P5-A4b1、P5-A4b2、P5-A4b3、P5-A4b4、P5-A4b5、P5-A5a、P5-A5b 已通过独立验收，P5-A3 子里程碑整体完成；历史 DST、城市覆盖及其他发布决策仍未关闭，整个 P5-A 未完成。不得伪造专业真值。
  - [x] **P5-A1 四术 Golden Case 合同、分类门禁与现状盘点**：`golden-case.v1`、完整纯 JSON/runtime validator、从 `BAZI_GOLDEN_CASES` 映射的 2 条八字技术性交叉验证、其余当前项 regression-only；本批独立验收 PASS。
  - [x] **P5-A2 香港天文台 published-reference Golden**：新增 2 条 HKO 公开资料 fixture 与 4 项离线测试；立春只按公开分钟比较，农历只按公开日期比较；主管独立复跑 typecheck/lint/npm test 87/87/build:web 8 routes 全部 PASS。本地 `a9efd1b05d4a2387a8375b7bd5cc913cc136d232`、远端等价 `3ffdda0caa8fd4b7c91aef45f65c63ad22f815bb`；CI run `31869188065` completed/success，Regression tests 与 Web Export 均实际执行并 success。
  - [x] **P5-A3a 真太阳时版本兼容与 Storage Schema 3**：方案 A 已经 Sol High 独立验收 PASS：新计算使用 NOAA v2，旧 v1 仅用于历史复现，`legacy-unknown` 不伪造证据且不用于实际计算；保存 raw/display/applied 修正、舍入规则、来源/版本/NOAA URL；schema2→3、普通/加密旧备份和 schema3 malformed 深字段只做无计算迁移；99/99 测试与 Web Export 8 routes 通过。初始 local `51fcd3bd8b7938e54f6604785544574115e34733` / remote `2da65c0928aa23af0ed1fabb36de3008a23ff5d5` / CI `31872612966`；修复 local `4ed5081354747cc4b4a342552436d0263780f0ff` / remote `a3e7193d2a0b1c9c4de7b3d9e859a0eb61983459` / CI `31873458023`。
  - [x] **P5-A3b 记录页显式复核与 UI 展示（Sol High 独立验收 PASS）**：不是新的 owner 决策门；已按授权完成历史证据展示与显式“按当前规则复核”，覆盖 NOAA v2/v1/unknown/not-applied 映射、最终有效时刻和无静默重算的内存 Diff。P5-A3 真太阳时版本兼容、证据展示和显式 current-rule replay 子里程碑整体完成；无算法、Storage Schema、依赖变化，历史结果不静默重算。

 P5-A4a 已新增 41 项纯 JSON 四术边界/输入策略审计合同与 8 项门禁回归，并已通过 Sol High 独立验收；矩阵统计为 covered 18、gap 15、decision-required 5、not-applicable 2、routed-p5-b 1，全部 regression-only。P5-A4b5 已通过 Sol High 独立验收并以 v5 overlay 记录四个真实 engine-error/cross-copy gap 的工程关闭；公开 engine failure contract 为 `{name,category,module,code}`，未知异常安全包装、fail-closed 与不重复包装已回归验证，`ChartInputError` 原样兼容。A4a immutable registry、41/18/15/5/2/1 与历史 Astrology `0,0` probe 不变；不存在且未使用 `p5-a4a-cross-error-taxonomy`。P5-A5a 已以独立 `p5-a5a-owner-decision.v1` overlay 关闭三项公开日期范围决策，统一 inclusive `1900-01-01..2099-12-31`；P5-A5b 已由 owner-decision v2 累计 4 项并仅新增缺时辰日级近似决策，A4b v6 累计 14 项并关闭缺坐标与跨模块 no-guessing 两个原始 gap。未知时辰固定 Asia/Shanghai 正午锚点与日首/日末稳定性筛选，结果 `partial`，隐藏角点/宫位/相位和不稳定时间敏感因素；未知城市或无成对坐标 fail-fast，不再传入 `0,0`。详见 [P5_A_BOUNDARY_AUDIT.md](P5_A_BOUNDARY_AUDIT.md)。P5-B 城市数据批次尚未开始，下一步为 P5-A5c 中国大陆 1986–1991 历史 DST。以上不构成整个 P5-A 或 Phase 5 完成。
- [x] **P5-A4a 四术边界与输入策略机器可检查审计（Sol High 独立验收 PASS）**：实现纯 JSON 合同、runtime validator、四术/跨模块 41 项矩阵和审计回归；不修算法/UI，不提升为专业真值。真实 gap、负责人决策项和后续 P5-A4b/P5-B/P5-C 仍未关闭。
- [x] **P5-A4b1 安全输入校验、可识别错误与 resolution overlay（Sol High 独立验收 PASS）**：仅关闭紫微/占星 solar 非法 Gregorian 日期与占星显式非法坐标三项 A4a gap；新增 `ChartInputError`、纯 JSON `p5-a4b-input-resolution.v1` overlay 和 8 项回归，A4a 的 41/18/15/5/2/1 snapshot 与 unknown-coordinate `0,0` probe 保持不变。实现 local `0d279c677c1c05eb2492f9ae3b779267feb8b165` / remote `8ab5c6981c89590f6f19fabdc688c34ae60650ed`；CI run `31882220415` completed/success，Typecheck、Lint、Regression tests 与 Web Export 均实际执行，Web Export 未 skip；主管本地 120/120、8 routes 均 PASS。cross error taxonomy、0,0、日期范围、DST、缺时辰和其他 gap/decision-required 仍未完成，P5-A 与 Phase 5 仍未完成。
- [x] **P5-A4b2 六爻 seed/date 输入合同与跨宿主 TZ 复现（Sol High 独立验收 PASS）**：只关闭 `p5-a4a-liuyao-invalid-date` 与 `p5-a4a-liuyao-invalid-seed` 两项；新增 `INVALID_LIUYAO_DATE`/`INVALID_LIUYAO_SEED`、严格 timezone-free/offset 日期校验、原始 Unicode seed 1～256 校验与自动 seed 校验；v1 三项 overlay 保持不变，v2 `p5-a4b-input-resolution.v2` 累计五项、纯 JSON/唯一/原始 gap/P5-A4b 关联且不写 commit SHA。新增 8 项回归，主管本地独立门禁 `npm test` 128/128、Web Export 8 routes；覆盖 local/seconds/millis、Z/`+08:00`/`+0800`、非法矩阵、Unicode payload/inputSnapshot、deepEqual、自动 seed 与 UTC/Asia/Shanghai 结果/错误一致性。实现 local `0815612cb8e2261325828ccf0d07e51525f34280` / remote `a976b4f07a2d516713db10cb2c0f2b53c98aa51a`；GitHub Actions run `31884436927` completed/success，validate job `95011564415` 的 Typecheck、Lint、Regression tests 与 Web export 均实际执行并成功。A4a 41/18/15/5/2/1 snapshot 与 `0,0` probe 保持；六爻 engine/cross taxonomy、0,0、日期范围、DST、缺时辰、owner decisions 和其他 gap/decision-required 未完成，P5-A 与 Phase 5 仍未完成。
- [x] **P5-A4b3 八字真太阳时跨日/子初边界矩阵与 cumulative overlay（Sol High 独立验收 PASS）**：只关闭 `p5-a4a-bazi-true-solar-cross-day`；新增 regression-only 135°E / 75°E 标准经线两侧矩阵，覆盖正负修正、民用跨日前后、`midnight` / `ziEarly` 和 UTC/Asia/Shanghai deepEqual；新增 `p5-a4b-input-resolution.v3` 六项，保持 v1/v2 前缀、纯 JSON、唯一 ID 和原始 gap/`P5-A4b` 关联。实现 local `53a3c46a1145a10f78f7f193df9b6e01dc12bbeb` / remote `c2daaf5691980da3faa839df4847680331d90b53`；GitHub Actions [run 33352537186](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/33352537186) completed/success，validate job `99368535197` 的 Typecheck、Lint、Regression tests 与 Web export 均实际执行并成功；Luna Max 本地 `npm test` 132/132、Web Export 8 routes，`git diff --check`、typecheck、lint 均通过（Lint 0 warning）。本批只关闭八字真太阳时跨日/子初边界 gap；六爻 engine/cross taxonomy、unknown-coordinate `0,0`、公开日期范围、1986–1991 DST、缺时辰、owner decisions 及其余 gap/decision-required 未完成，P5-A/Phase 5 仍未完成。
- [x] **P5-A4b4 紫微农历/闰月输入校验与 cumulative overlay（Sol High 独立验收 PASS）**：只关闭 `p5-a4a-ziwei-lunar-input` 与 `p5-a4a-ziwei-leap-month`；覆盖普通农历、有效闰月、无效闰月组合、无效农历日期及 UTC/Asia/Shanghai deepEqual，农历路径不套用 Gregorian 校验；新增 `p5-a4b-input-resolution.v4`，累计 v1=3/v2=5/v3=6/v4=8，保留 v1/v2/v3 exports、顺序前缀与 validator，并新增 v4 validator。实现 local `62697525875a6214b19b447c1d08753bfdb18d75` / remote `306fdcdc89090f2c3c018ab8a25c5938b1e74195`，remote parent `e41513d3343c7d081bd17d06521c9410139286ab`；GitHub Actions [run 33357809089](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/33357809089) completed/success，validate job `99383188584` 的 Typecheck、Lint、Regression tests 与 Web export 均实际执行并成功；主管本地 `npm test` 139/139、Web Export 8 routes、`git diff --check`、typecheck、lint（0 warning）均 PASS，`npm audit --omit=dev` 生产基线为 0 critical/8 high/13 moderate/0 low。A4a `41 / 18 / 15 / 5 / 2 / 1` 与 Astrology `0,0` probe 保持不变；未修改算法/公式、UI、Storage/schema、依赖或 CI。owner decision items 继续 pending，P5-A/Phase 5 仍未完成。
- [x] **P5-A4b5 四模块 engine failures 与跨模块失败契约（Sol High 独立验收 PASS）**：只关闭 `p5-a4a-ziwei-engine-error-path`、`p5-a4a-astrology-engine-error-path`、`p5-a4a-liuyao-engine-error-path` 与真实跨模块项 `p5-a4a-cross-error-copy-failure-mode`；不存在且未使用 `p5-a4a-cross-error-taxonomy`。v5 overlay 累计 v1=3/v2=5/v3=6/v4=8/v5=12，保留 v1/v2/v3/v4 exports、顺序前缀与 validators，并新增 version-aware v5 validator。四模块公开 contract 为 `{name,category,module,code}`，未知异常安全包装、fail-closed、不重复包装与 `ChartInputError` 原样兼容均有专项回归；正常成功盘不变，失败不返回部分/默认/猜测盘。实现 local `f6dad29fc72b1c49e296b5300ae19c5a2cd6a5b3` / remote `98a336b8381016d781abc2b5584cc0777cb8bbd5`，remote parent `c7801ddc28522a7fdcfe0b38931443ba559868c2`；GitHub Actions run `33363580174`、validate job `99399593743` completed/success，Typecheck、Lint、Regression tests 与 Web export 均实际执行并成功；主管本地 146/146、Web Export 8 routes、`git diff --check`、typecheck、lint（0 warning）均 PASS，`npm audit --omit=dev` 为 0 critical / 8 high / 13 moderate / 0 low。实现批次 changed paths 为 10，详见总账本；A4a `41 / 18 / 15 / 5 / 2 / 1` 与 Astrology `0,0` probe 保持不变。随后 P5-A5a 已以独立 owner-decision overlay 关闭三项公开日期范围决策；以上为 P5-A4b5 当时的历史下一步记录，P5-A5b 已在下一项收口，P5-A/Phase 5 仍未完成。
- [x] **P5-A5a 统一公开出生日期政策（Sol High 独立验收 PASS）**：负责人确认 `cn-mainland-public-birth-date-range.v1`，八字/紫微/占星公开出生日期统一 inclusive `1900-01-01..2099-12-31`，范围外 fail-fast；农历先做真实农历/闰月校验，再按农历输入日期范围执行，六爻不受该政策影响。独立 `p5-a5a-owner-decision.v1` overlay 精确关闭 `p5-a4a-bazi-supported-date-range`、`p5-a4a-ziwei-date-range`、`p5-a4a-astrology-date-range`，不改 A4a immutable `41 / 18 / 15 / 5 / 2 / 1` 或 A4b v1-v5。政策边界进入 `calculationSettings`、`inputSnapshot`、`ChartSnapshotMeta`、`SavedReading` 与 backup roundtrip，旧快照不补写；专项回归 9/9、统一 `npm test` 155/155、TZ deepEqual、2099 三模块可计算、Web Export 8 routes、production audit 0 critical/8 high/13 moderate/0 low 均 PASS。实现远端 `61805e8998ab4ca701e4960d6129e3b7cb381b17`（parent `496902c875072769439c90cf52f130331fa473d3`），CI `33375970276`/`99437414040`；错误新增的 `STATUS.md` 由 cleanup `5350baa9a857b86e2a02c0c42036d72dfe06a0c4`（parent `61805e8998ab4ca701e4960d6129e3b7cb381b17`）单独删除，最终 CI `33376590722`/`99439354459` 全部 Success 且 Web Export 实际执行。该项历史验收已收口，后续为 P5-A5b。
- [x] **P5-A5b Astrology 日级近似 + 缺坐标 fail-closed**：负责人确认未知时辰采用固定 Asia/Shanghai 正午 `12:00:00` 锚点并做日首/日末稳定性筛选；结果为 `date-level-approximate`/`partial`，只保留全天稳定字段，隐藏 Ascendant、Midheaven、houses、angles、aspects、逆行和不稳定快速因素。显式成对坐标优先、城市数据次之；未知城市或无成对坐标返回 `MISSING_BIRTH_COORDINATES`（field `birthCity`），不再传入 `0,0`。`p5-a5a-owner-decision.v2` 累计 4 项，仅新增 `p5-a4a-astrology-missing-time`；`p5-a4b-input-resolution.v6` 累计 14 项，关闭 `p5-a4a-astrology-missing-coordinate` 与 `p5-a4a-cross-no-guessing`，不命名新的 A4b 批次。策略 metadata 进入 `calculationSettings`、`inputSnapshot`、`ChartSnapshotMeta`、`SavedReading`、backup/replay，旧快照不补写；专项回归 7/7、统一 `npm test` 162/162、Web Export 8 routes、生产 audit 0 critical/8 high/13 moderate/0 low 均 PASS。实现 local `7f0caef63a0656ff21a571c7edb9cb7db1828d49` / remote `6d00ad4834f012e61a99431d24d2301f766d7d40`，remote parent `44488581f0853a1be7a8366881f42b6a6f65f581`；Actions run/job `33385531379`/`99467178839` 全部 Success。A4a immutable registry/statistics 与历史 `0,0` probe 不变，下一步为 P5-A5c 中国大陆 1986–1991 历史 DST。
- [ ] **P5-A5c 中国大陆 1986–1991 历史 DST**：在独立 handoff 授权后处理历史夏令时来源、公开支持语义和既有快照复现边界；不回写 A4a immutable audit。
- [ ] **P5-B 城市数据完成**：完成中国大陆城市覆盖、来源/许可/别名/坐标审计和版本化离线数据；未知城市不猜测，历史 `locationId` 不静默替换。
- [ ] **P5-C UX/可访问性**：完成键盘/读屏/字体缩放/减少动态效果/对比度/触控目标和四术动效验收。
- [ ] **P5-D 性能与稳定性**：完成 Web/iPhone 冷启动、计算、记录、备份、异常恢复和长列表基线，建立性能预算和回滚证据。
- [ ] **P5-E Release Security**：完成依赖/许可证/构建产物/密钥/权限/备份边界审计，处理或书面接受生产 high/critical 风险。
- [ ] **P5-F 隐私与合规**：完成本地保存说明、隐私政策、用户协议、删除/导出/注销、年龄分级和数据处理清单。
- [ ] **P5-G Web 发布验收**：完成生产构建、8 routes、浏览器/离线/备份文件流/回滚验收并保留 CI Web Export 证据。
- [ ] **P5-H iPhone/TestFlight**：完成实体 iPhone/TestFlight 四术、离线、无障碍和普通/加密备份文件流签字。
- [ ] **P5-I App Store 材料**：完成图标、截图、描述、年龄分级、隐私清单、许可证、支持信息和审核说明。

P5-A～P5-I 是 Level A 发布质量前置项。完成 Phase 5 后必须经过 OWNER DECISION：公开版本继续本地入口，或首发前先完成真实账号；若选择后者，先完成 Phase 6，再进入 Level A 发布门。不得把后续账号、权益、商业化和 AI 伪装成 Phase 5。

## Phase 6 — 中国大陆真实账号与可选权益

- 手机验证码作为主账号
- Apple 与微信登录后绑定手机号
- 多端共享账户与权益，不默认同步命盘
- 隐私政策、注销、数据导出和服务端审计日志

## Phase 7 — 商业化与 AI（条件式）

- 首次公开版本保持无广告、无支付、无 AI
- 后续接入订阅和单次解读权益
- 付费 AI 仅通过服务端调用，设置单次成本上限、缓存与内容安全规则
- 订阅权益包括每日、每周及流月内容；免费基础排盘长期保留

## 重大决策门槛

以下事项在执行前需要向项目负责人说明：

- 更换核心排盘算法或引入非宽松许可证代码
- 上传出生资料或改变“本地优先”边界
- 确定短信、微信、Apple 登录服务商
- 确定支付、AI 模型及内容审核供应商
- App Store 正式 Bundle ID、商标和上线主体
