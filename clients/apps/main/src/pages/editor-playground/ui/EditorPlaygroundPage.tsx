import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { editorConfig } from '../model/config';
import { PlaygroundWorkspace } from './PlaygroundWorkspace';
import './playground.css';


export function EditorPlaygroundPage() {
  return <LexicalComposer initialConfig={editorConfig}><PlaygroundWorkspace /></LexicalComposer>;
}
