import { safeImageUrl } from './urls';

export function PlaygroundImage({ src, alt }: { src: string; alt: string }) {
  return <figure className="lex-image" contentEditable={false}><img src={safeImageUrl(src)} alt={alt} draggable={false} /><figcaption>{alt}</figcaption></figure>;
}
