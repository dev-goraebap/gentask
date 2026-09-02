/**
 * 두 개정의 본문을 줄 단위로 견준다.
 *
 * <p>서버는 차이를 담지 않는다. 담아 두면 본문과 차이 두 자리가 어긋날 수 있고, 어긋났을 때 어느
 * 쪽이 참인지 판정할 근거가 없기 때문이다(DOC-004). 그래서 볼 때 이 자리가 센다.
 *
 * <p>새 꾸러미를 들이지 않고 직접 적는다. 줄 단위 최장 공통 부분수열은 짧고, 이 화면 하나를 위해
 * 첫 묶음을 불리는 것이 되돌리기 비싼 결정이기 때문이다.
 */

/** 한 줄이 어느 쪽에만 있는가. */
export type DiffMark = 'same' | 'added' | 'removed';

export interface DiffLine {
  readonly mark: DiffMark;
  readonly text: string;
  /** 앞의 개정에서 몇째 줄인가. 더한 줄은 갖지 않는다. */
  readonly fromNo: number | null;
  /** 뒤의 개정에서 몇째 줄인가. 지운 줄은 갖지 않는다. */
  readonly toNo: number | null;
}

export interface DiffResult {
  readonly lines: readonly DiffLine[];
  readonly addedCount: number;
  readonly removedCount: number;
  /**
   * 견주기를 포기하고 통째로 갈렸다고 그렸는가.
   *
   * <p>참이면 지운 줄 전부와 더한 줄 전부만 담긴다. 표가 너무 커져 세는 값이 브라우저를 멈추게 할
   * 때의 자리이며, 그 사실을 감추면 사람이 실제로 그만큼 고쳤다고 읽는다.
   */
  readonly tooLarge: boolean;
}

/**
 * 표의 칸 수 상한.
 *
 * <p>앞뒤로 같은 줄을 걷어 낸 뒤의 넓이를 잰다. 100_000 자 상한인 본문이 전부 달라도 줄이 5 만을
 * 넘기 어려우므로, 이 상한에 닿는 것은 서로 아무 관계 없는 두 글을 견줄 때뿐이다.
 */
const CELL_LIMIT = 1_000_000;

export function diffLines(from: string, to: string): DiffResult {
  const fromLines = splitLines(from);
  const toLines = splitLines(to);

  // 앞뒤로 같은 줄은 셀 것이 없다. 문서를 고치는 일은 대개 한 자리를 건드리므로 이것이 표를 줄인다.
  let head = 0;
  while (head < fromLines.length && head < toLines.length && fromLines[head] === toLines[head]) {
    head += 1;
  }

  let tail = 0;
  while (
    tail < fromLines.length - head &&
    tail < toLines.length - head &&
    fromLines[fromLines.length - 1 - tail] === toLines[toLines.length - 1 - tail]
  ) {
    tail += 1;
  }

  const fromMiddle = fromLines.slice(head, fromLines.length - tail);
  const toMiddle = toLines.slice(head, toLines.length - tail);

  const tooLarge = fromMiddle.length * toMiddle.length > CELL_LIMIT;
  const middle = tooLarge ? wholesale(fromMiddle, toMiddle) : align(fromMiddle, toMiddle);

  const lines: DiffLine[] = [];
  let fromNo = 0;
  let toNo = 0;
  let addedCount = 0;
  let removedCount = 0;

  const push = (mark: DiffMark, text: string): void => {
    if (mark === 'added') {
      toNo += 1;
      addedCount += 1;
      lines.push({ mark, text, fromNo: null, toNo });
      return;
    }
    if (mark === 'removed') {
      fromNo += 1;
      removedCount += 1;
      lines.push({ mark, text, fromNo, toNo: null });
      return;
    }
    fromNo += 1;
    toNo += 1;
    lines.push({ mark, text, fromNo, toNo });
  };

  for (let i = 0; i < head; i += 1) push('same', fromLines[i]);
  for (const line of middle) push(line.mark, line.text);
  for (let i = toLines.length - tail; i < toLines.length; i += 1) push('same', toLines[i]);

  return { lines, addedCount, removedCount, tooLarge };
}

/** 줄로 가른다. 적는 자리가 무엇이든 같게 세도록 줄 끝의 규약을 하나로 맞춘다. */
function splitLines(text: string): readonly string[] {
  const normalized = text.replace(/\r\n?/g, '\n');
  return normalized === '' ? [] : normalized.split('\n');
}

interface Step {
  readonly mark: DiffMark;
  readonly text: string;
}

/** 표를 세지 않고 통째로 갈렸다고 본다. 넓이가 상한을 넘을 때만 지난다. */
function wholesale(from: readonly string[], to: readonly string[]): readonly Step[] {
  return [
    ...from.map<Step>((text) => ({ mark: 'removed', text })),
    ...to.map<Step>((text) => ({ mark: 'added', text })),
  ];
}

/**
 * 최장 공통 부분수열로 두 줄뭉치를 맞춘다.
 *
 * <p>뒤에서부터 표를 채우고 앞에서부터 거슬러 읽는다. 한 자리에서 갈릴 때 지운 줄을 먼저 내는 것은
 * 읽는 사람이 무엇이 무엇으로 바뀌었는지 짝지어 보기 때문이다.
 */
function align(from: readonly string[], to: readonly string[]): readonly Step[] {
  const rows = from.length;
  const columns = to.length;
  const width = columns + 1;
  const table = new Int32Array((rows + 1) * width);

  for (let i = rows - 1; i >= 0; i -= 1) {
    for (let j = columns - 1; j >= 0; j -= 1) {
      table[i * width + j] =
        from[i] === to[j]
          ? table[(i + 1) * width + j + 1] + 1
          : Math.max(table[(i + 1) * width + j], table[i * width + j + 1]);
    }
  }

  const steps: Step[] = [];
  let i = 0;
  let j = 0;

  while (i < rows && j < columns) {
    if (from[i] === to[j]) {
      steps.push({ mark: 'same', text: from[i] });
      i += 1;
      j += 1;
    } else if (table[(i + 1) * width + j] >= table[i * width + j + 1]) {
      steps.push({ mark: 'removed', text: from[i] });
      i += 1;
    } else {
      steps.push({ mark: 'added', text: to[j] });
      j += 1;
    }
  }

  for (; i < rows; i += 1) steps.push({ mark: 'removed', text: from[i] });
  for (; j < columns; j += 1) steps.push({ mark: 'added', text: to[j] });

  return steps;
}
