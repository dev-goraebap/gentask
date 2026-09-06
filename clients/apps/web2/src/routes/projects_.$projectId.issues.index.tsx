import { Button, EmptyState, Text, TextInput } from '@astryxdesign/core';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { api, type IssueSummary } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { ROUTES } from '@/shared/config/routes';
import { CreateDialog } from '@/shared/ui/create-dialog';
import { ISSUE_KINDS, IssueKindBadge, IssueStateChip, issueKindLabel } from '@/shared/ui/issue';

export const Route = createFileRoute('/projects_/$projectId/issues/')({
  loader: ({ params }) => api.get<IssueSummary[]>(ENDPOINTS.issues(params.projectId)),
  component: IssueListPage,
});

type Kind = IssueSummary['kind'];

function IssueListPage() {
  const router = useRouter();
  const issues = Route.useLoaderData();
  const { projectId } = Route.useParams();
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<Kind>('TASK');
  // 거르개는 비어 있으면 모두를 뜻한다. 아무것도 못 보는 상태를 기본값으로 두지 않는다.
  const [picked, setPicked] = useState<readonly Kind[]>([]);

  const visible =
    picked.length === 0 ? issues : issues.filter((issue) => picked.includes(issue.kind));

  const toggleKind = (candidate: Kind) =>
    setPicked((current) =>
      current.includes(candidate)
        ? current.filter((value) => value !== candidate)
        : [...current, candidate],
    );

  const create = async () => {
    await api.post(ENDPOINTS.issues(projectId), { title: title.trim(), kind });
    setTitle('');
    await router.invalidate();
  };

  return (
    <section className="page page-max">
      <div className="page-head">
        <Text as="h1" type="display-3">
          작업 아이템
        </Text>
        <Button
          label="새 작업 아이템"
          size="sm"
          icon={<Plus />}
          onClick={() => setComposing(true)}
        />
      </div>

      <CreateDialog
        title="새 작업 아이템"
        description="번호는 서버가 매깁니다. 상위는 세운 뒤에 잇습니다."
        isOpen={composing}
        onOpenChange={setComposing}
        actionLabel="세우기"
        onSubmit={create}
      >
        <TextInput label="제목" value={title} onChange={setTitle} isRequired />
        <div className="field-group">
          <Text as="span" type="label">
            유형
          </Text>
          <div className="state-row">
            {ISSUE_KINDS.map((candidate) => (
              <Button
                key={candidate}
                label={issueKindLabel(candidate)}
                variant={kind === candidate ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setKind(candidate)}
              />
            ))}
          </div>
        </div>
      </CreateDialog>

      <div className="state-row">
        {ISSUE_KINDS.map((candidate) => (
          <Button
            key={candidate}
            label={issueKindLabel(candidate)}
            variant={picked.includes(candidate) ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => toggleKind(candidate)}
          />
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="이 거르개에 걸리는 작업 아이템이 없습니다"
          description="유형을 넓혀 보세요."
        />
      ) : (
        <ul className="rows">
          {visible.map((issue) => (
            <li key={issue.id}>
              {/* 하위 항목은 한 칸 들여 쓴다. 부모와 자식이 같은 자리에서 시작하면 갈래가 보이지 않는다. */}
              {issue.parentKey ? <span className="row-indent" aria-hidden /> : null}
              <IssueKindBadge kind={issue.kind} />
              <Link to={ROUTES.issue(projectId, String(issue.number))} className="row-main">
                <Text as="span">{issue.title}</Text>
                <span className="row-sub">
                  <span className="key">{issue.key}</span>
                  {issue.childCount > 0 ? (
                    <>
                      <span aria-hidden>·</span>
                      <span>
                        자식 {issue.childCount}개 중 {issue.closedChildCount}개 닫힘
                      </span>
                    </>
                  ) : null}
                  {issue.criteriaCount > 0 ? (
                    <>
                      <span aria-hidden>·</span>
                      <span>
                        인수 조건 {issue.criteriaCount}개
                        {issue.unverifiedCount > 0 ? ` 중 ${issue.unverifiedCount}개 미검증` : ''}
                      </span>
                    </>
                  ) : null}
                  {issue.dueDate ? (
                    <>
                      <span aria-hidden>·</span>
                      <span className="overdue">기한 {issue.dueDate}</span>
                    </>
                  ) : null}
                </span>
              </Link>
              <IssueStateChip state={issue.state} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
