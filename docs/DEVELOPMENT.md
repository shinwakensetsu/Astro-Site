# 開発ガイド

## 技術スタック

| カテゴリ       | 技術                    |
| -------------- | ----------------------- |
| フレームワーク | Astro 5.x (SSG モード)  |
| ホスティング   | Cloudflare Pages        |
| CMS            | microCMS                |
| バリデーション | Zod                     |
| 言語           | TypeScript / JavaScript |

---

## 環境構築

### 必要条件

- Node.js 18.x 以上
- npm または pnpm

### セットアップ

```bash
# リポジトリをクローン後
npm install
```

### 環境変数

`.env` ファイルに以下を設定:

```env
MICROCMS_SERVICE_DOMAIN=your-service-domain
MICROCMS_API_KEY=your-api-key
SITE_URL=http://localhost:4321
```

---

## 開発コマンド

| コマンド          | 説明                              |
| ----------------- | --------------------------------- |
| `npm run dev`     | 開発サーバー起動 (localhost:4321) |
| `npm run build`   | 本番ビルド (SSG)                  |
| `npm run preview` | ビルド結果をプレビュー            |

---

## ローカル開発

### 開発サーバー起動

```bash
npm run dev
```

起動後、以下を確認:

| 確認項目     | URL                           | 期待結果              |
| ------------ | ----------------------------- | --------------------- |
| トップページ | http://localhost:4321/        | ヒーロー画像・FAQ表示 |
| FAQ          | http://localhost:4321/faq     | アコーディオン動作    |
| お問い合わせ | http://localhost:4321/contact | フォーム表示          |
| ニュース     | http://localhost:4321/news    | 記事一覧表示          |

### microCMS 接続確認

開発サーバー起動時にコンソールでエラーが出ていないことを確認。
環境変数が未設定の場合、起動時にエラーがスローされます。

---

## テスト

### ユニットテスト

```bash
npm run test
```

### セキュリティ E2E テスト

```bash
# 仮想環境セットアップ (初回のみ)
cd tests/e2e/security
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# テスト実行 (開発サーバー起動中に実行)
pytest test_e2e.py -v
```

**テスト対象:**

- XSS 攻撃
- SQL インジェクション
- NoSQL インジェクション
- OS コマンドインジェクション
- パストラバーサル

### ビルド検証

```bash
# SSG ビルド
npm run build

# ビルド結果確認
ls -la dist/
```

正常時の出力例:

```
✓ output: "static"
✓ adapter: @astrojs/cloudflare
✓ Built in ~2s
```

---

## デプロイメント

### Cloudflare Pages

```bash
# wrangler でデプロイ
npx wrangler pages deploy dist
```

または GitHub 連携で自動デプロイ:

1. Cloudflare Dashboard → Pages → Create project
2. GitHub リポジトリを接続
3. ビルド設定:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. 環境変数設定:
   - `MICROCMS_SERVICE_DOMAIN`
   - `MICROCMS_API_KEY`

### microCMS Webhook (自動再ビルド)

1. Cloudflare Pages → Settings → Builds & Deployments
2. Deploy hooks → Create hook
3. microCMS → API設定 → Webhook → URL を登録

---

## microCMS 連携

### API クライアント

`src/lib/microcms.ts` で microCMS クライアントを管理しています。

### 利用可能なエンドポイント

| 関数                | エンドポイント | 用途             |
| ------------------- | -------------- | ---------------- |
| `getTopPage()`      | `top-page`     | トップページ情報 |
| `getFaqs()`         | `faq`          | FAQ 一覧         |
| `getNews()`         | `news`         | ニュース一覧     |
| `getNewsDetail(id)` | `news/{id}`    | ニュース詳細     |

### 使用例

```astro
---
import { getNews } from "../lib/microcms";

const newsData = await getNews({ limit: 5 });
---
```

---

## コーディング規約

### ファイル命名

- **コンポーネント**: PascalCase (`FaqSection.astro`)
- **ユーティリティ**: camelCase (`formatDate.ts`)
- **ページ**: kebab-case or 特殊記法 (`[slug].astro`)

### コンポーネント構成

```astro
---
// 1. インポート
// 2. Props 型定義
// 3. データ取得・ロジック
---

<!-- 4. テンプレート -->
<style>
  /* 5. スコープ付きスタイル */
</style>
```

---

## セキュリティ

`src/middleware.js` で以下のヘッダーを自動設定:

| ヘッダー                    | 値                                |
| --------------------------- | --------------------------------- |
| `X-Content-Type-Options`    | nosniff                           |
| `X-Frame-Options`           | DENY                              |
| `Content-Security-Policy`   | microCMS / YouTube / SSGform 許可 |
| `Strict-Transport-Security` | 本番のみ有効                      |
