import type { TextAnchor } from './types';
export function textNodes(root: HTMLElement): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: node => (node.parentElement?.closest('[contenteditable="false"]') && node.parentElement?.closest('[contenteditable="false"]') !== root ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  return nodes;
}
export function anchorFromSelection(root: HTMLElement): TextAnchor | null {
  const selection = window.getSelection();
  if (!selection?.rangeCount || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null;
  const nodes = textNodes(root);
  const point = (container: Node, offset: number) => {
    let total = 0;
    const prefix = document.createRange(); prefix.selectNodeContents(root); prefix.setEnd(container, offset);
    for (const node of nodes) {
      if (node === container) return total + offset;
      if (prefix.intersectsNode(node)) total += node.length;
    }
    return total;
  };
  const start = point(range.startContainer, range.startOffset), end = point(range.endContainer, range.endOffset);
  const quote = nodes.map(n => n.data).join('').slice(start, end);
  return quote.trim() && quote.length <= 4000 ? { start, end, quote } : null;
}
export function rangeFromAnchor(root: HTMLElement, anchor: TextAnchor): Range | null {
  const nodes = textNodes(root);
  if (nodes.map(n => n.data).join('').slice(anchor.start, anchor.end) !== anchor.quote) return null;
  const range = document.createRange(); let offset = 0, started = false;
  for (const node of nodes) {
    if (!started && anchor.start < offset + node.length) { range.setStart(node, anchor.start - offset); started = true; }
    if (started && anchor.end <= offset + node.length) { range.setEnd(node, anchor.end - offset); return range; }
    offset += node.length;
  }
  return null;
}
