# 观象·命盘 Phase 3 — 本地档案与复盘深化执行记录

> 执行日期：2026-08-15  
> 范围：本地档案、复盘、备份、设备文件流  
> 明确不包含：真实账号、支付、广告、AI、云端命盘同步、新八字流派

## 目标与完成判定

Phase 3 的目标是让用户可以在本机保存、搜索、复查、反馈和迁移命盘，同时能解释导入会做什么；任何恢复失败不得把本机资料写成半套状态。判定依据是：

- 记录查看使用保存的快照，不用当前命主资料覆盖历史结果。
- 搜索、筛选、分组和对比是只读操作，固定 `Asia/Shanghai` 的日级边界。
- 反馈只记录用户提供的日级事实，可选关联解释/证据 ID，并保留创建与更新时间。
- 普通/加密备份经过结构校验和跨记录完整性校验；Phase 2 深度快照可无损往返。
- 导入先预览冲突，再由用户选择合并或替换；多 key 写入失败时恢复原始值。
- Web 和 iPhone 使用真实文件下载/选择/系统分享路径；实体 iPhone 最终签字单独记录。

## 批次状态

| 批次 | 状态 | 主要交付 | 关键证据 |
|---|---|---|---|
| P3-A | 已完成 | Snapshot Viewer、记录详情、快照缺失/历史标记 | `src/domains/archive/`、`tests/archive-snapshot.regression.mjs` |
| P3-B | 已完成 | 关键词/模块/命主/时间/收藏/反馈筛选，按命主/日期分组，同模块同命主对比 | `src/domains/archive/query.ts`、`tests/archive-query.regression.mjs` |
| P3-C | 已完成 | 按日事实反馈时间线、编辑、更新时间、解释/证据关联 | `src/state/app-context.tsx`、`tests/storage-operations.regression.mjs` |
| P3-D | 已完成 | 普通/加密备份 Archive Integrity；Phase 2 深度快照和反馈 deepEqual 往返 | `tests/archive-roundtrip.regression.mjs`、`tests/backup.regression.mjs` |
| P3-E | 已完成 | 导入预览、重复 ID 分类、merge/replace、事务写入回滚 | `src/storage/import-plan.ts`、`src/storage/transaction.ts`、`tests/import-plan.regression.mjs` |
| P3-F | 代码完成 / 设备待签 | Web 下载/选择、iPhone 分享/选择、文件名契约与验收清单 | `src/services/local-backup-io.ts`、`src/storage/backup-file-contract.ts`、[DEVICE_ACCEPTANCE.md](DEVICE_ACCEPTANCE.md) |

## 导入策略

### 预览

预览阶段只解析和校验文件，不写入 AsyncStorage。预览至少展示当前与文件的：命主数、记录数、事实反馈数、收藏数和八字深度快照数，并列出重复的命主/记录 ID。

### 合并

- 新 ID 追加到当前档案。
- 重复 ID 默认保留本机对象，因而不会静默覆盖用户已经编辑过的快照或反馈。
- 文件中的账户原型作为当前本地会话候选；命主和记录仍按 ID 逐项合并。
- 当前选择优先使用文件中的有效选择，否则保留当前有效选择。

### 替换

文件通过完整校验后作为一个整体写入；用户明确选择“替换本机”才执行。恢复成功后 React 状态在全部存储 key 写入完成后才更新。

### 回滚

`transactionalReplace` 先保存四个 AsyncStorage key 的原始字符串，再顺序写入；任意写入抛错时按原字符串恢复，包含原本不存在的 key。若回滚本身失败，抛出 `StorageTransactionError`，不宣称恢复成功。

## 自动化与 CI

当前本地基线：

```text
typecheck: pass
lint: pass
npm test: 57 pass
build:web: pass
```

GitHub Actions `CI` 工作流执行同样的四项检查；Web Export 使用 `if: ${{ always() }}`，不会因测试步骤失败而 skip。生产依赖审计使用 `npm audit --omit=dev`，结果和处理边界记录在 [SECURITY_NOTES.md](SECURITY_NOTES.md)。

## 未完成与下一步

1. 用实际 Chrome/Edge 下载目录和文件选择器完成 [DEVICE_ACCEPTANCE.md](DEVICE_ACCEPTANCE.md) 的 Web 勾选。
2. 通过 macOS/Xcode 或 TestFlight 在实体 iPhone 完成分享面板、文件 App 选择、错误密码、取消和“减少动态效果”勾选。
3. 在正式上线前补隐私政策、用户协议、账号注销、发布签名、App Store 隐私清单和第三方许可证复核。

