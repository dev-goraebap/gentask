import { Button, EmptyState } from '@astryxdesign/core';
import { useNavigate } from '@tanstack/react-router';
export function UnavailablePage() {
  const navigate = useNavigate();
  return <EmptyState title="이 기능은 준비 중입니다" description="현재 프로젝트와 아티팩트를 사용할 수 있습니다." actions={<Button label="프로젝트 목록으로" onClick={() => navigate({ to: '/projects' })} />} />;
}
