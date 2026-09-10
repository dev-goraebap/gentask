import { useEditorPortal } from './useEditorPortal';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { DropdownMenu } from '@astryxdesign/core';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $getNodeByKey, $isRangeSelection } from 'lexical';
import { $isCodeNode } from '@lexical/code';

export function CodeTools() {
  const [editor] = useLexicalComposerContext();
  const portal = useEditorPortal();
  const [target, setTarget] = useState<{key:string; language:string; left:number; top:number} | null>(null);
  useEffect(() => {
    const hide = () => setTarget(null);
    window.addEventListener('scroll', hide, true);
    const unregister = editor.registerUpdateListener(({editorState}) => editorState.read(() => {
      const selection = $getSelection();
      const node = $isRangeSelection(selection) && selection.isCollapsed() ? selection.anchor.getNode().getTopLevelElement() : null;
      if (!editor.isEditable() || !$isCodeNode(node)) { hide(); return; }
      const element = editor.getElementByKey(node.getKey());
      if (!element) return;
      const rect = element.getBoundingClientRect();
      setTarget({ key:node.getKey(), language:node.getLanguage() || 'text', left:Math.max(12, Math.min(rect.right - 150, window.innerWidth - 162)), top:Math.max(8, rect.top - 34) });
    }));
    return () => { unregister(); window.removeEventListener('scroll', hide, true); };
  }, [editor]);
  return target && createPortal(<div className="doc-code-tools" style={{position:'fixed', left:target.left, top:target.top, zIndex:1000}}><DropdownMenu button={{label:`언어: ${target.language}`,size:'sm',variant:'secondary'}} items={['text','typescript','tsx','javascript','jsx','java','python','json','sql','bash','html','css','yaml','markdown'].map(language => ({label:language === 'text' ? '일반 텍스트' : language, onClick:() => { editor.update(() => { const node = $getNodeByKey(target.key); if($isCodeNode(node)) node.setLanguage(language); }); editor.focus(); }}))} /></div>, portal ?? document.body);
}
