import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const publicRoot = new URL('../public/', import.meta.url);
const source = await readFile(new URL('brand/gentask-symbol.svg', publicRoot), 'utf8');
const mark = source.match(/<g[\s\S]*<\/g>/)[0];
const svg = (contents) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${contents}</svg>`;
const light = '#607235';
const dark = '#a8bf6a';
const paper = '#f5f5ef';

for (const [mode, color] of [['light', light], ['dark', dark]]) {
  await writeFile(new URL(`brand/favicon-${mode}.svg`, publicRoot), svg(`<g fill="${color}">${mark}</g>`));
}
await writeFile(new URL('favicon.svg', publicRoot), svg(`<style>svg{fill:${light}}@media(prefers-color-scheme:dark){svg{fill:${dark}}}</style>${mark}`));

const render = async (markup, size, name) => {
  const buffer = await sharp(Buffer.from(markup)).resize(size, size).png().toBuffer();
  await writeFile(new URL(name, publicRoot), buffer);
  return buffer;
};
const appIcon = (scale) => svg(`<path fill="${light}" d="M0 0h512v512H0z"/><g fill="${paper}" transform="translate(${256 * (1 - scale)} ${256 * (1 - scale)}) scale(${scale})">${mark}</g>`);
for (const size of [192, 512]) await render(appIcon(0.78), size, `brand/gentask-app-${size}.png`);
// 마스커블 아이콘의 심볼을 중앙 안전 원 안에 배치한다.
await render(appIcon(0.62), 512, 'brand/gentask-maskable-512.png');
await render(appIcon(0.78), 180, 'apple-touch-icon.png');
await render(appIcon(0.78), 192, 'icon-192.png');

const icons = [];
for (const size of [16, 32, 48]) icons.push({ size, buffer: await render(appIcon(0.88), size, `brand/favicon-${size}.png`) });
const header = Buffer.alloc(6 + 16 * icons.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icons.length, 4);
let offset = header.length;
icons.forEach(({ size, buffer }, i) => {
  const entry = 6 + i * 16;
  header[entry] = size;
  header[entry + 1] = size;
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(buffer.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += buffer.length;
});
await writeFile(new URL('favicon.ico', publicRoot), Buffer.concat([header, ...icons.map(icon => icon.buffer)]));
console.log(`브랜드 아이콘 생성 완료: ${fileURLToPath(publicRoot)}`);
