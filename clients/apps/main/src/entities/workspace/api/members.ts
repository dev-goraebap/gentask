import { get, request } from '@/shared/api';
import { queryOptions } from '@tanstack/react-query';
import type { ProjectMember, Invitation } from '../model/members';

const base = (projectId: string) => `/projects/${encodeURIComponent(projectId)}`;
export const membersOptions = (projectId: string) => queryOptions({
  queryKey: ['project-members', projectId],
  queryFn: async ({ signal }) => (await get<{ id: string; name: string; role: ProjectMember['role']; joinedAt: string; profileImageUrl?: string }[]>(base(projectId) + '/members', signal))
    .map(member => ({ ...member, projectId, joinedOn: new Date(member.joinedAt).toLocaleDateString('ko-KR'), isGuest: false })),
});
export const invitationsOptions = (projectId: string) => queryOptions({
  queryKey: ['project-invitations', projectId],
  queryFn: async ({ signal }) => (await get<(Omit<Invitation, 'expiresAt'> & { expiresAt: string })[]>(base(projectId) + '/invitations', signal))
    .map(invitation => ({ ...invitation, expiresAt: Date.parse(invitation.expiresAt) })),
});
export const createInvitation = async (projectId: string, input: { label: string; role: string; days: number }) =>
  (await request<{ id: string }>(base(projectId) + '/invitations', { method: 'POST', body: JSON.stringify(input) })).data;
export const changeMemberRole = (projectId: string, memberId: string, role: string) =>
  request(base(projectId) + '/members/' + encodeURIComponent(memberId), { method: 'PATCH', body: JSON.stringify({ role }) });
export const removeMember = (projectId: string, memberId: string) =>
  request(base(projectId) + '/members/' + encodeURIComponent(memberId), { method: 'DELETE' });
export const revokeInvitation = (projectId: string, invitationId: string) =>
  request(base(projectId) + '/invitations/' + encodeURIComponent(invitationId), { method: 'DELETE' });
export type InvitationPreview = { projectId: string; projectName: string; role: string; expiresAt: string };
export const invitationOptions = (token: string) => queryOptions({
  queryKey: ['invitation', token], retry: false,
  queryFn: ({ signal }) => get<InvitationPreview>('/invitations/' + encodeURIComponent(token) + '/preview', signal),
});
export const acceptInvitation = async (token: string) =>
  (await request<InvitationPreview>('/invitations/' + encodeURIComponent(token) + '/accept', { method: 'POST' })).data;
