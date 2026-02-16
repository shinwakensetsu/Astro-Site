/**
 * 共通ユーティリティ関数
 * ニュース記事で使用する日付フォーマットとカテゴリー色
 */

/**
 * 日付文字列を「YYYY.MM.DD」形式にフォーマット
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * カテゴリ名 → CSS modifier クラス識別子
 * 色は global.css の --color-cat-* トークンで定義
 */
const categoryClassMap: Record<string, string> = {
  お知らせ: "notice",
  プレスリリース: "press",
  イベント: "event",
  その他: "other",
};

export function getCategoryClass(category: string): string {
  return categoryClassMap[category] || "other";
}
