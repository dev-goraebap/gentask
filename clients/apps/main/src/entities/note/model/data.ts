export interface Note {
  readonly files?: readonly File[];
  readonly id: string;
  title: string;
  body: string;
  readonly updatedAt: string;
}

export const INITIAL_NOTES: Note[] = [
  {
    id: 'N1',
    title: '릴리스 절차 메모',
    updatedAt: '오늘 09:14',
    body: `태그를 붙이면 GitHub Actions가 이미지를 빌드해 ghcr에 올린다.

홈서버 갱신은 아래 두 줄로 끝난다.

    docker compose pull
    docker compose up -d`,
  },
  {
    id: 'N2',
    title: '읽을 것',
    updatedAt: '어제',
    body: `- 멱등 처리 관련 자료
- 셀프호스팅 도구들의 초대 링크 구현 방식`,
  },
];

INITIAL_NOTES.push(
  { id: 'drawer-idea', title: '문득 떠오른 아이디어', body: '회의가 끝나면 결정한 내용과 다음 행동을 한 줄씩 남기기.\n나중에 읽는 사람도 맥락을 이해할 수 있도록.', updatedAt: '오늘' },
  { id: 'drawer-short', title: '', body: '다음 주에는 알림을 줄이고 집중하는 시간을 만들어보기.', updatedAt: '오늘' },
  { id: 'drawer-check', title: '새로운 화면을 볼 때', body: '처음 온 사람도 시작할 곳을 찾을 수 있을까?\n\n자주 하는 행동이 손이 닿는 곳에 있을까?\n\n되돌아오는 경로가 분명할까?', updatedAt: '어제' },
  { id: 'drawer-collect', title: '모아두고 싶은 것', body: '좋은 문장\n산책하며 찍은 사진\n나중에 읽을 자료\n아직 이름 붙이지 못한 생각', updatedAt: '어제' }
);
