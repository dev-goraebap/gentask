import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { TableNode, TableRowNode, TableCellNode } from '@lexical/table';
import { PlaygroundImageNode } from './image-node';

export const nodes = [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode, CodeNode, CodeHighlightNode, TableNode, TableRowNode, TableCellNode, PlaygroundImageNode];
export const documentTheme = {
    paragraph: 'lex-paragraph', heading: { h1: 'lex-h1', h2: 'lex-h2', h3: 'lex-h3' },
    quote: 'lex-quote', link: 'lex-link', code: 'lex-code',
    text: { bold: 'lex-bold', italic: 'lex-italic', underline: 'lex-underline', strikethrough: 'lex-strike', code: 'lex-inline-code', highlight: 'lex-highlight' },
    list: { ul: 'lex-ul', ol: 'lex-ol', listitem: 'lex-li', listitemChecked: 'lex-checked', listitemUnchecked: 'lex-unchecked' },
    table: 'lex-table', tableCell: 'lex-cell', tableCellHeader: 'lex-cell-header', tableCellSelected: 'lex-cell-selected',
};
