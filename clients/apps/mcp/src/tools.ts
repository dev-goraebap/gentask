import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Task, GentaskClient } from './gentask-client.js';

/**
 * 작업 API 의 자리를 도구로 옮긴다.
 *
 * <p>도구가 스스로 판정하거나 저장하는 것은 없다. 규칙은 모두 서버가 가지며 여기는 부르고 옮기기만
 * 한다. 예외는 편집 하나인데, 서버의 편집이 부분 갱신이 아니라 네 값을 그대로 받으므로 빠진 값을
 * 지금 값으로 채운다 — 그러지 않으면 제목만 고치려다 메모와 기한이 지워진다. 그것은 규칙을 만드는
 * 것이 아니라 두 번 부르는 것이다.
 */
export function registerTaskTools(server: McpServer, client: GentaskClient): void {
  server.registerTool(
    'list_tasks',
    {
      title: '작업 목록',
      description: '내 작업을 모두 낸다. 완료한 것도 함께 나오며 completedAt 이 그것을 가른다.',
      inputSchema: {},
    },
    async () => json(await client.list()),
  );

  server.registerTool(
    'get_task',
    {
      title: '작업 하나',
      description: '식별자로 작업 하나를 낸다.',
      inputSchema: { taskId: z.string().describe('작업의 식별자') },
    },
    async ({ taskId }) => json(await client.get(taskId)),
  );

  server.registerTool(
    'add_task',
    {
      title: '작업 추가',
      description: '작업을 하나 만든다. 기한은 선택이며 YYYY-MM-DD 로 적는다.',
      inputSchema: {
        title: z.string().min(1).describe('할 일의 제목'),
        dueDate: z.string().nullish().describe('기한 (YYYY-MM-DD). 없으면 비운다'),
      },
    },
    async ({ title, dueDate }) => {
      const taskId = await client.add(title, dueDate ?? null);
      return json({ taskId, title });
    },
  );

  server.registerTool(
    'edit_task',
    {
      title: '작업 편집',
      description:
        '제목 · 메모 · 기한 · 미리 알림을 고친다. 넘기지 않은 값은 지금 값을 그대로 둔다. ' +
        '비우려면 null 을 넘긴다. 미리 알림은 YYYY-MM-DDTHH:mm 이다.',
      inputSchema: {
        taskId: z.string().describe('작업의 식별자'),
        title: z.string().min(1).optional().describe('새 제목'),
        note: z.string().nullish().describe('메모. null 이면 비운다'),
        dueDate: z.string().nullish().describe('기한 (YYYY-MM-DD). null 이면 비운다'),
        remindAt: z.string().nullish().describe('미리 알림 (YYYY-MM-DDTHH:mm). null 이면 비운다'),
      },
    },
    async ({ taskId, title, note, dueDate, remindAt }) => {
      const now = await client.get(taskId);
      await client.edit(taskId, {
        title: title ?? now.title,
        note: pick(note, now.note) ?? '',
        dueDate: pick(dueDate, now.dueDate),
        remindAt: pick(remindAt, now.remindAt),
      });
      return json(await client.get(taskId));
    },
  );

  server.registerTool(
    'set_task_completed',
    {
      title: '작업 완료',
      description: '작업을 완료하거나 완료를 되돌린다.',
      inputSchema: {
        taskId: z.string().describe('작업의 식별자'),
        completed: z.boolean().describe('완료로 두려면 true'),
      },
    },
    async ({ taskId, completed }) => {
      await client.setCompleted(taskId, completed);
      return json({ taskId, completed });
    },
  );

  server.registerTool(
    'set_task_important',
    {
      title: '중요 표시',
      description: '작업의 중요 표시를 켜거나 끈다.',
      inputSchema: {
        taskId: z.string().describe('작업의 식별자'),
        important: z.boolean().describe('중요로 두려면 true'),
      },
    },
    async ({ taskId, important }) => {
      await client.setImportant(taskId, important);
      return json({ taskId, important });
    },
  );

  server.registerTool(
    'set_task_my_day',
    {
      title: '나의 하루',
      description: '작업을 오늘 할 것으로 담거나 뺀다.',
      inputSchema: {
        taskId: z.string().describe('작업의 식별자'),
        inMyDay: z.boolean().describe('오늘 할 것으로 담으려면 true'),
      },
    },
    async ({ taskId, inMyDay }) => {
      await client.setMyDay(taskId, inMyDay);
      return json({ taskId, inMyDay });
    },
  );

  server.registerTool(
    'delete_task',
    {
      title: '작업 삭제',
      description: '작업을 지운다. 되돌릴 수 없다.',
      inputSchema: { taskId: z.string().describe('작업의 식별자') },
    },
    async ({ taskId }) => {
      await client.remove(taskId);
      return json({ taskId, deleted: true });
    },
  );
}

/**
 * 넘기지 않은 값과 비우라는 값을 가른다.
 *
 * <p>`undefined` 는 "건드리지 마라"이고 `null` 은 "비워라"다. 둘을 같게 다루면 제목만 고치려는
 * 부탁이 메모를 지운다.
 */
function pick<T>(given: T | null | undefined, current: T | null): T | null {
  return given === undefined ? current : given;
}

function json(value: Task | readonly Task[] | Record<string, unknown>): {
  content: { type: 'text'; text: string }[];
} {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}
