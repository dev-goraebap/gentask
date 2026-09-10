import { Button, HStack, Text, VStack } from '@astryxdesign/core';
import { palettes } from './palettes';
import { useAppearance } from './useAppearance';

export function PaletteSelector() {
  const { palette: selected, media, change } = useAppearance();
  return <VStack gap={3}>

      <HStack gap={2}>
        <Button label="라이트" size="sm" variant={media === 'light' ? 'primary' : 'secondary'} aria-pressed={media === 'light'} onClick={() => change({ media: 'light' })} />
        <Button label="다크" size="sm" variant={media === 'dark' ? 'primary' : 'secondary'} aria-pressed={media === 'dark'} onClick={() => change({ media: 'dark' })} />
      </HStack>
      <Button label="Neutral · 기본" variant={selected === 'neutral' ? 'primary' : 'secondary'} aria-pressed={selected === 'neutral'} onClick={() => change({ palette: 'neutral' })} />
      {palettes.map(palette => <VStack key={palette.id} gap={1}>
        <Button label={palette.label} variant={selected === palette.id ? 'primary' : 'secondary'} aria-pressed={selected === palette.id} onClick={() => change({ palette: palette.id })} />
        <HStack gap={1} aria-hidden="true">{[palette.body, palette.surface, palette.card, palette.accent].map((pair, index) =>
          <Text key={index} style={{ backgroundColor: `light-dark(${pair[0]}, ${pair[1]})`, width: 'var(--spacing-6)', height: 'var(--spacing-3)', borderRadius: 'var(--radius-inner)', border: 'var(--border-width) solid var(--color-border)' }}>{' '}</Text>)}</HStack>
        <Text size="sm" color="secondary">{palette.description}</Text>
      </VStack>)}
      <Text size="sm" color="secondary">선택한 테마와 밝기는 이 브라우저에 저장됩니다.</Text>
    </VStack>
  ;
}
