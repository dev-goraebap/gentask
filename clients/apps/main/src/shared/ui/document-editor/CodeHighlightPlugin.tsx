import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { CodeNode } from '@lexical/code';
import { registerCodeHighlighting, ShikiTokenizer } from '@lexical/code-shiki';
import { $nodesOfType, SKIP_DOM_SELECTION_TAG, HISTORIC_TAG } from 'lexical';

export function CodeHighlightPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const getTheme = () => {
      const mode = document.documentElement.dataset.theme;
      return (mode === 'dark' || (mode !== 'light' && media.matches)) ? 'github-dark' : 'github-light';
    };
    let theme = getTheme();
    const unregisterTheme = editor.registerNodeTransform(CodeNode, node => {
      if (node.getTheme() !== theme) node.setTheme(theme);
    });
    const unregisterHighlight = registerCodeHighlighting(editor, { ...ShikiTokenizer, defaultLanguage: null, defaultTheme: theme });
    const sync = () => {
      theme = getTheme();
      editor.update(() => {
        for (const node of $nodesOfType(CodeNode)) if (node.getTheme() !== theme) node.setTheme(theme);
      }, { tag: [SKIP_DOM_SELECTION_TAG, HISTORIC_TAG] });
    };
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    media.addEventListener('change', sync);
    sync();
    return () => { observer.disconnect(); media.removeEventListener('change', sync); unregisterTheme(); unregisterHighlight(); };
  }, [editor]);
  return null;
}
