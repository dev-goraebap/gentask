import { Button, Card, Text, TextInput } from '@astryxdesign/core';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { api, type ProjectView } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';

export const Route = createFileRoute('/projects_/$projectId/settings')({
  loader: ({ params }) => api.get<ProjectView>(ENDPOINTS.project(params.projectId)),
  component: ProjectSettingsPage,
});

function ProjectSettingsPage() {
  const router = useRouter();
  const project = Route.useLoaderData();
  const { projectId } = Route.useParams();
  const [name, setName] = useState(project.name);

  const rename = async (event: React.FormEvent) => {
    event.preventDefault();
    await api.patch(ENDPOINTS.project(projectId), { name });
    await router.invalidate();
  };

  return (
    <section className="page page-wide">
      <Text as="h1" type="display-3">
        프로젝트 설정
      </Text>
      <Card padding={4}>
        <Text as="p" type="supporting">
          접두어 {project.key} 는 바꾸지 않습니다. 작업 아이템의 이름이 그것을 갖기 때문입니다.
        </Text>
        <form onSubmit={rename} className="inline-form">
          <TextInput label="프로젝트 이름" isLabelHidden value={name} onChange={setName} />
          <Button type="submit" label="이름 바꾸기" variant="secondary" />
        </form>
      </Card>
    </section>
  );
}
