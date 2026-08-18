/**
 * 할일 하나입니다.
 *
 * 프로토타입 구간의 이 타입 정의가 이후 백엔드 스펙의 API 계약 입력이 됩니다.
 * 백엔드가 붙으면 생성 타입이 이 자리를 대체하며, 그때 이 모양과 생성 타입의 차이가
 * 곧 스펙 누락 목록입니다. docs/architecture/references/14-api-contract.md 4절.
 *
 * 완료 여부를 boolean 이 아니라 시각으로 두는 이유는 "언제 해냈는가"가 완료 목록의
 * 정렬 근거이고, boolean 으로 두면 그 정보를 나중에 되살릴 수 없기 때문입니다.
 */
export type Task = {
  readonly id: string;
  readonly title: string;
  readonly createdAt: string;
  readonly completedAt: string | null;
};

export function isCompleted(task: Task): boolean {
  return task.completedAt !== null;
}

/**
 * 미완료와 완료를 갈라 각각의 표시 순서로 정렬합니다.
 *
 * 미완료는 최근에 적은 것이 위로 옵니다. 방금 적은 것이 목록 아래로 밀려나면
 * 적었는지 확인하러 스크롤해야 합니다.
 * 완료는 최근에 해낸 것이 위로 옵니다.
 */
export function splitByCompletion(tasks: readonly Task[]): {
  readonly active: readonly Task[];
  readonly completed: readonly Task[];
} {
  const active = tasks.filter((task) => !isCompleted(task));
  const completed = tasks.filter(isCompleted);

  return {
    active: [...active].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    completed: [...completed].sort((a, b) =>
      (b.completedAt ?? '').localeCompare(a.completedAt ?? ''),
    ),
  };
}

/** 제목만 있으면 추가할 수 있습니다. 공백만 입력한 것은 제목이 아닙니다. */
export function isAddableTitle(raw: string): boolean {
  return raw.trim().length > 0;
}
