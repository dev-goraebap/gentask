import { $generateNodesFromDOM, $generateHtmlFromNodes } from '@lexical/html';
import { $getRoot, $createParagraphNode, type LexicalEditor } from 'lexical';
import { Marked } from 'marked';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const parser = new Marked();
parser.use({ extensions: [{ name: 'highlight', level: 'inline', start: source => source.indexOf('=='), tokenizer(source) {
  const match = /^==([^=\n](?:[^\n]*?[^=\n])?)==/.exec(source);
  if (match) return { type: 'highlight', raw: match[0], tokens: this.lexer.inlineTokens(match[1]) };
}, renderer(token) { return '<mark>' + this.parser.parseInline(token.tokens || []) + '</mark>'; } }] });
const markdown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
markdown.use(gfm);
markdown.addRule('document-table', { filter: 'table', replacement: (_content, node) => {
  const rows = Array.from((node as HTMLTableElement).rows).map(row => Array.from(row.cells).map(cell => markdown.turndown(cell.innerHTML).trim().replace(/\n+/g, '<br>').replace(/\|/g, '\\|')));
  if (!rows.length) return '';
  return '\n\n' + [rows[0], rows[0].map(() => '---'), ...rows.slice(1)].map(row => '| ' + row.join(' | ') + ' |').join('\n') + '\n\n';
} });
markdown.addRule('highlight', { filter: 'mark', replacement: content => '==' + content + '==' });
markdown.addRule('lexical-code', { filter: node => node.nodeName === 'PRE', replacement: (_content, node) => {
  const element = node as HTMLElement;
  return '\n\n```' + (element.getAttribute('data-language') || '') + '\n' + (element.textContent || '') + '\n```\n\n';
} });
export function importMarkdown(editor: LexicalEditor, source: string) {
  const doc = new DOMParser().parseFromString(parser.parse(source, { async: false }), 'text/html');
  doc.querySelectorAll('del').forEach(node => { const replacement = doc.createElement('s'); replacement.innerHTML = node.innerHTML; node.replaceWith(replacement); });
  doc.querySelectorAll('script,style,iframe,object').forEach(n => n.remove());
  doc.querySelectorAll('a').forEach(a => { const href = (a.getAttribute('href') || '').trim(); if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href) && !/^(https?:|mailto:)/i.test(href)) a.removeAttribute('href'); });
  doc.querySelectorAll('pre > code').forEach(code => { const language = Array.from(code.classList).find(name => name.startsWith('language-'))?.slice(9); if (language) code.parentElement?.setAttribute('data-language', language); });
  doc.querySelectorAll('li').forEach(li => { const checkbox = li.querySelector(':scope > input[type=checkbox]'); if (checkbox) { li.setAttribute('aria-checked', String(checkbox.hasAttribute('checked'))); li.parentElement?.setAttribute('__lexicallisttype', 'check'); checkbox.remove(); } });
  const nodes = $generateNodesFromDOM(editor, doc);
  $getRoot().clear().append(...nodes);
  if (!$getRoot().getChildrenSize()) $getRoot().append($createParagraphNode());
}
export function exportMarkdown(editor: LexicalEditor) {
  const doc = new DOMParser().parseFromString($generateHtmlFromNodes(editor), 'text/html');
  for (const selector of ['b,strong', 'i,em', 's,del,strike']) {
    doc.querySelectorAll(selector).forEach(node => { if (node.parentElement?.closest(selector)) node.replaceWith(...Array.from(node.childNodes)); });
  }
  doc.querySelectorAll('li[aria-checked]').forEach(li => { const input = doc.createElement('input'); input.type = 'checkbox'; if (li.getAttribute('aria-checked') === 'true') input.setAttribute('checked', ''); li.prepend(input); });
  return markdown.turndown(doc.body.innerHTML);
}

export function serializeDocument(state: import('lexical').SerializedEditorState): string {
  const clean = (node: Record<string, unknown>): Record<string, unknown> => {
    const children = node.children as Record<string, unknown>[] | undefined;
    if (node.type === 'code') {
      const text = (children || []).map(n => n.type === 'linebreak' ? '\n' : n.type === 'tab' ? '\t' : String(n.text || '')).join('');
      return { ...node, theme: undefined, style: '', children: [{ type: 'text', version: 1, text, format: 0, mode: 'normal', style: '', detail: 0 }] };
    }
    return children ? { ...node, children: children.map(clean) } : node;
  };
  return JSON.stringify({ root: clean(state.root as unknown as Record<string, unknown>) });
}
