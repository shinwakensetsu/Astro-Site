# Astro-Site

microCMS と連携した Astro ベースのウェブサイトプロジェクト。

## クイックスタート

```bash
npm install
npm run dev
```

開発サーバー: http://localhost:4321

## 環境変数

`.env` を作成し、以下を設定してください（`.env.example` を参照）。

```env
MICROCMS_SERVICE_DOMAIN=your-service-domain
MICROCMS_API_KEY=your-api-key
SITE_URL=http://localhost:4321
```

## コマンド

| コマンド          | 説明             |
| ----------------- | ---------------- |
| `npm run dev`     | 開発サーバー起動 |
| `npm run build`   | 本番ビルド       |
| `npm run preview` | ビルドプレビュー |

## ドキュメント

詳細情報は [`docs/`](./docs/) を参照:

- [プロジェクト概要](./docs/README.md)
- [開発ガイド](./docs/DEVELOPMENT.md)
- [ディレクトリ構成](./docs/STRUCTURE.md)
