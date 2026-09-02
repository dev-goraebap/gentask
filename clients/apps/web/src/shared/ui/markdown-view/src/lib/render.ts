import type { LanguageRegistration } from 'shiki/core';
import { Marked } from 'marked';
import markedAlert from 'marked-alert';

/**
 * 마크다운을 HTML 로 옮기는 자리.
 *
 * <p>파일을 갈라 둔 것은 <b>늦게 싣기 위해서다.</b> 보는 쪽이 이것을 동적으로 부르므로 파서와
 * 색칠개와 그림개가 첫 묶음에서 빠진다.
 *
 * <p>이 결과는 소독을 지나야 한다. marked 는 본문에 섞인 raw HTML 을 막지 않고 그대로 흘려보내며
 * `sanitize` 옵션은 v5 에서 사라졌다. 본문은 사람과 에이전트가 적는 것이라 스크립트가 섞여 들어올
 * 수 있고, 그것을 걷는 것은 [markdown-view]가 `[innerHTML]` 로 심을 때 도는 Angular 의 소독기다.
 * 아래 확인 칸이 input 이 아니라 span 인 것이 그 소독기가 실제로 돌고 있다는 증거다.
 *
 * <p>그래서 이 결과를 `bypassSecurityTrustHtml` 로 심으면 안 된다. 그 순간 경로가 열린다.
 */

/** 옛 규약이 남긴 주석. 보이면 글이 아니라 표시가 읽히므로 그리기 전에 걷는다. */
const COMMENT = /<!--[\s\S]*?-->/g;

const FENCE = /^```([A-Za-z0-9+#-]*)/gm;

/** 코드 한 조각을 색칠한 HTML 로 바꾼다. Shiki 를 세운 뒤에야 생긴다. */
export type Highlight = (code: string, lang: string) => string;

/** 글이 담은 코드 판의 언어들. 없으면 빈 배열이며, 그때는 Shiki 를 세우지 않는다. */
export function languagesIn(markdown: string): readonly string[] {
  const found = new Set<string>();
  for (const [, lang] of markdown.matchAll(FENCE)) {
    if (lang !== '' && lang !== 'mermaid') found.add(lang);
  }
  return [...found];
}

export function hasMermaid(markdown: string): boolean {
  return /^```mermaid\s*$/m.test(markdown);
}

/**
 * 마크다운을 HTML 로 낸다.
 *
 * <p>색칠개를 받지 않으면 코드 판을 날것으로 둔다. 코드가 없는 글이 대부분이라 부르는 쪽이 필요할
 * 때만 세워 넘긴다.
 */
export function render(markdown: string, highlight?: Highlight): string {
  const marked = new Marked({ gfm: true, breaks: false }).use(markedAlert()).use({
    renderer: {
      /*
       * 확인 칸을 input 이 아니라 span 으로 낸다.
       *
       * Angular 의 [innerHTML] 소독기가 form 요소를 지우므로 input 으로 내면 화면에서 칸이 통째로
       * 사라진다. 소독을 끄는 길도 있으나 본문은 사람과 에이전트가 적는 것이라 켜 두는 편이 낫다.
       * 여기서 다루는 것은 읽는 자리이며 누를 수 있는 칸이 아니므로 잃는 것도 없다.
       */
      checkbox({ checked }) {
        // 상태를 data 속성이 아니라 클래스로 담는다. 소독기가 data-* 도 지운다.
        const label = checked ? '확인됨' : '확인되지 않음';
        const done = checked ? ' task-check-done' : '';
        return `<span class="task-check${done}" role="img" aria-label="${label}"></span>`;
      },
      code({ text, lang }) {
        // 머메이드는 색칠하지 않는다. 판을 그대로 두면 그리는 쪽이 그림으로 바꾼다.
        if (lang === 'mermaid') {
          return `<pre class="mermaid not-prose">${escapeHtml(text)}</pre>`;
        }
        if (highlight === undefined) {
          return `<pre class="not-prose"><code>${escapeHtml(text)}</code></pre>`;
        }
        return highlight(text, lang ?? '');
      },
    },
  });

  return marked.parse(markdown.replace(COMMENT, '')) as string;
}

