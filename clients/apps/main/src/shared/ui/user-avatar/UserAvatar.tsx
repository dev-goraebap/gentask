import { Avatar, type AvatarProps } from '@astryxdesign/core';
import { useMemo } from 'react';
import { defaultAvatarSource } from './default-avatar';

export function UserAvatar({ userId, src, ...props }: Omit<AvatarProps, 'fallbackSrc'> & { userId?: string | null }) {
  const fallback = useMemo(() => defaultAvatarSource(userId || 'unknown-user'), [userId]);
  return <Avatar {...props} src={src || fallback} fallbackSrc={fallback} />;
}
