/*
 * 마스터 SVG 를 public/ 의 아이콘 PNG 로 뽑는다.
 *
 * 브라우저로 그리는 것은 e2e 가 이미 크로미움을 갖고 있어 의존을 하나도 늘리지 않기 때문이다.
 * 크기 목록의 원본은 manifest.webmanifest 와 index.html 이며 이 파일은 그것을 따라 적는다.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, '..', 'public');

const targets = [
  { svg: 'mark.svg', size: 192, file: 'icon-192.png' },
  { svg: 'mark.svg', size: 512, file: 'icon-512.png' },
  { svg: 'mark.svg', size: 180, file: 'apple-touch-icon.png' },
  { svg: 'mark-maskable.svg', size: 192, file: 'icon-maskable-192.png' },
  { svg: 'mark-maskable.svg', size: 512, file: 'icon-maskable-512.png' },
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });

for (const { svg, size, file } of targets) {
  const source = readFileSync(join(here, svg), 'utf8');

  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>html,body{margin:0;padding:0}svg{display:block;width:${size}px;height:${size}px}</style>${source}`,
  );

  writeFileSync(join(publicDir, file), await page.screenshot({ omitBackground: true }));
  console.log(`${file} — ${svg} @ ${size}`);
}

await browser.close();
