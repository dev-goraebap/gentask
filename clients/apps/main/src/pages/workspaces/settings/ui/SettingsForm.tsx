import { PageLayout, PageContent, PageHeader } from '@/shared/ui/page-layout';
import { editProject, projectsOptions, type Project } from '@/entities/workspace';
import { WIDTH } from '@/shared/config';
import { MOBILE_QUERY } from '@/shared/ui/mobile';
import { Button, HStack, LayoutFooter, Text, TextInput, useToast, VStack } from '@astryxdesign/core';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export function SettingsForm({ project }: { project: Project }) {
  const client = useQueryClient();
  const toast = useToast();
  const mobile = useMediaQuery(MOBILE_QUERY);
  const [name, setName] = useState(project.name);
  const [key, setKey] = useState(project.prefix);
  const mutation = useMutation({
    mutationFn: () => editProject(project.id, { name: name.trim(), key: key.trim() }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: projectsOptions().queryKey });
      toast({ body: '프로젝트 정보를 저장했습니다.' });
    },
  });
  const dirty = name.trim() !== project.name || key.trim() !== project.prefix;
  return <PageLayout contentWidth={WIDTH.narrow}
    header={!mobile ? <PageHeader title="프로젝트 설정" /> : undefined}
    footer={<LayoutFooter hasDivider><HStack padding={4} justify="end">
      <Button label="변경사항 저장" variant="primary" isLoading={mutation.isPending} isDisabled={!name.trim() || !key.trim() || key.trim().length > 10 || !dirty || mutation.isPending} onClick={() => mutation.mutate()} />
    </HStack></LayoutFooter>}
    content={<PageContent padding={mobile ? 3 : 4}><VStack gap={4}>
      <TextInput label="프로젝트 이름" value={name} onChange={setName} isRequired isDisabled={mutation.isPending} />
      <TextInput label="프로젝트 키" value={key} onChange={setKey} isRequired isDisabled={mutation.isPending} />
      {mutation.error ? <Text role="alert">{mutation.error.message}</Text> : null}
      <Text color="secondary">프로젝트 이미지·설명·보관·삭제 기능은 준비 중입니다.</Text>
    </VStack></PageContent>} />;
}
