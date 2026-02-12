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
 * カテゴリーごとの表示色
 */
export const categoryColors: Record<string, string> = {
  お知らせ: "#0066cc",
  プレスリリース: "#00a859",
  イベント: "#ff9500",
  その他: "#999",
};
