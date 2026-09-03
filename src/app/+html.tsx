import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Web-only static document shell. Route components still own the product UI;
 * this file only provides crawlable metadata and the native-like scroll reset.
 */
export default function RootHtml({ children }: PropsWithChildren) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#050907" />
        <meta name="color-scheme" content="dark" />
        <meta name="description" content="观象·命盘：八字、六爻、紫微斗数与西方星盘的本地排盘、证据与复盘工具。" />
        <meta name="application-name" content="观象·命盘" />
        <meta property="og:site_name" content="观象·命盘" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="观象·命盘｜本地排盘与复盘工具" />
        <meta property="og:description" content="以星为镜，以象观心；记录输入、过程与结果，不把缺失信息猜成结论。" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/favicon.ico" />
        <title>观象·命盘｜本地排盘与复盘工具</title>
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
