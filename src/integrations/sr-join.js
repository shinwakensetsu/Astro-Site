/**
 * Astro Integration: sr-join
 *
 * ビルド後の全HTMLファイルを走査し、[data-sr-join] を持つ要素を2要素に展開する。
 *
 * 変換前:
 *   <p class="hero__copy-main" data-sr-join>
 *     テキスト<span class="break">続き</span>
 *   </p>
 *
 * 変換後:
 *   <p class="sr-only">テキスト続き</p>
 *   <p class="hero__copy-main" aria-hidden="true">
 *     テキスト<span class="break">続き</span>
 *   </p>
 */

import { fileURLToPath } from "node:url";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export default function srJoinIntegration() {
  return {
    name: "sr-join",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const { JSDOM } = await import("jsdom");
        const dirPath = fileURLToPath(dir);
        let fileCount = 0;
        let elementCount = 0;

        async function processDir(directory) {
          const entries = await readdir(directory, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = join(directory, entry.name);
            if (entry.isDirectory()) {
              await processDir(fullPath);
            } else if (entry.name.endsWith(".html")) {
              const changed = await processFile(fullPath);
              if (changed > 0) {
                fileCount++;
                elementCount += changed;
              }
            }
          }
        }

        async function processFile(filePath) {
          const html = await readFile(filePath, "utf-8");
          // data-sr-join を含まないファイルは早期リターン
          if (!html.includes("data-sr-join")) return 0;

          const dom = new JSDOM(html);
          const { document } = dom.window;
          const elements = document.querySelectorAll("[data-sr-join]");

          elements.forEach((el) => {
            const text = el.textContent.trim();
            if (!text) return;

            // sr-only: プレーンテキストのみ、視覚的に非表示
            const sr = document.createElement(el.tagName.toLowerCase());
            sr.className = "sr-only";
            sr.textContent = text;

            // 元要素: aria-hidden で SR から隠し、data-sr-join を除去
            el.setAttribute("aria-hidden", "true");
            el.removeAttribute("data-sr-join");

            el.parentNode.insertBefore(sr, el);
          });

          await writeFile(filePath, dom.serialize());
          return elements.length;
        }

        await processDir(dirPath);
        logger.info(
          `sr-join: ${elementCount} 要素を ${fileCount} ファイルで処理しました`,
        );
      },
    },
  };
}
