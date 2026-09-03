# 观象·命盘 Web 发布交付说明

> 版本：2026-09-03。当前为部署前最后一步；没有域名、托管账号和公开隐私 URL，不宣称已上线。

## 可复现构建

在仓库根目录执行：

```bash
npm ci
npm run typecheck
npm run lint
npm run security:scan
npm run security:audit
npm test
npm run build:web
npm run verify:web
```

`npm run build:web` 使用 Expo SDK 57 static output 生成 `dist/`；`verify:web` 检查路由、元数据、JavaScript bundle 和 public release files。构建不需要服务端账号。

## 当前导出内容

静态路由：`/`、`/home`、`/profiles`、`/records`、`/settings`、`/privacy`、`/terms`、`/module/[slug]`、`/_sitemap`、`/+not-found`（共 10 条）。

公共文件：`manifest.webmanifest`、`robots.txt`（预发布阶段 `Disallow: /`）、`offline.html`、`sw.js`、`_headers`、`favicon.ico`。根 `+html.tsx` 提供 `zh-CN`、标题、描述、主题色和 Open Graph 静态元数据；隐私/协议页有独立标题和描述。

## 托管要求与回滚

- 托管需要把 `dist/` 原样发布，并将未知路径回退到 `index.html` 或按静态路由返回 `+not-found.html`；具体 rewrite 规则由托管商决定。
- `_headers` 是 Cloudflare Pages/兼容静态托管的声明模板；其他托管商必须等价配置 CSP、nosniff、frame deny、referrer 和 permissions policy，并审阅 CSP 是否与其 CDN/错误监控兼容。
- `sw.js` 是 network-first：成功响应会写入同源运行时缓存，失败时回退对应缓存/离线页；升级时应递增 `CACHE` 版本并补充旧版本清理策略，避免发布旧 bundle。
- 发布前由负责人设置正式 `robots.txt`、域名、HTTPS、支持 URL、隐私 URL、监控与回滚负责人。当前无域名/托管凭据，故部署与公开索引 BLOCKED。

## 不得从构建推导的结论

静态导出不等于浏览器兼容、低网、VoiceOver、真实设备或 App Store 验收；这些仍需按 `docs/UX_ACCEPTANCE.md` 和 `docs/DEVICE_ACCEPTANCE.md` 签字。

## 最终工程证据（2026-09-03）

本地 `npm run build:web` 与 `npm run verify:web` 已通过，导出并验证 10 条路由及全部 public release files；统一 `npm test` 为 215/215。GitHub Actions [run 33767015750](https://github.com/LJ0930l-beep/guanxiang-mingpan/actions/runs/33767015750) 的 `Web export` 和 `Verify web export` 均 `completed/success`，不是 skip。当前仍缺正式域名、HTTPS 托管、公开支持/隐私 URL、真实浏览器兼容签字和部署回滚负责人，因此本文件是部署前交付，不是上线证明。
