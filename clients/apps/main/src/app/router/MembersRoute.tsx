import { MembersPage } from '@/pages/workspaces/members';
import { useNavigate, useParams } from '@tanstack/react-router';
export function MembersRoute() {
  const { projectId } = useParams({ from: '/projects/$projectId/members' });
  const navigate = useNavigate();
  return <MembersPage projectId={projectId} onPreview={token => { if (token) void navigate({ to: '/invitations/$token', params: { token } }); }} />;
}
