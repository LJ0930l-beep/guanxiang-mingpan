# 观象·命盘 项目复盘与三术解盘闭环交接（2026-09-08）

## 交接结论

本轮把技术 RC 补到“本地排盘 → 证据 → 解释 → 保存 → 历史查看 → 事实反馈”的可操作闭环。基础规则计算仍在设备本地，当前未接入广告、支付、云同步、真实手机号/Apple/微信供应商或 AI。

正式公开发布仍不是本轮结论：真机安装/签名、主体与商店合规、城市数据许可覆盖、传统术数专业复核和模型评测均保留阻塞。

## F01–F12 完成矩阵

| 编号 | 状态 | 证据与真实路径 |
|---|---|---|
| F01 | 完成 | `src/state/app-context.tsx` 移除记录 100 条静默上限；`tests/storage-operations.regression.mjs` 的 R01 101 条测试。 |
| F02 | 完成 | 写入采用 `transactionalReplace`，失败时不发布内存状态；R01 注入 `AsyncStorage.setItem` 失败并比较磁盘/重载内存。 |
| F03 | 完成 | 四术 explanation 的引用只从语义候选节点取值，移除首节点 padding；紫微无四化时 `mutagens` 不再引用 `palace.position`。 |
| F04 | 完成 | 八字新增 `conflict` 状态；只有显式 `strength.balance-validation` 节点才能标 `balanced`，解释明确区分冲突、待定和规则验证平衡。 |
| F05 | 完成 | 四术 payload 写入 `inputFingerprint`；六爻 inputSnapshot 写入 timezone/date/seed/scope/castingMethod；TZ 回归与新产品闭环测试覆盖。 |
| F06 | 部分完成 | 八字已有 8 层解释、候选取用边界与证据 explorer；未知时辰仍 fail-closed，不以 00:00 冒充准确时辰。大运/流年深度尚未作为事实引擎交付。 |
| F07 | 完成（基础） | 六爻支持快捷自动、六次交互投掷和手工六爻录入，交互/手工保存 6/7/8/9 点、阴阳、动静与变卦事实；保留用神/世应/旺衰/动变解释，不承诺具体应期；保存失败重试原卦。 |
| F08 | 完成（基础） | 紫微保留真实 12 宫、四化、主星；新增对宫/三方关系节点与可点击宫位；占星保留日级近似边界并支持查看全部相位。 |
| F09 | 完成 | 历史页用 `ChartRenderer` 显示保存时完整盘面；反馈表单自动关联当前解读/依据，不要求用户输入内部 ID；历史默认只读，不静默重算。 |
| F10 | 部分完成 | 生产 audit 仍为 0 critical / 9 high / 17 moderate；安全脚本和 Web 导出门禁保留。真机、签名、主体、城市许可和线上部署仍阻塞。 |
| F11 | 方案完成、评测阻塞 | `docs/QWEN35_9B_OFFLINE_EVAL_PLAN_20260908.md`；当前未下载权重、未上传真实档案、未接生产链路。 |
| F12 | 完成 | 本文、`tests/product-closure.regression.mjs`、全量测试/类型/ lint / Web Export 结果组成交接证据。 |

## 可操作路径

### 八字

首页 → 命主 → 八字 → 选择性别/日界线/真太阳时 → 排出四柱 → 展开“深度判断”“本次计算依据” → 保存到记录 → 记录页打开 L3/L4/L5 → 添加事实反馈。

### 六爻

首页 → 六爻 → 输入至少 4 字问题 → 选择父母/官鬼/妻财/子孙/兄弟 → 选择快捷自动、六次投掷或手工录入 → 生成六条爻 → 逐条检查世应、旺衰、动变和解释 → 保存；保存失败点击“重试保存原卦”。

### 紫微

首页 → 紫微 → 生成十二宫 → 点击任一宫位查看主星、对宫和三方坐标 → 展开四化/解释 → 记录页查看保存时完整十二宫。

### 占星

首页 → 星盘 → 生成本命盘 → 在完整盘中查看行星、宫位和相位；超过 8 组时点击“显示全部相位”。未知时辰只展示通过全天稳定性检查的日级落座，不猜测上升、宫位或相位。

### Future Schema 原始值

设置 → 检测到“记录数据只读”后，使用“导出只读原始值”。导出只读取原始 AsyncStorage 字符串，不解码、不迁移、不覆盖；升级后再用正式备份/迁移路径恢复。

## 数据迁移与回滚

- 当前 Storage Schema 为 v3，未来 schema key 进入 blocked 集合；任何可能覆盖该 key 的写、删、清空、普通/加密恢复都会拒绝。
- 同版本迁移只在读成功且目标 key 未 blocked 时写回；多 key 写入统一通过 `transactionalReplace` 保存旧值，失败尝试逐 key 回滚。
- 清除数据使用 `transactionalRemove`，删除失败同样尝试回滚。
- 迁移失败或回滚失败均保留原始 key，并报错；不得 `reset --hard`、强制覆盖或静默重算历史。

## 测试与构建证据

本轮实际重新执行结果：

```text
npm test
npm run typecheck
npm run lint
npm run build:web
npm run verify:web
npm run security:scan
npm run security:audit
npm audit --omit=dev
```

| 命令 | 结果 |
|---|---|
| `npm test` | 通过，221/221，0 失败，0 跳过 |
| `npm run typecheck` | 通过 |
| `npm run lint` | 通过 |
| `npm run build:web` | 通过，真实导出 10 个静态路由 |
| `npm run verify:web` | 通过，10 routes |
| `npm run security:scan` | 通过，7 个配置根目录无密钥命中 |
| `npm run security:audit` | 通过报告门禁，`0 critical / 9 high / 17 moderate / 0 low` |
| `npm audit --omit=dev` | 真实 exit 1，报告 `0 critical / 9 high / 17 moderate / 0 low`，详见 `docs/PRODUCTION_AUDIT_20260908.md` |

生产 audit 当前基线为 `critical=0 high=9 moderate=17 low=0`。非零退出来自 Expo/Metro/Router 等传递依赖，不能冒充已清零；本轮已逐项记录可达性和 SDK 57 兼容性，没有执行破坏性 `--force` 升级。

## 未完成与外部阻塞

- 真机 Web/iPhone 安装、键盘/触控/性能和签名证书：本地环境没有可验收设备、证书和主体，不能声称已通过。
- 真实手机号验证码、Apple、微信登录：当前是本地原型入口，不是上线身份系统；接入需要供应商、隐私协议、密钥和服务端。
- 传统规则、流派选择、四化/大运/流年专业准确性：需要有资质的内容审核与可引用规则来源，当前不能用模型或模板补齐。
- 城市数据完整覆盖与再分发许可：现有合同保持 fail-closed，不能把当前部分城市表称为全国可发布数据。
- Qwen3.5-9B：设备有 RTX 4060 8GB，但没有安装权重或人工评测；4-bit 试验可排期，生产接入仍 blocked，方案见 `docs/QWEN35_9B_OFFLINE_EVAL_PLAN_20260908.md`。

## 版本与发布记录

本轮本地提交为 `770d036729900572d06308079c5ffd3d4ec47acd`，已推送到 `origin/main`。GitHub Actions 新 run `34201638220` 对应该 SHA，真实结论为 `success`；CI 中 Web Export 与 Verify Web Export 均实际执行。旧 run `33768014467` 仅为历史证据，不作为本轮验收。

CI 地址：https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/34201638220
