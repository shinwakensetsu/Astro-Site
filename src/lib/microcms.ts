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

// FAQの型定義
export type FaqQa = {
  fieldId: "qa";
  question: string;
  answer: string;
};

export type Faq = {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
  title: FaqQa[]; // 繰り返しフィールド（フィールドID: title）
  open?: boolean;
};

export type FaqResponse = {
  totalCount: number;
  offset: number;
  limit: number;
  contents: Faq[];
};

// ニュース関連

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

// トップページ関連

export type TopPage = {
  heroImage?: MicroCMSImage;
  heroTitle?: string;
  heroDescription?: string;
} & MicroCMSDate;

// --- API取得関数 ---

// FAQ一覧を取得
export const getFaqs = async (queries?: MicroCMSQueries) => {
  try {
    return await client.get<FaqResponse>({ endpoint: "faq", queries });
  } catch (error) {
    console.error("Failed to fetch FAQs:", error);
    return null;
  }
};

// 詳細を取得する場合（例：ブログなど）
export const getFaqDetail = async (
  contentId: string,
  queries?: MicroCMSQueries
) => {
  try {
    return await client.getListDetail<Faq>({
      endpoint: "faq",
      contentId,
      queries,
    });
  } catch (error) {
    console.error(`Failed to fetch FAQ detail (${contentId}):`, error);
    return null;
  }
};

// ニュース一覧を取得
export const getNews = async (queries?: MicroCMSQueries) => {
  try {
    return await client.get<NewsResponse>({ endpoint: "news", queries });
  } catch (error) {
    console.error("Failed to fetch News:", error);
    return null;
  }
};

// ニュース詳細を取得
export const getNewsDetail = async (
  contentId: string,
  queries?: MicroCMSQueries
) => {
  try {
    return await client.getListDetail<News>({
      endpoint: "news",
      contentId,
      queries,
    });
  } catch (error) {
    console.error(`Failed to fetch News detail (${contentId}):`, error);
    return null;
  }
};

// ニュースページ情報を取得
export const getNewsPage = async (queries?: MicroCMSQueries) => {
  try {
    return await client.getObject<NewsPage>({ endpoint: "news-page", queries });
  } catch (error) {
    console.error("Failed to fetch News Page info:", error);
    return null;
  }
};

// トップページ情報を取得
export const getTopPage = async (queries?: MicroCMSQueries) => {
  try {
    const response = await client.getList<TopPage>({ endpoint: "top-page", queries });
    return response.contents[0] || null;
  } catch (error) {
    console.error("Failed to fetch Top Page:", error);
    return null;
  }
};
