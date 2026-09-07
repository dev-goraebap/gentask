import { Button, HStack, Text, TextArea, VStack } from '@astryxdesign/core';
import { useState } from 'react';
import { RichEditor } from './RichEditor';


export function MarkdownEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [source, setSource] = useState(false);
  return <VStack gap={3}>
    <HStack justify="between" align="center"><Text color="secondary">그냥 적어도, 서식을 넣어도 됩니다.</Text>
      <Button label={source ? '편집으로' : '마크다운 원문'} aria-pressed={source} size="sm" variant="ghost" onClick={() => setSource(!source)} />
    </HStack>
    {source ? <TextArea label="내용" value={value} onChange={onChange} rows={12} /> : <RichEditor initialValue={value} onChange={onChange} />}
  </VStack>;
}
