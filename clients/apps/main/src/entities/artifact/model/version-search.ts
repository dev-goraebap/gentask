export function parseVersionSearch(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  if ((typeof value !== 'string' && typeof value !== 'number') || !/^[1-9]\d*$/.test(String(value))) {
    throw new Error('버전 번호는 1 이상의 정수여야 합니다.');
  }
  const version = Number(value);
  if (!Number.isSafeInteger(version) || version > 2_147_483_647) {
    throw new Error('지원하는 버전 번호 범위를 벗어났습니다.');
  }
  return version;
}
