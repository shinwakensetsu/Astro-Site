# ディレクトリ構成

```
Astro-Site/
├── .astro/                       # Astro のキャッシュ (gitignore)
├── .claude/                      # Claude 設定
├── .env                          # 環境変数 (gitignore)
├── .env.example                  # 環境変数サンプル
├── .github/                      # GitHub 設定
├── .git/                         # Git 管理 (ローカル)
├── .husky/                       # Git Hooks
├── .vscode/                      # VS Code 設定
├── .wrangler/                    # Wrangler 設定
├── astro.config.mjs              # Astro 設定 (SSG モード)
├── eslint.config.js              # ESLint 設定
├── media.css                     # 追加スタイル
├── uni.css                       # 追加スタイル
├── vitest.config.ts              # Vitest 設定
├── package.json                  # 依存関係・スクリプト
├── package-lock.json             # 依存関係ロック
├── tsconfig.json                 # TypeScript 設定
├── README.md                     # ルートREADME
│
├── docs/                         # プロジェクトドキュメント
│   ├── README.md                 # プロジェクト概要
│   ├── DEVELOPMENT.md            # 開発ガイド
│   └── STRUCTURE.md              # このファイル
│
├── public/                       # 静的ファイル (そのまま配信)
│   └── favicon.svg
│
├── src/                          # ソースコード
│   ├── middleware.js             # セキュリティヘッダー設定
│   │
│   ├── assets/                   # ビルド時に処理されるアセット
│   │
│   ├── components/               # 再利用可能コンポーネント
│   │   ├── Accordion.astro       # アコーディオン UI
│   │   ├── AccordionItem.astro   # アコーディオン項目
│   │   ├── ContactForm.astro     # お問い合わせフォーム
│   │   ├── FaqSection.astro      # FAQ セクション
│   │
│   ├── layouts/                  # ページレイアウト
│   │   └── Layout.astro          # 共通レイアウト
│   │
│   ├── lib/                      # ライブラリ・API クライアント
│   │   ├── microcms.ts           # microCMS 連携
│   │   └── contactSchema.ts      # フォームバリデーション (Zod)
│   │
│   ├── pages/                    # ページ (ルーティング)
│   │   ├── index.astro           # トップページ (/)
│   │   ├── contact.astro         # お問い合わせ (/contact)
│   │   ├── faq.astro             # FAQ (/faq)
│   │   ├── api/
│   │   │   └── contact.ts        # お問い合わせ API
│   │   └── news/
│   │       ├── index.astro       # ニュース一覧 (/news)
│   │       └── [slug].astro      # ニュース詳細 (/news/:slug)
│   │
│   ├── styles/                   # グローバルスタイル
│   │   └── global.css            # 共通スタイル
│   │
│   └── utils/                    # ユーティリティ関数
│       ├── formatters.ts         # 日付・カテゴリ色
│       ├── htmlSanitizer.ts      # HTML サニタイズ
│       ├── imageOptimizer.ts     # 画像最適化
│       └── sanitizer.ts          # 入力サニタイズ
│
├── tests/                        # テストコード
│   ├── unit/                     # ユニットテスト (Vitest)
│   │   ├── contactSchema.test.ts
│   │   ├── formatters.test.ts
│   │   ├── htmlSanitizer.test.ts
│   │   ├── imageOptimizer.test.ts
│   │   └── sanitizer.test.ts
│   └── e2e/                      # E2E テスト
│       └── security/             # セキュリティテスト (Pytest)
│           ├── attack_payloads.py
│           ├── conftest.py
│           ├── requirements.txt
│           └── test_e2e.py
│
└── dist/                         # ビルド出力 (gitignore)
```

---

## 新規ファイル追加ガイド

### ページを追加する場合

`src/pages/` にファイルを作成。ファイル名がそのままURLパスになります。

```
src/pages/about.astro  →  /about
src/pages/blog/index.astro  →  /blog
```

### コンポーネントを追加する場合

`src/components/` に PascalCase で作成。

### microCMS エンドポイントを追加する場合

1. `src/lib/microcms.ts` に型定義を追加
2. 取得関数を追加
3. 必要なページで import して使用

### ファイル追加時後

docs/STRUCTURE.md のディレクトリマップに追記するのを忘れないこと
