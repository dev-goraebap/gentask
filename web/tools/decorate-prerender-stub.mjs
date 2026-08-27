/**
 * 프리렌더된 진입 라우트가 리다이렉트일 때 생기는 스텁 문서를 꾸민다.
 *
 * `''` 가 redirectTo 인 동안 프리렌더러는 meta refresh 문서 하나를 굽는다. 느린
 * 회선에서는 다음 문서가 도착할 때까지 이 문서가 화면에 남아 "Redirecting to ..."
 * 가 그대로 보인다. 배경과 부팅 표시를 넣어 셸과 같은 화면으로 만든다.
 *
 * 진입 라우트가 실제 페이지를 갖게 되면 스텁이 아니므로 이 스크립트는 손을 뗀다.
 */
import { readFile, writeFile } from 'node:fs/promises';

const target = new URL('../dist/web/browser/index.html', import.meta.url);
const html = await readFile(target, 'utf8');

if (!/http-equiv="refresh"/i.test(html)) {
  console.log('index.html 이 리다이렉트 스텁이 아니다. 손대지 않는다.');
  process.exit(0);
}

const style = `    <style>
      :root { color-scheme: light dark; }
      html, body { height: 100%; margin: 0; background: #fefefe; }
      @media (prefers-color-scheme: dark) {
        html, body { background: #26262b; }
      }
      pre { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
      .app-boot { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; }
      .app-boot span {
        width: 1.75rem; height: 1.75rem; border-radius: 50%;
        border: 2px solid rgba(128, 128, 132, 0.25);
        border-top-color: rgba(128, 128, 132, 0.75);
        animation: app-boot-spin 0.7s linear infinite;
      }
      @keyframes app-boot-spin { to { transform: rotate(360deg); } }
      @media (prefers-reduced-motion: reduce) { .app-boot span { animation-duration: 2.4s; } }
    </style>
`;

const decorated = html
  .replace('</head>', `${style}  </head>`)
  .replace('<body>', '<body>\n    <div class="app-boot" role="status" aria-label="불러오는 중"><span></span></div>');

await writeFile(target, decorated, 'utf8');
console.log(`진입 스텁을 꾸몄다. ${html.length} B -> ${decorated.length} B`);
