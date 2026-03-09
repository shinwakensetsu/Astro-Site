export interface SitemapLink {
  label: string;
  href: string;
}

export interface SitemapSection {
  heading: SitemapLink;
  links?: SitemapLink[];
}

export interface SitemapColumn {
  sections: SitemapSection[];
}

export const sitemapColumns: SitemapColumn[] = [
  {
    sections: [
      {
        heading: { label: "トップページ", href: "/" },
      },
      {
        heading: { label: "お知らせ", href: "/news" },
      },
      {
        heading: { label: "私たちについて", href: "/about" },
        links: [
          { label: "企業理念", href: "" },
          { label: "社長挨拶", href: "" },
          { label: "沿革", href: "" },
          { label: "会社概要", href: "" },
          { label: "アクセス", href: "" },
        ],
      },
      {
        heading: { label: "仕事内容", href: "/services" },
        links: [
          { label: "施工の流れ", href: "" },
          { label: "業務日記", href: "" },
        ],
      },
    ],
  },
  {
    sections: [
      {
        heading: { label: "施工事例", href: "/works" },
        links: [
          { label: "塔", href: "" },
          { label: "伽藍", href: "" },
          { label: "神社", href: "" },
          { label: "門", href: "" },
          { label: "鐘楼", href: "" },
          { label: "収蔵庫", href: "" },
          { label: "教会", href: "" },
        ],
      },
    ],
  },
  {
    sections: [
      {
        heading: { label: "RECRUIT", href: "/recruit" },
        links: [
          { label: "求める人物像", href: "" },
          { label: "監督の仕事紹介", href: "" },
          { label: "大工の仕事紹介", href: "" },
          { label: "募集要項", href: "" },
          { label: "よくある質問", href: "" },
          { label: "エントリー", href: "" },
        ],
      },
      {
        heading: { label: "お問い合わせ", href: "/contact" },
      },
    ],
  },
];
