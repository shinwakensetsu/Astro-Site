# 設計方針 (Design Guidelines)

本プロジェクトは、Astroフレームワークを使用した静的サイト（一部動的要素あり）です。
社寺建築会社のウェブサイトとして、SEO、パフォーマンス、アクセシビリティを重視した設計を行います。

## 1. 技術スタック

- **Framework**: [Astro](https://astro.build/) (v5.x)
- **Language**: TypeScript
- **Styling**: Scoped CSS (Astro標準), Global CSS
- **CMS**: microCMS (ニュース、FAQ、トップページコンテンツ等)
- **Package Manager**: npm

## 2. ディレクトリ構造

Astroの標準的なディレクトリ構造に準拠します。

```
src/
├── assets/         # ビルド処理が必要な静的アセット（画像など）
├── components/     # 再利用可能なUIコンポーネント (FaqSection, ContactFormなど)
├── layouts/        # ページレイアウト (Layout.astro)
├── lib/            # ユーティリティ関数、型定義、データ取得ロジック
│   ├── details-utils.ts # <details>要素の制御ユーティリティ
│   ├── microcms.ts      # microCMSクライアントと型定義
│   └── site-data.ts     # サイト構造データ（メニュー、リンク）
├── pages/          # ページコンポーネント（ルーティング）
│   ├── header.astro     # 共通ヘッダー（※特例的にpagesに配置）
│   ├── sitemap.astro    # サイトマップページ
│   └── ...
└── styles/         # グローバルスタイル
```

## 3. コンポーネント設計方針

### 共通レイアウト (`src/layouts/Layout.astro`)
- 全ページの基本構造（`<html>`, `<head>`, `<body>`）を定義。
- 共通ヘッダー (`Header.astro`) を読み込み、全ページに表示。
- ヘッダー固定 (`position: fixed`) に伴うコンテンツの余白調整 (`padding-top`) を管理。

### ヘッダー (`src/pages/header.astro`)
- **配置**: 現在は `src/pages/header.astro` に配置されていますが、役割としてはUIコンポーネントです。
- **機能**:
    - 上部固定表示。
    - ドロップダウンメニュー（会社案内、施工事例）。
    - アクセシビリティ対応: フォーカス外れ時に自動で閉じるJS制御 (`src/lib/details-utils.ts`)。
- **データ**: 現状はHTML直書きですが、将来的には `src/lib/site-data.ts` を利用して動的生成することを推奨します。

### データ管理 (`src/lib/`)
- **静的データ**: サイトマップやナビゲーション構造は `site-data.ts` で一元管理。
- **動的データ**: microCMSからのデータ取得は `microcms.ts` に集約。コンポーネント内で直接APIを叩かず、このファイルを介して型安全に取得します。

## 4. スタイリング方針

- **Scoped CSS**: 原則として、コンポーネント固有のスタイルは `.astro` ファイル内の `<style>` タグに記述します。
- **Global CSS**: リセットCSSやサイト全体のフォント設定などは `src/styles/global.css` に記述します。
- **レスポンシブ**: メディアクエリを使用して、モバイル/デスクトップの表示を切り替えます（現状はデスクトップ寄り、モバイル対応は要確認）。

## 5. アクセシビリティ (a11y)

- **セマンティックHTML**: `<header>`, `<nav>`, `<main>`, `<h1>` などを適切に使用します。
- **キーボード操作**: ドロップダウンメニューなどはキーボード（Tabキー）での操作を考慮し、フォーカス管理を行います。
- **ARIA属性**: 必要に応じて `aria-label` などを付与し、スクリーンリーダー対応を行います。

## 6. 今後の拡張方針

- **画像管理**: `public/` への配置と `src/assets/` の使い分けを明確にします。最適化が必要な画像は `src/assets/` を推奨。
- **SEO**: `Layout.astro` に OGPタグやメタディスクリプションを動的に設定できる仕組みを導入します。
