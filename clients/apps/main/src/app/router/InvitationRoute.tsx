import { InvitationPage } from '@/pages/invitation';
import { useNavigate, useParams } from '@tanstack/react-router';

export function InvitationRoute() {
  const { token } = useParams({ from: '/invitations/$token' });
  const navigate = useNavigate();
  return <InvitationPage token={token}
    onLogin={() => { void navigate({ to: '/login', search: { invite: token } }); }}
    onJoined={projectId => navigate({ to: '/projects/$projectId/tasks', params: { projectId } })} />;
}
