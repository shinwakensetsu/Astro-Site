import { createClient, type MicroCMSQueries, type MicroCMSImage, type MicroCMSDate } from "microcms-js-sdk";

const serviceDomain = import.meta.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = import.meta.env.MICROCMS_API_KEY;

if (!serviceDomain) {
  console.error("❌ [Error] MICROCMS_SERVICE_DOMAIN is missing. Please check your environment variables.");
} else {
  console.log(`✅ MICROCMS_SERVICE_DOMAIN is set: ${serviceDomain}`);
}

if (!apiKey) {
  console.error("❌ [Error] MICROCMS_API_KEY is missing. Please check your environment variables.");
} else {
  console.log("✅ MICROCMS_API_KEY is set (hidden)");
}

// 環境変数から取得
const client = createClient({
  serviceDomain: serviceDomain || "MISSING_DOMAIN",
  apiKey: apiKey || "MISSING_KEY",
});

// --- 型定義 ---

// FAQの型定義（microCMSのスキーマに合わせて調整してください）
export type Faq = {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
  title: string;
  body: string; // リッチエディタ想定（HTML）
  open?: boolean; // 初期表示で開くかどうか
};

export type FaqResponse = {
  totalCount: number;
  offset: number;
  limit: number;
  contents: Faq[];
};

// --- API取得関数 ---

// FAQ一覧を取得
export const getFaqs = async (queries?: MicroCMSQueries) => {
  return await client.get<FaqResponse>({ endpoint: "faq", queries });
};

// 詳細を取得する場合（例：ブログなど）
export const getFaqDetail = async (
  contentId: string,
  queries?: MicroCMSQueries
) => {
  return await client.getListDetail<Faq>({
    endpoint: "faq",
    contentId,
    queries,
  });
};

// --- ニュース関連 ---

export type News = {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
  title: string;
  slug: string;
  publishedDate: string;
  category: string;
  excerpt?: string;
  thumbnail?: MicroCMSImage;
  content: string;
};

export type NewsResponse = {
  totalCount: number;
  offset: number;
  limit: number;
  contents: News[];
};

export type NewsPage = {
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
  pageTitle: string;
  pageDescription: string;
  subtitle: string;
};

// ニュース一覧を取得
export const getNews = async (queries?: MicroCMSQueries) => {
  return await client.get<NewsResponse>({ endpoint: "news", queries });
};

// ニュース詳細を取得
export const getNewsDetail = async (
  contentId: string,
  queries?: MicroCMSQueries
) => {
  return await client.getListDetail<News>({
    endpoint: "news",
    contentId,
    queries,
  });
};

// ニュースページ情報を取得
export const getNewsPage = async (queries?: MicroCMSQueries) => {
  return await client.getObject<NewsPage>({ endpoint: "news-page", queries });
};
