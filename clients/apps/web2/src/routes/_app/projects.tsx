import { Button, EmptyState, Text, TextInput } from '@astryxdesign/core';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { ArrowRight, Plus } from 'lucide-react';
import { useState } from 'react';
import { api, type ProjectView } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { ROUTES } from '@/shared/config/routes';
import { CreateDialog } from '@/shared/ui/create-dialog';

/**
 * 프로젝트는 모드가 아니라 계정에 매인다. 어느 프로젝트에도 들어가지 않고 닿을 수 있어야 한다.
 */
export const Route = createFileRoute('/_app/projects')({
  loader: () => api.get<ProjectView[]>(ENDPOINTS.projects),
  component: ProjectListPage,
});

function ProjectListPage() {
  const router = useRouter();
  const projects = Route.useLoaderData();
  const [composing, setComposing] = useState(false);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');

  const create = async () => {
    await api.post(ENDPOINTS.projects, { name: name.trim(), key: key.trim().toUpperCase() });
    setName('');
    setKey('');
    await router.invalidate();
  };

  return (
    <section className="page page-wide">
      <div className="page-head">
        <Text as="h1" type="display-3">
          프로젝트
        </Text>
        <Button
          label="새 프로젝트"
          size="sm"
          icon={<Plus />}
          onClick={() => setComposing(true)}
        />
      </div>

      <Text as="p" type="supporting" color="secondary">
        작업 아이템과 문서는 프로젝트 하나에 담깁니다. 계정을 만들 때 하나가 함께 섭니다.
      </Text>

      <CreateDialog
        title="새 프로젝트"
        description="접두어는 작업 아이템의 이름이 갖습니다. 나중에 바꾸지 않습니다."
        isOpen={composing}
        onOpenChange={setComposing}
        actionLabel="만들기"
        onSubmit={create}
      >
        <TextInput label="프로젝트 이름" value={name} onChange={setName} isRequired />
        <TextInput
          label="접두어"
          value={key}
          onChange={setKey}
          isRequired
          description="예: GT. 대문자로 저장합니다"
        />
      </CreateDialog>

      {projects.length === 0 ? (
        <EmptyState
          title="아직 프로젝트가 없습니다"
          description="이름과 접두어를 적어 첫 프로젝트를 만듭니다."
        />
      ) : (
        <ul className="rows">
          {projects.map((project) => (
            <li key={project.id}>
              <span className="row-dot" aria-hidden />
              <Link to={ROUTES.issues(project.id)} className="row-main">
                <Text as="span">{project.name}</Text>
                <span className="row-sub">
                  <span className="key">{project.key}</span>
                  <span aria-hidden>·</span>
                  <span>작업 아이템 {project.issueCount}</span>
                </span>
              </Link>
              <ArrowRight aria-hidden className="row-arrow" />
            </li>
          ))}
        </ul>
      )}

      {/*
       * 지우기와 나가기는 단추를 두지 않는다. 되묻는 절차와 담긴 것의 처리가 함께 정해져야 하고,
       * 흉내만 내면 지워지지 않은 것이 지워진 것처럼 보인다.
       */}
      <Text as="p" type="supporting" color="secondary">
        이름을 바꾸는 것은 프로젝트 설정에 있습니다. 지우거나 나가는 것은 아직 열지 않았습니다.
      </Text>
    </section>
  );
}
