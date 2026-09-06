import {
    Text,
    VStack
} from '@astryxdesign/core';

export function DocBlock({ block }: { readonly block: string }) {
  if (block.startsWith('## ')) {
    return <Text weight="semibold">{block.slice(3)}</Text>;
  }
  if (block.startsWith('**')) {
    const [head, ...rest] = block.split('\n');
    return (
      <VStack gap={1}>
        <Text weight="medium">{head.replaceAll('**', '')}</Text>
        <Text type="supporting">{rest.join(' ')}</Text>
      </VStack>
    );
  }
  return (
    <VStack gap={1}>
      {block.split('\n').map((line) => (
        <Text key={line}>{line}</Text>
      ))}
    </VStack>
  );
}
