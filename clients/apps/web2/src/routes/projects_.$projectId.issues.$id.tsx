import {
  AlertDialog,
  Button,
  Card,
  Markdown,
  Text,
  TextArea,
  TextInput,
  useToast,
} from '@astryxdesign/core';
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { api, type IssueView } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { ROUTES } from '@/shared/config/routes';
import { ISSUE_STATES, IssueKindBadge, IssueStateChip, issueStateLabel } from '@/shared/ui/issue';

export const Route = createFileRoute('/projects_/$projectId/issues/$id')({
  loader: ({ params }) => api.get<IssueView>(ENDPOINTS.issue(params.projectId, Number(params.id))),
  component: IssueDetailPage,
});

function IssueDetailPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const issue = Route.useLoaderData();
  const { projectId, id } = Route.useParams();

  const showToast = useToast();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(issue.summary.title);
  const [body, setBody] = useState(issue.body ?? '');
  const [confirming, setConfirming] = useState(false);

  const move = async (state: IssueView['summary']['state']) => {
    await api.patch(ENDPOINTS.issueState(projectId, Number(id)), { state });
    await router.invalidate();
    showToast({ body: `${issueStateLabel(state)} 로 옮겼습니다` });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    await api.patch(ENDPOINTS.issue(projectId, Number(id)), { title: title.trim(), body });
    setEditing(false);
    await router.invalidate();
    showToast({ body: '고친 것을 저장했습니다' });
  };

  const remove = () => {
    void api.delete(ENDPOINTS.issue(projectId, Number(id))).then(async () => {
      setConfirming(false);
      await navigate({ to: ROUTES.issues(projectId) });
      showToast({ body: `${issue.summary.key} 를 지웠습니다` });
    });
  };

  return (
    <section className="page page-wide">
      <Button
        label="목록으로"
        variant="ghost"
        size="sm"
        icon={<ArrowLeft />}
        onClick={() => void navigate({ to: ROUTES.issues(projectId) })}
      />

      <div className="row-head">
        <IssueKindBadge kind={issue.summary.kind} />
        <Text as="h1" type="display-3">
          {issue.summary.key} {issue.summary.title}
        </Text>
      </div>

      <Card padding={4}>
        <div className="row-meta">
          <IssueStateChip state={issue.summary.state} />
          {issue.summary.parentKey ? (
            <Text as="span" type="supporting" color="secondary">
              상위 {issue.summary.parentKey}
            </Text>
          ) : null}
        </div>
        <div className="state-row">
          {ISSUE_STATES.map((state) => (
            <Button
              key={state}
              label={issueStateLabel(state)}
              variant={issue.summary.state === state ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => void move(state)}
            />
          ))}
        </div>
      </Card>

      {editing ? (
        <Card padding={4}>
          <form onSubmit={save} className="doc-form">
            <TextInput label="제목" value={title} onChange={setTitle} isRequired />
            <TextArea label="본문" value={body} onChange={setBody} rows={14} placeholder="마크다운으로 적습니다" />
            <div className="state-row">
              <Button type="submit" label="저장" variant="primary" />
              <Button
                label="그만두기"
                variant="ghost"
                onClick={() => {
                  setTitle(issue.summary.title);
                  setBody(issue.body ?? '');
                  setEditing(false);
                }}
              />
            </div>
          </form>
        </Card>
      ) : (
        <>
          <div className="state-row">
            <Button label="고치기" variant="secondary" size="sm" onClick={() => setEditing(true)} />
            <Button
              label="지우기"
              variant="destructive"
              size="sm"
              onClick={() => setConfirming(true)}
            />
          </div>
          {issue.body ? (
            <Card padding={4}>
              <Markdown>{issue.body}</Markdown>
            </Card>
          ) : null}
        </>
      )}

      {issue.criteria.length > 0 ? (
        <Card padding={4}>
          <Text as="h2" type="large">
            인수 조건
          </Text>
          <ul className="criteria-list">
            {issue.criteria.map((criterion) => (
              <li key={criterion.number} className={criterion.retired ? 'retired' : undefined}>
                <Text as="span" color={criterion.verified ? 'primary' : 'secondary'}>
                  {criterion.verified ? '\u2713' : '\u25cb'} #{criterion.number} {criterion.sentence}
                </Text>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
      <AlertDialog
        isOpen={confirming}
        onOpenChange={setConfirming}
        title={`${issue.summary.key} 를 지웁니다`}
        description="지운 작업 아이템은 되돌릴 수 없습니다. 하위 항목이 있으면 함께 정리해야 합니다."
        actionLabel="삭제"
        actionVariant="destructive"
        onAction={remove}
      />
    </section>
  );
}
