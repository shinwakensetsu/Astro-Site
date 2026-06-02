import {
  createClient,
  type MicroCMSQueries,
  type MicroCMSImage,
} from "microcms-js-sdk";

const serviceDomain = import.meta.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = import.meta.env.MICROCMS_API_KEY;

if (!serviceDomain) {
  throw new Error(
    "MICROCMS_SERVICE_DOMAIN is not set. Please check your environment variables.",
  );
}

if (!apiKey) {
  throw new Error(
    "MICROCMS_API_KEY is not set. Please check your environment variables.",
  );
}

// microCMS クライアント
const client = createClient({
  serviceDomain,
  apiKey,
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

export type Diary = {
  id: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  revisedAt: string;
  title: string;
  text: string;
  "posting-time"?: string;
};

export type DiaryResponse = {
  totalCount: number;
  offset: number;
  limit: number;
  contents: Diary[];
};

// --- API取得関数 ---

// FAQ一覧を取得
export const getFaqs = async (queries?: MicroCMSQueries) => {
  return await client.get<FaqResponse>({ endpoint: "faq", queries });
};

// ニュース一覧を取得
export const getNews = async (queries?: MicroCMSQueries) => {
  return await client.get<NewsResponse>({ endpoint: "news", queries });
};

// ニュースページ情報を取得
export const getNewsPage = async (queries?: MicroCMSQueries) => {
  return await client.getObject<NewsPage>({ endpoint: "news-page", queries });
};

export const getDiary = async (queries?: MicroCMSQueries) => {
  return await client.get<DiaryResponse>({ endpoint: "diary", queries });
};
