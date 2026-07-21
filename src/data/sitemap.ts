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
          { label: "企業理念", href: "/about#philosophy" },
          { label: "社長挨拶", href: "/about#greeting" },
          { label: "沿革", href: "/about#history" },
          { label: "会社概要", href: "/about#company" },
          { label: "アクセス", href: "/about#access" },
        ],
      },
      {
        heading: { label: "仕事内容", href: "/services" },
        links: [
          { label: "施工の流れ", href: "/services#flow" },
          { label: "業務日記", href: "/services#diary" },
        ],
      },
    ],
  },
  {
    sections: [
      {
        heading: { label: "施工事例", href: "/works" },
        links: [
          { label: "塔", href: "/works#tower" },
          { label: "伽藍", href: "/works#temple" },
          { label: "神社", href: "/works#shrine" },
          { label: "門", href: "/works#gate" },
          { label: "鐘楼", href: "/works#belltower" },
          { label: "収蔵庫", href: "/works#repository" },
          { label: "教会", href: "/works#church" },
        ],
      },
    ],
  },
  {
    sections: [
      {
        heading: { label: "RECRUIT", href: "/recruit" },
        links: [
          { label: "求める人物像", href: "/recruit#persona" },
          { label: "監督の仕事紹介", href: "/recruit#supervisor" },
          { label: "大工の仕事紹介", href: "/recruit#carpenter" },
          { label: "募集要項", href: "/recruit#requirements" },
          { label: "よくある質問", href: "/recruit#faq" },
          { label: "エントリー", href: "/recruit#entry" },
        ],
      },
      {
        heading: { label: "お問い合わせ", href: "/contact" },
      },
    ],
  },
];
