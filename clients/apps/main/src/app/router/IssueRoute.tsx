import { Button, EmptyState } from '@astryxdesign/core';
import { useIssueStore } from '@/entities/issue';
import { useWorkspaceStore } from '@/entities/workspace';
import { IssueDetailPage } from '@/pages/issues/detail';
import {
    useNavigate,
    useParams
} from '@tanstack/react-router';
import { projectItems } from './projectItems';

export function IssueRoute() {
  const { projectId, itemId } = useParams({ from: '/projects/$projectId/issues/$itemId' });
  const navigate = useNavigate();
  const { items, toggleCriterion, changeItemState } = useIssueStore();
const { projects } = useWorkspaceStore();
  const item = projectItems(projectId, items, projects).find((i) => i.id === itemId);

  if (!item) return <EmptyState title="이슈를 찾을 수 없습니다" actions={<Button label="목록으로" onClick={() => navigate({ to: '/projects/$projectId/issues', params: { projectId }, search: {} })} />} />;

  return (
    <IssueDetailPage
      item={item}
      parent={items.find((i) => i.id === item.parentId) ?? null}
      children={items.filter((i) => i.parentId === item.id)}
      onBack={() => navigate({ to: '/projects/$projectId/issues', params: { projectId } })}
      onOpenItem={(id) =>
        navigate({ to: '/projects/$projectId/issues/$itemId', params: { projectId, itemId: id } })
      }
      onOpenDoc={(docId) =>
        navigate({ to: '/projects/$projectId/artifacts/$docId', params: { projectId, docId } })
      }
      onToggleCriterion={(n) => toggleCriterion(item.id, n)}
      onStateChange={(state) => changeItemState(item.id, state)}
    />
  );
}
