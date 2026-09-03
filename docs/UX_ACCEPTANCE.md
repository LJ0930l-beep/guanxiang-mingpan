# 观象·命盘 UX / 可访问性验收矩阵

> 版本：2026-09-03。自动化证据与人工 viewport 记录分开；没有真实 iPhone 时不把 Web 结果写成设备 PASS。

## 已实现并由代码/回归覆盖的路径

| 区域 | 证据 | 状态 |
| --- | --- | --- |
| 四术输入、校验、生成、失败恢复 | `tests/p5-c-page-accessibility.regression.mjs`、`tests/p5-input-validation.regression.mjs`、`tests/p5-engine-errors.regression.mjs` | PASS（自动化） |
| 结果、证据展开、解释、保存、历史复盘 | `tests/p5-c-page-accessibility.regression.mjs`、archive/explanation/backup 回归 | PASS（自动化） |
| loading/empty/failure/partial/blocked/unknown | `src/constants/ui-copy.ts`、`StatePanel`、页面回归 | PASS（自动化） |
| 读屏语义 | role、label、live region、expanded/checked/selected 状态回归 | PASS（自动化） |
| 键盘焦点与输入顺序 | 原生 `Pressable`/`TextInput` 顺序、Web 静态 DOM 检查 | PASS（自动化结构）；浏览器手工仍需签字 |
| 字体缩放/减少动态效果 | 可缩放原生文字、`AnimatedReveal` 监听系统偏好 | PASS（代码）；真机偏好仍需签字 |
| 触控目标/对比度 | `layout.minTouch=44`、深玉石/brass/cinnabar tokens | PASS（代码基线）；视觉测量仍需签字 |
| 直接打开深层/未知术数链接 | `router.canGoBack()` fallback、unknown StatePanel、首页恢复动作 | PASS（自动化结构）；各托管商 rewrite 仍需部署验收 |

## Web viewport 手工矩阵

在生产静态包或本地 `npm run web -- --port 8081` 中，使用 Chrome/Edge 分别检查 375×812、768×1024、1024×768、1440×900：

1. 首页 → 命主 → 四术入口；无水平滚动，主要按钮和错误提示完整可见。
2. 四术各自完成输入 → 生成 → 证据展开 → 保存 → 记录页展开/反馈/删除；刷新后本地资料仍在。
3. 无命主、未知地点、未知时辰、失败、部分内容、future schema 只读状态显示对应说明，动作不会覆盖数据。
4. Tab 顺序从返回/导航到标题、输入、主动作、证据和保存动作；焦点可见且不会被底部导航遮挡。
5. 浏览器字体放大到 200% 或系统最小窗口时，文本不重叠、按钮仍可触达；关闭动画或启用 `prefers-reduced-motion` 后仍可完成流程。
6. DevTools 4G/离线切换时，已缓存 shell 显示离线页；本地排盘和资料不依赖网络。

## iPhone 手工矩阵（待真实设备）

在最小支持 iOS 版本和一台小屏/大屏 iPhone 上重复上述流程，并打开动态文字、减少动态效果、深色模式、键盘输入和系统文件 App。需要记录设备型号、iOS 版本、构建号、截图/录屏、失败步骤和签字人。没有 Apple Developer、签名包和真机前，本矩阵保持 BLOCKED。

## 当前证据边界

CUA/浏览器截图只能证明当前 Web 会话的视觉与交互，不等同于 iPhone、VoiceOver、Safari 私有存储和系统分享面板验收。发布前必须补齐真实设备证据。
