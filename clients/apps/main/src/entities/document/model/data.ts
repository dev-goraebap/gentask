export interface DocFolder {
  readonly projectId?: string;
  readonly id: string;
  readonly title: string;
  readonly parentId: string | null;
}

export interface Doc {
  readonly projectId?: string;
  readonly id: string;
  readonly folderId: string | null;
  title: string;
  body: string;
  readonly updatedAt: string;
  readonly updatedOn?: string;
  readonly updatedBy: string;
}

export const DOC_FOLDERS: DocFolder[] = [
  { id: 'usecase', title: '유스케이스', parentId: null },
  { id: 'arch', title: '아키텍처', parentId: null },
  { id: 'reference', title: '참고 자료', parentId: 'usecase' },
];

export const DOCS: Doc[] = [
  {
    id: 'UC-001',
    folderId: 'usecase',
    title: 'UC-001 예약 변경',
    updatedAt: '어제 17:20',
    updatedBy: '고재범',
    body: `## 액터와 목표

환자가 확정된 예약의 시간을 원하는 시간대로 변경한다.

## 기본 흐름

1. 환자가 예약 상세를 연다.
2. 변경을 선택한다.
3. 시스템이 변경 가능한 시간대를 표시한다.
4. 환자가 시간대를 선택하고 확정한다.
5. 시스템이 예약을 갱신하고 확인 알림을 발송한다.

## 대체 흐름

**3a. 변경 가능한 시간대가 없다**
안내 문구를 표시하고 전화 문의 연락처를 제공한다.

## 예외 흐름

**4a. 선택한 시간대가 그 사이에 마감되었다**
오류를 표시하고 3단계로 돌아간다.

**2a. 진료 24시간 이내다**
변경을 허용하지 않는다.`,
  },
  {
    id: 'UC-002',
    folderId: 'usecase',
    title: 'UC-002 보험 자격 확인',
    updatedAt: '3일 전',
    updatedBy: '윤도경',
    body: `## 액터와 목표

접수 직원이 환자의 보험 자격을 확인한 상태로 접수를 완료한다.

## 기본 흐름

1. 접수 직원이 환자를 접수 등록한다.
2. 시스템이 자격 조회를 자동으로 요청한다.
3. 조회 결과를 접수 화면에 표시한다.

## 예외 흐름

**2a. 조회에 실패한다**
수동 확인으로 전환한다. 접수 자체는 막지 않는다.`,
  },
  {
    id: 'ADR-0003',
    folderId: 'arch',
    title: '결정-0003 알림 중복 발송을 멱등키로 막는다',
    updatedAt: '지난주',
    updatedBy: '고재범',
    body: `## 맥락

발송기가 통신 실패 시 요청을 큐로 되돌린다. 되돌린 요청과 원래 요청이 모두 처리되면 알림이 두 번 나간다.

## 결정

예약 식별자와 알림 종류를 조합해 멱등키를 만든다. 발송 이력 테이블에 유일 제약을 걸어 중복 적재를 차단한다.

## 결과

재시도가 안전해진다. 발송 이력 테이블의 쓰기 경합이 늘어난다.`,
  },
];

DOC_FOLDERS.push(...Array.from({ length: 28 }, (_, i) => ({
  id: `sample-folder-${i}`, title: `업무 자료 ${String(i + 1).padStart(2, '0')}`, parentId: null,
})));

DOCS.push(...[null, 'usecase', 'arch', 'sample-folder-0'].flatMap((folderId, folderIndex) =>
  Array.from({ length: folderId === null ? 58 : 67 }, (_, i): Doc => ({
    id: `DOC-${folderIndex}-${String(i + 1).padStart(3, '0')}`, folderId,
    title: `${['운영 절차', '화면 설계', '검토 기록', '요구사항', '사용자 안내'][i % 5]} ${String(i + 1).padStart(3, '0')}${i % 13 === 0 ? ' — 외부 협력사와 함께 검토하는 예약 변경 및 예외 처리 상세 안내' : ''}`,
    updatedAt: `2026-08-${String(i % 28 + 1).padStart(2, '0')}`,
    updatedOn: `2026-08-${String(i % 28 + 1).padStart(2, '0')}`,
    updatedBy: ['고재범', '윤도경', '김세아'][i % 3],
    body: `문서 목록 탐색을 위한 예시입니다.\n\n${i + 1}번째 검토 내용과 후속 작업을 기록합니다.`,
  })),
));

export function removeProjectDocuments(projectId: string) {
  for (let i = DOCS.length - 1; i >= 0; i--) if ((DOCS[i].projectId ?? 'dental') === projectId) DOCS.splice(i, 1);
  for (let i = DOC_FOLDERS.length - 1; i >= 0; i--) if ((DOC_FOLDERS[i].projectId ?? 'dental') === projectId) DOC_FOLDERS.splice(i, 1);
}
