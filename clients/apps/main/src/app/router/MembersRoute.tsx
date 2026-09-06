import { MembersPage } from '@/pages/workspaces/members';
import {
    useNavigate,
    useParams,
    useSearch
} from '@tanstack/react-router';

export function MembersRoute() {
  const { projectId } = useParams({ from: '/projects/$projectId/members' });
  const { invite } = useSearch({ from: '/projects/$projectId/members' });
  const navigate = useNavigate();
  return <MembersPage key={projectId} projectId={projectId} inviteId={invite}
    onPreview={(id) => navigate({ to: '/projects/$projectId/members', params: { projectId }, search: id ? { invite: id } : {} })} />;
}
