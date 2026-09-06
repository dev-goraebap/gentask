import { Button, EmptyState, Text, TextInput } from '@astryxdesign/core';
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { ChevronRight, FileText, Folder, FolderPlus, Plus } from 'lucide-react';
import { useState } from 'react';
import { api, type DocumentFolderSummary, type DocumentSummary } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { ROUTES } from '@/shared/config/routes';
import { CreateDialog } from '@/shared/ui/create-dialog';

export const Route = createFileRoute('/projects_/$projectId/docs/')({
  loader: async ({ params }) => ({
    docs: await api.get<DocumentSummary[]>(ENDPOINTS.docs(params.projectId)),
    folders: await api.get<DocumentFolderSummary[]>(ENDPOINTS.docFolders(params.projectId)),
  }),
  component: DocListPage,
});

function DocListPage() {
  const router = useRouter();
  const { docs, folders } = Route.useLoaderData();
  const { projectId } = Route.useParams();
  const [title, setTitle] = useState('');
  const [folderName, setFolderName] = useState('');
  const [composing, setComposing] = useState(false);
  const [foldering, setFoldering] = useState(false);
  // 접힌 자리는 기억한다. 폴더가 많을 때 매번 다시 접는 것을 막는다.
  const [collapsed, setCollapsed] = useState<readonly string[]>([]);

  const createDoc = async () => {
    await api.post(ENDPOINTS.docs(projectId), { title: title.trim(), body: '' });
    setTitle('');
    await router.invalidate();
  };

  const createFolder = async () => {
    await api.post(ENDPOINTS.docFolders(projectId), { name: folderName.trim() });
    setFolderName('');
    await router.invalidate();
  };

  const toggle = (id: string) =>
    setCollapsed((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );

  const inFolder = (folderId: string | null) => docs.filter((doc) => doc.folderId === folderId);
  const root = inFolder(null);

  const docRow = (doc: DocumentSummary) => (
    <li key={doc.id}>
      <FileText aria-hidden className="row-lead" />
      <Link to={ROUTES.doc(projectId, doc.id)} className="row-main">
        <Text as="span">{doc.title}</Text>
        <span className="row-sub">
          <span>고친때 {doc.updatedAt.slice(0, 16).replace('T', ' ')}</span>
        </span>
      </Link>
    </li>
  );

  return (
    <section className="page page-wide">
      <div className="page-head">
        <Text as="h1" type="display-3">
          문서
        </Text>
        <Button
          label="새 폴더"
          size="sm"
          variant="ghost"
          icon={<FolderPlus />}
          onClick={() => setFoldering(true)}
        />
        <Button label="새 문서" size="sm" icon={<Plus />} onClick={() => setComposing(true)} />
      </div>

      <CreateDialog
        title="새 문서"
        description="본문은 세운 뒤에 적습니다."
        isOpen={composing}
        onOpenChange={setComposing}
        actionLabel="세우기"
        onSubmit={createDoc}
      >
        <TextInput label="제목" value={title} onChange={setTitle} isRequired />
      </CreateDialog>

      <CreateDialog
        title="새 폴더"
        description="뿌리에 섭니다. 담는 것은 문서 쪽에서 정합니다."
        isOpen={foldering}
        onOpenChange={setFoldering}
        actionLabel="세우기"
        onSubmit={createFolder}
      >
        <TextInput label="폴더 이름" value={folderName} onChange={setFolderName} isRequired />
      </CreateDialog>

      {docs.length === 0 && folders.length === 0 ? (
        <EmptyState title="아직 문서가 없습니다" description="제목을 적어 첫 문서를 세웁니다." />
      ) : (
        <>
          {folders.map((folder) => {
            const contents = inFolder(folder.id);
            const isOpen = !collapsed.includes(folder.id);
            return (
              <div key={folder.id} className="folder-group">
                <button type="button" className="folder-head" onClick={() => toggle(folder.id)}>
                  <ChevronRight aria-hidden className={isOpen ? 'turned' : undefined} />
                  <Folder aria-hidden />
                  <Text as="span">{folder.name}</Text>
                  <Text as="span" type="supporting" color="secondary">
                    {contents.length}
                  </Text>
                </button>
                {isOpen && contents.length > 0 ? (
                  <ul className="rows">{contents.map(docRow)}</ul>
                ) : null}
              </div>
            );
          })}

          {root.length > 0 ? <ul className="rows">{root.map(docRow)}</ul> : null}
        </>
      )}
    </section>
  );
}
