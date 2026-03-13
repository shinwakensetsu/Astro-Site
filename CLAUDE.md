# Claude Code プロジェクト指示書

このファイルはすべての会話で自動読み込みされます。以下のルールはユーザーの明示的な指示なしに変更できません。

---

## FIX 済みファイル — 編集禁止

以下のファイルは実装・レビューを経てユーザーが確定（fix）したものです。
**改善点を発見しても、ユーザーの判断と明示的な許可を得るまで編集してはいけません。**
提案は口頭でのみ行い、コードへの変更は行わないこと。

| ファイル                       | fix日      | 備考                                           |
| ------------------------------ | ---------- | ---------------------------------------------- |
| `src/layouts/Layout.astro`     | 2026-03-09 | ヘッダー・フッター・ドロワー構造およびスタイル |
| `src/components/Sitemap.astro` | 2026-03-09 | ドロワー・フッター共通サイトマップ             |
| `src/pages/index.astro`        | 2026-03-10 | newsセクションのレイアウト・レスポンシブ確定   |

---

## プロジェクト概要

Astro + microCMS の企業サイト（伸和建設株式会社）。

### スタイル方針

- Pure CSS（CSS Custom Properties + Astro scoped styles）。Tailwind / Bootstrap 使用禁止
- デザイントークン: `src/styles/global.css`
- リセット・基本要素: `src/styles/base.css`
- コンポーネントスタイル: 各 `.astro` ファイルの `<style>` ブロック

### ブレークポイント（max-width基準）

| 名称 | 境界   | 対象               |
| ---- | ------ | ------------------ |
| xxs  | 320px  | 極小スマートフォン |
| xs   | 425px  | 小型スマートフォン |
| sm   | 768px  | スマートフォン全般 |
| md   | 1024px | タブレット         |
| lg   | 1440px | デスクトップ       |

方向（min-width / max-width）はコンポーネントの複雑度に応じて選択可。

### 命名規則

BEM（Block\_\_Element--Modifier）+ 状態クラス `is-` / `has-` + JS フック `js-`

---

## アイコン付きリンク（arrow-link）実装ルール

トップページの `__more` リンクで使用している共通パターン。新規セクション追加時も必ずこの構造に従うこと。

### HTML 構造（必須）

```html
<a
  class="arrow-link arrow-link--on-{dark|light} {block}__more"
  href="..."
  data-sr-join
>
  <span class="arrow-link__text">
    <span>{ラベル前半}は</span>
    <span>こちら</span>
  </span>
  <IconArrow width="72" height="72" />
</a>
```

### ルール

| #   | 規約                                                                                                            |
| --- | --------------------------------------------------------------------------------------------------------------- |
| 1   | `<a>` に付与するクラスは `arrow-link` + 修飾子 `--on-dark` or `--on-light` + ブロック固有 `{block}__more` の3つ |
| 2   | テキストは `arrow-link__text > span × 2` で2行分割。1行目末尾は「は」で終わり、2行目は「こちら」固定            |
| 3   | アイコンは `<IconArrow width="72" height="72" />`。サイズ変更不可（CSS clamp で自動調整済み）                   |
| 4   | `data-sr-join` 属性を必ず付与（スクロールアニメーション用）                                                     |
| 5   | 配色は背景に応じて `--on-dark`（暗背景）/ `--on-light`（明背景）を選択                                          |
| 6   | 配置CSS: `{block}__more` に `width: fit-content` + `margin-left: auto`（右寄せ）が基本形                        |
| 7   | `.arrow-link` 共通CSS（flex / gap / font-size）は `index.astro` の `<style>` に定義済み。重複定義禁止           |

### 色の対応表

| 修飾子       | テキスト色         | circle fill             | path stroke             |
| ------------ | ------------------ | ----------------------- | ----------------------- |
| `--on-dark`  | `--color-white`    | `--color-primary-light` | `--color-gray-500`      |
| `--on-light` | `--color-gray-500` | `--color-gray-500`      | `--color-primary-light` |

hover 時は circle と path の色が反転する（`IconArrow.astro` 内で定義済み）。

---

## 参照ドキュメント

| ファイル                         | 内容                       |
| -------------------------------- | -------------------------- |
| `work/docs/css-rules.md`         | CSS 設計ルール詳細         |
| `work/docs/DEVELOPMENT.md`       | 開発ガイド                 |
| `work/header-footer-fix-plan.md` | ヘッダー・フッター修正履歴 |
| `work/drawer-bp-plan.md`         | ドロワー・BP 設計履歴      |
