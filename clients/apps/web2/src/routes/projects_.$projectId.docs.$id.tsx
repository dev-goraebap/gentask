import { Button, Card, Markdown, Text, TextArea, TextInput } from '@astryxdesign/core';
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { api, type DocumentFolderSummary, type DocumentView } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { ROUTES } from '@/shared/config/routes';

interface RevisionSummary {
  readonly number: number;
  readonly comment: string | null;
  readonly createdAt: string;
}

interface RevisionPage {
  readonly items: readonly RevisionSummary[];
  readonly total: number;
}

export const Route = createFileRoute('/projects_/$projectId/docs/$id')({
  loader: async ({ params }) => ({
    doc: await api.get<DocumentView>(ENDPOINTS.doc(params.projectId, params.id)),
    revisions: await api.get<RevisionPage>(ENDPOINTS.docRevisions(params.projectId, params.id)),
    folders: await api.get<DocumentFolderSummary[]>(ENDPOINTS.docFolders(params.projectId)),
  }),
  component: DocDetailPage,
});

function DocDetailPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const { doc, revisions, folders } = Route.useLoaderData();
  const { projectId, id } = Route.useParams();
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(doc.body);
  const [comment, setComment] = useState('');

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    await api.patch(ENDPOINTS.doc(projectId, id), { body, comment: comment || undefined });
    setEditing(false);
    setComment('');
    await router.invalidate();
  };

  const move = async (folderId: string | null) => {
    await api.patch(ENDPOINTS.docParent(projectId, id), { folderId });
    await router.invalidate();
  };

  const revert = async (revisionNo: number) => {
    await api.post(ENDPOINTS.docRevisionRevert(projectId, id, revisionNo), {});
    await router.invalidate();
  };

  return (
    <section className="page page-wide">
      <Button
        label="문서로"
        variant="ghost"
        size="sm"
        icon={<ArrowLeft />}
        onClick={() => void navigate({ to: ROUTES.docs(projectId) })}
      />

      <Text as="h1" type="display-3">
        {doc.summary.title}
      </Text>
      <Text as="p" type="supporting" color="secondary">
        고친때 {doc.summary.updatedAt.slice(0, 16).replace('T', ' ')}
      </Text>

      {/* 담긴 자리는 문서가 갖는다. 폴더가 아니라 문서 쪽에서 바꾸는 것은 바뀌는 것이 문서이기 때문이다. */}
      {folders.length > 0 ? (
        <div className="state-row">
          <Text as="span" type="supporting" color="secondary">
            담긴 자리
          </Text>
          <Button
            label="뿌리"
            size="sm"
            variant={doc.summary.folderId === null ? 'secondary' : 'ghost'}
            onClick={() => void move(null)}
          />
          {folders.map((folder) => (
            <Button
              key={folder.id}
              label={folder.name}
              size="sm"
              variant={doc.summary.folderId === folder.id ? 'secondary' : 'ghost'}
              onClick={() => void move(folder.id)}
            />
          ))}
        </div>
      ) : null}

      {editing ? (
        <Card padding={4}>
          <form onSubmit={save} className="doc-form">
            <TextArea label="본문" value={body} onChange={setBody} rows={20} />
            <TextInput
              label="개정 사유"
              value={comment}
              onChange={setComment}
              placeholder="왜 고쳤는지. 적지 않아도 됩니다"
              isOptional
            />
            <div className="state-row">
              <Button type="submit" label="저장" variant="primary" />
              <Button
                label="그만두기"
                variant="ghost"
                onClick={() => {
                  setBody(doc.body);
                  setEditing(false);
                }}
              />
            </div>
          </form>
        </Card>
      ) : (
        <>
          <Button label="고치기" variant="secondary" onClick={() => setEditing(true)} />
          <Card padding={4}>
            <Markdown>{doc.body}</Markdown>
          </Card>
        </>
      )}

      {revisions.items.length > 0 ? (
        <Card padding={4}>
          <Text as="h2" type="large">
            개정 {revisions.total}
          </Text>
          <ul className="card-list revisions">
            {revisions.items.map((revision, index) => (
              <li key={revision.number} className="row-meta">
                <Text as="span" type="supporting">
                  #{revision.number}
                  {index === 0 ? ' · 지금' : ''}
                </Text>
                <Text as="span" type="supporting" color="secondary">
                  {revision.createdAt.slice(0, 16).replace('T', ' ')}
                </Text>
                {revision.comment ? (
                  <Text as="span" type="supporting" color="secondary" maxLines={1}>
                    {revision.comment}
                  </Text>
                ) : null}
                {index !== 0 ? (
                  <Button
                    label="이 시점으로"
                    variant="ghost"
                    size="sm"
                    onClick={() => void revert(revision.number)}
                  />
                ) : null}
              </li>
            ))}
          </ul>
          <Text as="p" type="supporting" color="secondary">
            되돌리기는 사이의 개정을 지우지 않습니다. 그때의 본문을 새 개정으로 한 번 더 쌓습니다.
          </Text>
        </Card>
      ) : null}
    </section>
  );
}
