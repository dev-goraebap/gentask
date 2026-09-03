import { buildCrumbs, type DocFolder } from '@/entities/doc';

/** 옮겨 담을 수 있는 자리 하나. 이름이 겹칠 수 있어(DOC-008 A2) 이름이 아니라 지나온 길을 보인다. */
export interface DocMoveTarget {
  /** 최상위는 폴더가 아니므로 식별자가 없다(DOC-006 A1). */
  readonly id: string | null;
  readonly path: string;
}

/**
 * 담을 수 있는 자리를 낸다(DOC-006 기본 흐름 3 · DOC-008 A5).
 *
 * <p>지금 담긴 자리를 빼는 것은 그것이 옮기는 일이 아니기 때문이다. 옮기는 것이 폴더면 그 자신과
 * 자손도 뺀다 — 허용하면 고리가 생겨 최상위에서 내려가는 어느 길로도 닿지 않는다(DOC-008 A6).
 * 서버도 같은 것을 보지만 고를 수 없게 미리 막는다.
 */
export function moveTargets(
  folders: readonly DocFolder[],
  from: string | null,
  moving: string | null,
): readonly DocMoveTarget[] {
  const candidates: readonly (string | null)[] = [null, ...folders.map((folder) => folder.id)];

  return candidates
    .filter((id) => id !== from && !isSelfOrDescendant(folders, id, moving))
    .map((id) => ({
      id,
      path: buildCrumbs(folders, id)
        .map((crumb) => crumb.name)
        .join(' / '),
    }));
}

function isSelfOrDescendant(
  folders: readonly DocFolder[],
  candidateId: string | null,
  ancestorId: string | null,
): boolean {
  if (ancestorId === null) return false;

  let cursor = candidateId;
  // 자료가 고리를 담고 있어도 멈춰야 하므로 폴더 수만큼만 거슬러 오른다.
  for (let step = 0; step <= folders.length && cursor !== null; step += 1) {
    if (cursor === ancestorId) return true;
    cursor = folders.find((folder) => folder.id === cursor)?.parentId ?? null;
  }

  return false;
}
