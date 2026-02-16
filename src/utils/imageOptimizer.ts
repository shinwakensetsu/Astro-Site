/**
 * microCMS Image API 最適化ユーティリティ
 * @see https://document.microcms.io/image-api/overview
 */

export interface ImageOptions {
  /** 画像の幅（px） */
  width?: number;
  /** 画像の高さ（px） */
  height?: number;
  /** 画像品質（1-100） */
  quality?: number;
  /** 画像形式 */
  format?: "auto" | "webp" | "avif" | "png" | "jpg";
  /** フィット方法 */
  fit?:
    | "clip"
    | "clamp"
    | "crop"
    | "fill"
    | "fillmax"
    | "max"
    | "min"
    | "scale";
}

/**
 * microCMS画像URLに最適化パラメータを付与
 * @param url - 元の画像URL
 * @param options - 最適化オプション
 * @returns 最適化パラメータ付きURL
 */
export function optimizeImageUrl(
  url: string | undefined | null,
  options: ImageOptions = {},
): string {
  if (!url) return "";

  const params = new URLSearchParams();

  if (options.width) params.set("w", options.width.toString());
  if (options.height) params.set("h", options.height.toString());
  if (options.quality) params.set("q", options.quality.toString());
  if (options.format) params.set("fm", options.format);
  if (options.fit) params.set("fit", options.fit);

  const queryString = params.toString();
  if (!queryString) return url;

  // URLに既存のクエリパラメータがある場合は&で連結
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${queryString}`;
}

/**
 * レスポンシブ画像用のsrcsetを生成
 * @param url - 元の画像URL
 * @param widths - 生成する幅の配列
 * @param quality - 画像品質（デフォルト: 80）
 * @returns srcset文字列
 */
export function generateSrcSet(
  url: string | undefined | null,
  widths: number[] = [320, 640, 960, 1280],
  quality: number = 80,
): string {
  if (!url) return "";

  return widths
    .map(
      (w) =>
        `${optimizeImageUrl(url, { width: w, quality, format: "auto" })} ${w}w`,
    )
    .join(", ");
}

/**
 * 一般的な画像最適化プリセット
 */
export const imagePresets = {
  /** ヒーロー画像（大きめ、高品質） */
  hero: { fit: "crop", height: 400, quality: 85, format: "auto" as const },
  /** サムネイル（記事一覧用） */
  thumbnail: { width: 800, quality: 80, format: "auto" as const },
  /** カード画像（小さめ） */
  card: { width: 400, quality: 75, format: "auto" as const },
  /** OG画像（SNS共有用） */
  ogImage: { width: 1200, height: 630, quality: 85, format: "auto" as const },
};
