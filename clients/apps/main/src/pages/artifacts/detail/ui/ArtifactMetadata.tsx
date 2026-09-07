import type { ArtifactView } from '@/entities/artifact';
import { Divider, Heading, MetadataList, MetadataListItem, Text, VStack } from '@astryxdesign/core';
import type { CSSProperties } from 'react';
import { ArtifactHistory } from './ArtifactHistory';

export function ArtifactMetadata({ artifact, projectId, folderName, selectedVersion, onSelectVersion }: {
  artifact: ArtifactView; projectId: string; folderName: string; selectedVersion: number | null; onSelectVersion: (version: number) => void;
}) {
  return <VStack gap={4}>
    <Heading level={4} accessibilityLevel={2}>문서 정보</Heading>
    <MetadataList label={{ position: 'top' }} style={{ '--text-body-size': 'var(--font-size-sm)' } as CSSProperties}>
      <MetadataListItem label="폴더"><Text>{folderName}</Text></MetadataListItem>
      <MetadataListItem label="버전"><Text>v{selectedVersion ?? artifact.versionNo}</Text></MetadataListItem>
      <MetadataListItem label="식별자"><Text type="code" size="sm">{artifact.summary.id}</Text></MetadataListItem>
    </MetadataList>
    <Divider />
    <ArtifactHistory projectId={projectId} artifactId={artifact.summary.id} latestVersion={artifact.versionNo}
      selectedVersion={selectedVersion} onSelect={onSelectVersion} />
  </VStack>;
}
