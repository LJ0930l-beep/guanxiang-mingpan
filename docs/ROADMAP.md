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

## Phase 5 — 发布质量工程（P5-0 已完成，P5-A1/P5-A2 PASS，P5-A3a 最小兼容修复等待复验）

Phase 5 以 [PROJECT_MASTER_EXECUTION.md](PROJECT_MASTER_EXECUTION.md) 为总执行账本，按一个小批一个小批推进，不把整阶段一次交给执行者。P5-A1 的已验收基线为 83/83；P5-A2 已由主管独立复跑 87/87、Web 8 routes，并取得 GitHub Actions completed/success；P5-A3a 最小兼容修复已完成并新增至 99 项本地回归，等待主管独立复验；整个 P5-A 与 Phase 5 仍未完成。

- [x] **P5-0 项目总账本与启动基线**：固化治理来源、Phase 0～4 真实基线、不可变产品边界、Level A/B、风险和批次验收模板。
- [ ] **P5-A 专业质量补强（四术 Golden/边界/输入策略）**：P5-A1、P5-A2 均已通过主管独立验收；整个 P5-A 未完成。不得伪造专业真值。
  - [x] **P5-A1 四术 Golden Case 合同、分类门禁与现状盘点**：`golden-case.v1`、完整纯 JSON/runtime validator、从 `BAZI_GOLDEN_CASES` 映射的 2 条八字技术性交叉验证、其余当前项 regression-only；本批独立验收 PASS。
  - [x] **P5-A2 香港天文台 published-reference Golden**：新增 2 条 HKO 公开资料 fixture 与 4 项离线测试；立春只按公开分钟比较，农历只按公开日期比较；主管独立复跑 typecheck/lint/npm test 87/87/build:web 8 routes 全部 PASS。本地 `a9efd1b05d4a2387a8375b7bd5cc913cc136d232`、远端等价 `3ffdda0caa8fd4b7c91aef45f65c63ad22f815bb`；CI run `31869188065` completed/success，Regression tests 与 Web Export 均实际执行并 success。
  - [ ] **P5-A3a 真太阳时版本兼容与 Storage Schema 3**：方案 A 已完成最小兼容修复，默认 `true-solar-time-v2-noaa`、保留 v1 原公式、`legacy-unknown` 拒绝实际计算；保存 raw/display/applied 修正、舍入规则、来源/版本/NOAA URL；schema2→3、普通/加密旧备份和 schema3 malformed 深字段只做无计算迁移；99 项本地回归通过，等待 Sol High 独立复验。
  - [ ] **P5-A3b 记录页显式复核与 UI 展示（待另行授权）**：不是新的 owner 决策门；须待本批通过后由主管另行授权，不得在本批预先实现或宣称完成；整个 P5-A3 与 P5-A 仍未完成。
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