/**
 * 색칠할 언어. 여기 없는 것은 색 없이 낸다.
 *
 * <p>목록을 두는 것은 Shiki 를 통째로 부르면 <b>쓰지도 않는 문법 수백 개</b>가 산출물에 구워지기
 * 때문이다(emacs-lisp · wolfram · vue-vine …). 글에 실제로 나온 언어만 그때 실어 온다.
 */
type LangModule = { default: LanguageRegistration[] };

const LANGS: Record<string, () => Promise<LangModule>> = {
  bash: () => import('shiki/langs/bash.mjs'),
  css: () => import('shiki/langs/css.mjs'),
  diff: () => import('shiki/langs/diff.mjs'),
  html: () => import('shiki/langs/html.mjs'),
  java: () => import('shiki/langs/java.mjs'),
  javascript: () => import('shiki/langs/javascript.mjs'),
  json: () => import('shiki/langs/json.mjs'),
  markdown: () => import('shiki/langs/markdown.mjs'),
  sql: () => import('shiki/langs/sql.mjs'),
  typescript: () => import('shiki/langs/typescript.mjs'),
  yaml: () => import('shiki/langs/yaml.mjs'),
};

/** 같은 것을 가리키는 다른 이름들. */
const ALIAS: Record<string, string> = {
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  js: 'javascript',
  ts: 'typescript',
  md: 'markdown',
  yml: 'yaml',
};

/**
 * Shiki 를 세워 색칠개를 낸다.
 *
 * <p>두 테마의 색을 함께 심는다(`defaultColor: false`). 그러면 각 span 이 `--shiki-light` 와
 * `--shiki-dark` 를 갖고, 고르는 일은 CSS 의 `light-dark()` 가 한다 — 색상 모드를 자바스크립트가
 * 다시 판정하지 않아도 된다.
 *
 * <p>정규식 엔진을 자바스크립트 것으로 고른다. 기본값인 Oniguruma 는 600 kB 가 넘는 wasm 을 함께
 * 실어 오는데, 우리가 담는 언어에는 그만한 것이 필요하지 않다.
 */
export async function createHighlight(langs: readonly string[]): Promise<Highlight | undefined> {
  const wanted = [...new Set(langs.map((each) => ALIAS[each] ?? each))].filter(
    (each) => each in LANGS,
  );
  if (wanted.length === 0) return undefined;

  const [{ createHighlighterCore }, { createJavaScriptRegexEngine }, light, dark] =
    await Promise.all([
      import('shiki/core'),
      import('shiki/engine/javascript'),
      import('shiki/themes/github-light.mjs'),
      import('shiki/themes/github-dark.mjs'),
    ]);
  const loaded = await Promise.all(wanted.map((each) => LANGS[each]()));

  const highlighter = await createHighlighterCore({
    themes: [light, dark],
    langs: loaded.map((each) => each.default),
    engine: createJavaScriptRegexEngine(),
  });
  const known = new Set(highlighter.getLoadedLanguages());

  return (code, lang) =>
    highlighter.codeToHtml(code, {
      // 담지 않은 언어는 색 없이 낸다. 세우지 못한 것을 넘기면 Shiki 가 던진다.
      lang: known.has(ALIAS[lang] ?? lang) ? (ALIAS[lang] ?? lang) : 'text',
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
    });
}

/**
 * 머메이드 판을 그림으로 바꾼다.
 *
 * <p>글에 판이 없으면 아무것도 싣지 않는다. 이 저장소에서 가장 무거운 묶음이라, 판을 담은 글을 여는
 * 사람만 그 값을 치르게 한다.
 */
export async function drawDiagrams(root: HTMLElement, dark: boolean): Promise<void> {
  const nodes = [...root.querySelectorAll<HTMLElement>('pre.mermaid')];
  if (nodes.length === 0) return;

  const { default: mermaid } = await import('mermaid');
  mermaid.initialize({
    startOnLoad: false,
    theme: dark ? 'dark' : 'default',
    // 판의 글이 본문에서 오므로 스크립트가 섞이는 길을 닫는다.
    securityLevel: 'strict',
    fontFamily: 'inherit',
  });

  await mermaid.run({ nodes });
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
