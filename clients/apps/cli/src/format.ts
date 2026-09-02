import type { Task } from './gentask-client.js';

/**
 * 사람이 읽는 출구.
 *
 * <p>기계가 읽는 것은 `--json` 이 낸다. 둘을 한 명령이 갖되 섞지 않는 것은 결정-0013 의 규격이다.
 */

/** 식별자는 앞 여덟 자만 보인다. 목록에서 고르는 데는 그것으로 충분하고 전문은 줄을 다 먹는다. */
export function shortId(id: string): string {
  return id.slice(0, 8);
}

/** 완료 · 중요 · 나의 하루를 한 칸에 담는다. 켜진 것만 글자를 갖는다. */
function marks(task: Task): string {
  return [
    task.completedAt ? 'x' : ' ',
    task.important ? '*' : ' ',
    task.myDayOn ? 'o' : ' ',
  ].join('');
}

/** 기한과 미리 알림. 둘 다 없으면 빈 칸이다. */
function when(task: Task): string {
  const parts: string[] = [];
  if (task.dueDate) {
    parts.push(task.dueDate);
  }
  if (task.remindAt) {
    parts.push(task.remindAt.replace('T', ' ').slice(0, 16));
  }
  return parts.join(' · ');
}

/**
 * 화면에서 차지하는 칸 수.
 *
 * <p>한글과 한자와 가나는 한 글자가 두 칸이다. 글자 수로 세면 표의 세로줄이 어긋난다. 범위는
 * 유니코드의 East Asian Width 가 W 와 F 로 정한 자리를 따른다.
 */
export function displayWidth(text: string): number {
  let width = 0;
  for (const ch of text) {
    const c = ch.codePointAt(0) ?? 0;
    const wide =
      (c >= 0x1100 && c <= 0x115f) ||
      (c >= 0x2e80 && c <= 0x303e) ||
      (c >= 0x3041 && c <= 0x33ff) ||
      (c >= 0x3400 && c <= 0x4dbf) ||
      (c >= 0x4e00 && c <= 0x9fff) ||
      (c >= 0xa000 && c <= 0xa4cf) ||
      (c >= 0xac00 && c <= 0xd7a3) ||
      (c >= 0xf900 && c <= 0xfaff) ||
      (c >= 0xfe30 && c <= 0xfe6f) ||
      (c >= 0xff00 && c <= 0xff60) ||
      (c >= 0xffe0 && c <= 0xffe6) ||
      (c >= 0x20000 && c <= 0x3fffd);
    width += wide ? 2 : 1;
  }
  return width;
}

/** 표의 세로줄을 맞춘다. 글자 수가 아니라 칸 수로 센다. */
export function padTo(text: string, target: number): string {
  return text + ' '.repeat(Math.max(0, target - displayWidth(text)));
}

/** 목록을 표로 그린다. 비었으면 그 사실을 한 줄로 말한다. */
export function formatList(tasks: readonly Task[]): string {
  if (tasks.length === 0) {
    return '작업이 없습니다.';
  }

  const rows = tasks.map((task) => ({
    id: shortId(task.id),
    marks: marks(task),
    title: task.title,
    when: when(task),
  }));

  const titleWidth = Math.max(...rows.map((r) => displayWidth(r.title)), 5);
  return rows
    .map((r) => `${r.id}  ${r.marks}  ${padTo(r.title, titleWidth)}  ${r.when}`.trimEnd())
    .join('\n');
}

/** 하나를 펼친다. 값이 없는 줄은 내지 않는다. */
export function formatTask(task: Task): string {
  const lines = [`${task.title}`, `  식별자   ${task.id}`];

  if (task.note) {
    lines.push(`  메모     ${task.note.replace(/\n/g, '\n           ')}`);
  }
  if (task.dueDate) {
    lines.push(`  기한     ${task.dueDate}`);
  }
  if (task.remindAt) {
    lines.push(`  미리알림 ${task.remindAt.replace('T', ' ').slice(0, 16)}`);
  }
  if (task.myDayOn) {
    lines.push(`  나의하루 ${task.myDayOn}`);
  }
  if (task.important) {
    lines.push('  중요     예');
  }
  lines.push(`  상태     ${task.completedAt ? '완료' : '미완료'}`);

  return lines.join('\n');
}
