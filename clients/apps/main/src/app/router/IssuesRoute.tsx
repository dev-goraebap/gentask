import { useIssueStore } from '@/entities/issue';
import { useWorkspaceStore } from '@/entities/workspace';
import { IssuesPage } from '@/pages/issues/list';
import {
    useNavigate,
    useParams,
    useSearch
} from '@tanstack/react-router';
import { projectItems } from './projectItems';

export function IssuesRoute() {
  const { projectId } = useParams({ from: '/projects/$projectId/issues' });
  const { view } = useSearch({ from: '/projects/$projectId/issues' });
  const navigate = useNavigate();
  const { items } = useIssueStore();
const { projects } = useWorkspaceStore();

  return (
    <IssuesPage
      projectId={projectId}
      items={projectItems(projectId, items, projects)}
      view={view ?? 'list'}
      onViewChange={(next) =>
        navigate({
          to: '/projects/$projectId/issues',
          params: { projectId },
          search: next === 'list' ? {} : { view: next },
        })
      }
      onOpen={(itemId) =>
        navigate({ to: '/projects/$projectId/issues/$itemId', params: { projectId, itemId } })
      }
    />
  );
}
