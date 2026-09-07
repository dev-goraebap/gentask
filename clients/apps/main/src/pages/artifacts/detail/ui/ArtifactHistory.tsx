import { versionsOptions } from '@/entities/artifact';
import { RequestState } from '@/shared/ui/request-state';
import { Avatar, Button, HStack, List, ListItem, Text, VStack } from '@astryxdesign/core';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { formatArtifactDate } from './document-detail';

export function ArtifactHistory({ projectId, artifactId, latestVersion, selectedVersion, onSelect }: {
  projectId: string | null; artifactId: string; latestVersion: number; selectedVersion: number | null; onSelect: (version: number) => void;
}) {
  const [page, setPage] = useState(0);
  const query = useQuery(versionsOptions(projectId, artifactId, page));
  return <VStack gap={2}>
    {query.data ? <Text type="supporting">버전 {query.data.total}개</Text> : null}
    {!query.data || query.error ? <RequestState error={query.error} retry={() => { void query.refetch(); }} /> : null}
    {query.data ? <>
      <List hasDividers>
        {query.data.items.map(version => <ListItem key={version.versionNo}
          label={<HStack gap={2} align="center" justify="between">
            <HStack gap={2} align="center" style={{ minWidth: 0 }}>
              <Avatar name={version.authorName || '알 수 없는 사용자'} size="sm" tooltip={false} />
              <Text size="sm" weight="medium" maxLines={1}>{version.authorName || '알 수 없는 사용자'}</Text>
            </HStack>
            {version.versionNo === latestVersion ? <Text type="supporting" style={{ flexShrink: 0 }}>최신</Text> : null}
          </HStack>}
          isSelected={version.versionNo === (selectedVersion ?? latestVersion)}
          onClick={() => onSelect(version.versionNo)}
          description={<VStack gap={1}>
            <Text type="supporting">{formatArtifactDate(version.createdAt)}</Text>
            {version.comment ? <Text type="supporting" maxLines={2}>{version.comment}</Text> : null}
            <Text size="sm" weight="medium">v{version.versionNo}</Text>
          </VStack>} />)}
      </List>
      {query.data.total > query.data.size ? <HStack gap={2} justify="between" align="center">
        <Button label="이전 이력 페이지" size="sm" isDisabled={page === 0} onClick={() => setPage(page - 1)} />
        <Text type="supporting">{page + 1} / {Math.ceil(query.data.total / query.data.size)}</Text>
        <Button label="다음 이력 페이지" size="sm" isDisabled={(page + 1) * query.data.size >= query.data.total} onClick={() => setPage(page + 1)} />
      </HStack> : null}
    </> : null}
  </VStack>;
}
