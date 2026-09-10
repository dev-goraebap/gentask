import { DecoratorNode, type NodeKey, type SerializedLexicalNode, type Spread } from 'lexical';
import { safeImageUrl } from './urls';
import type { ReactNode } from 'react';
import { PlaygroundImage } from './PlaygroundImage';

type ImageJSON = Spread<{ src: string; alt: string }, SerializedLexicalNode>;
export class PlaygroundImageNode extends DecoratorNode<ReactNode> {
  __src: string;
  __alt: string;
  static getType() { return 'playground-image'; }
  static clone(node: PlaygroundImageNode) { return new PlaygroundImageNode(node.__src, node.__alt, node.__key); }
  constructor(src: string, alt: string, key?: NodeKey) { super(key); this.__src = src; this.__alt = alt; }
  static importJSON(json: ImageJSON) { return new PlaygroundImageNode(json.src, json.alt).updateFromJSON(json); }
  exportJSON(): ImageJSON { return { ...super.exportJSON(), type: 'playground-image', version: 1, src: this.__src, alt: this.__alt }; }
  static importDOM() { return { img: () => ({ conversion: (element: HTMLElement) => ({ node: new PlaygroundImageNode((element as HTMLImageElement).getAttribute('src') || '', element.getAttribute('alt') || '') }), priority: 0 as const }) }; }
  exportDOM() { const element = document.createElement('img'); element.src = safeImageUrl(this.__src); element.alt = this.__alt; return { element }; }
  createDOM() { const element = document.createElement('div'); element.className = 'lex-image-node'; return element; }
  updateDOM() { return false; }
  isInline() { return false; }
  getTextContent() { return this.__alt; }
  decorate() { return <PlaygroundImage src={this.__src} alt={this.__alt} />; }
}
