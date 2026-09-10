import { useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

export function useEditorPortal() {
  const [editor] = useLexicalComposerContext();
  const [target, setTarget] = useState<HTMLElement>();
  useEffect(() => {
    let host: HTMLDivElement | null = null;
    let frame = 0;
    const unregister = editor.registerRootListener(root => {
      cancelAnimationFrame(frame); host?.remove(); host = null;
      const dialog = root?.closest('dialog');
      if (!dialog) { setTarget(root?.ownerDocument.body); return; }
      host = root!.ownerDocument.createElement('div');
      host.className = 'doc-editor-portal';
      host.setAttribute('popover', 'manual');
      dialog.append(host);
      frame = requestAnimationFrame(() => { if (host?.isConnected && dialog.open) host.showPopover(); });
      setTarget(host);
    });
    return () => { cancelAnimationFrame(frame); unregister(); host?.remove(); };
  }, [editor]);
  return target;
}
