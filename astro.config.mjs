// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import srJoin from './src/integrations/sr-join.js';

// https://astro.build/config
export default defineConfig({
    integrations: [srJoin()],
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
