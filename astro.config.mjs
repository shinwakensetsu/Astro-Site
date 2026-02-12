// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    // SSG (静的サイト生成) - Cloudflare Pages 向け
    // 静的出力ではアダプター不要（Cloudflare Pagesが直接distをホスト）
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
