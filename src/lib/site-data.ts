export interface MenuItem {
  label: string;
  href?: string;
  labelEn?: string;
  children?: MenuItem[];
}

export const siteStructure: MenuItem[] = [
  {
    label: 'トップページ',
    labelEn: 'HOME',
    href: '/',
  },
  {
    label: '会社案内',
    labelEn: 'Company',
    children: [
      { label: '会社概要', href: '/company#info01' },
      { label: 'ご挨拶', href: '/company#info02' },
      { label: '会社沿革', href: '/company#info03' },
      { label: '御用達', href: '/company#info04' },
      { label: '儀式道具', href: '/company#info05' },
      { label: '京の老舗', href: '/company#info06' },
      { label: '京都大工業組合鑑札', href: '/company#info07' },
    ],
  },
  {
    label: '施工事例',
    labelEn: 'Works',
    children: [
      { label: '塔', href: '/works#info01' },
      { label: '伽藍', href: '/works#info02' },
      { label: '神社', href: '/works#info03' },
      { label: '門', href: '/works#info04' },
      { label: '鐘楼', href: '/works#info05' },
      { label: '収蔵庫', href: '/works#info06' },
      { label: '教会', href: '/works#info07' },
    ],
  },
  {
    label: 'アクセスマップ',
    labelEn: 'Access',
    href: '/access',
  },
  {
    label: '人材募集',
    labelEn: 'Recruite',
    href: '/recruite',
  },
  {
    label: 'お問い合わせ・ご相談',
    href: '/contact',
  },
  {
    label: 'サイトマップ',
    href: '/sitemap',
  },
];
