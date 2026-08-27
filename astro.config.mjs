// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import srJoin from './src/integrations/sr-join.js';
import securityHeaders from './src/integrations/security-headers.js';

// https://astro.build/config
export default defineConfig({
    // 本番の正規URL（canonical / OGP / サイトマップ生成の基準）
    site: 'https://www.sinwakensetu.co.jp',

    integrations: [srJoin(), securityHeaders()],
    adapter: cloudflare(),

    devToolbar: {
        enabled: false,
    },

    // hybrid rendering: デフォルト静的、prerender=falseのページのみSSR
    output: 'static',

    // ビルド設定
    build: {
        // 静的アセットのインライン化しきい値
        inlineStylesheets: 'auto',
    },

    // 開発サーバー設定
    server: {
        port: 4321,
    },
});
