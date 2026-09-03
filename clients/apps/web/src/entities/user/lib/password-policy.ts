/**
 * 비밀번호 정책 위반 메시지를 반환하며 유효한 경우 null을 반환한다.
 *
 * **이것은 사본이다.** 판정의 근거는 서버가 갖고 여기서는 제출하기 전에 알려 주기만 한다. 같은
 * 규칙이 두 축에 각각 적혀 있으므로 한쪽만 고치면 어긋난 채로 지나간다 — 결정-0012 가 그것을
 * 감수 항목으로 적었다.
 */
const MIN = 8;
const MAX = 72;

export function describePasswordViolation(value: string): string | null {
  if (!value) return '비밀번호를 입력해 주세요';
  if (value.length < MIN || value.length > MAX) {
    return `비밀번호는 ${MIN}자 이상 ${MAX}자 이하입니다`;
  }

  const missing: string[] = [];
  if (!/\p{L}/u.test(value)) missing.push('영문자');
  if (!/\p{Nd}/u.test(value)) missing.push('숫자');
  if (!/[^\p{L}\p{Nd}]/u.test(value)) missing.push('특수문자');

  // 충족하지 못한 것을 모아 한 번에 낸다. 하나씩 알리면 고칠 때마다 다시 제출하게 된다.
  return missing.length ? `비밀번호에 ${missing.join(' · ')}를 각각 하나 이상 넣어 주세요` : null;
}

export const PASSWORD_RULE_HINT = `${MIN}자 이상이며 영문자 · 숫자 · 특수문자를 각각 하나 이상 넣어 주세요`;
