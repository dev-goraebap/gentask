import {
  Button,
  CheckboxInput,
  EmptyState,
  SegmentedControl,
  SegmentedControlItem,
  Text,
  TextInput,
} from '@astryxdesign/core';
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router';
import { ArrowDown, ArrowUp, CalendarDays, ChevronRight, Plus, Star, Sun } from 'lucide-react';
import { useState } from 'react';
import { api, type TaskView } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { TASK_VIEWS, taskViewLabel, toTaskView } from '@/shared/config/nav';
import { ROUTES } from '@/shared/config/routes';
import { TaskDetailPanel } from '@/shared/ui/task-detail-panel';

export const Route = createFileRoute('/_app/todo/$view')({
  // 펼친 할 일은 주소가 갖는다. 그래야 새로고침과 뒤로가기가 성립한다.
  validateSearch: (search: Record<string, unknown>) => ({
    task: typeof search.task === 'string' ? search.task : undefined,
    sort: typeof search.sort === 'string' ? search.sort : undefined,
    // 기본값을 채우지 않는다. 채우면 라우터가 주소를 다시 써 ?dir=asc 가 늘 붙는다.
    dir: search.dir === 'desc' ? ('desc' as const) : undefined,
  }),
  loader: () => api.get<TaskView[]>(ENDPOINTS.tasks),
  component: TaskListPage,
});

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** 관점은 서버가 아니라 화면이 가른다. 목록은 한 벌만 받아 온다. */
function filterByView(tasks: readonly TaskView[], view: string, today: string): readonly TaskView[] {
  if (view === 'my-day') return tasks.filter((task) => task.myDayOn === today);
  if (view === 'important') return tasks.filter((task) => task.important);
  if (view === 'planned') return tasks.filter((task) => task.dueDate !== null);
  return tasks;
}

/** 기한이 오늘보다 앞이면 지난 것이다. 완료된 것은 지났다고 하지 않는다. */
function isOverdue(task: TaskView, today: string): boolean {
  return task.completedAt === null && task.dueDate !== null && task.dueDate < today;
}

function describeDue(due: string, today: string): string {
  if (due === today) return '오늘';
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (due === dateKey(tomorrow)) return '내일';
  const [, month, day] = due.split('-');
  return `${Number(month)}월 ${Number(day)}일`;
}

/** 정렬 기준. web 과 같은 다섯이며 기본은 만든 날짜다. */
const SORTS = [
  { value: 'importance', label: '중요도' },
  { value: 'due', label: '기한' },
  { value: 'my-day', label: '나의 하루' },
  { value: 'title', label: '제목' },
  { value: 'created', label: '만든 날짜' },
] as const;

type SortKey = (typeof SORTS)[number]['value'];

/** 값이 없는 것은 뒤로 보낸다. 기한 없는 할 일이 기한 있는 것보다 앞에 서면 읽는 순서가 어긋난다. */
function compare(a: TaskView, b: TaskView, sort: SortKey, today: string): number {
  if (sort === 'importance') return Number(b.important) - Number(a.important);
  if (sort === 'title') return a.title.localeCompare(b.title, 'ko');
  if (sort === 'my-day') return Number(b.myDayOn === today) - Number(a.myDayOn === today);
  if (sort === 'due') {
    if (a.dueDate === b.dueDate) return 0;
    if (a.dueDate === null) return 1;
    if (b.dueDate === null) return -1;
    return a.dueDate < b.dueDate ? -1 : 1;
  }
  return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
}

const EMPTY: Record<string, { title: string; description: string }> = {
  'my-day': { title: '오늘 할 일이 없습니다', description: '목록에서 오늘 할 것을 담아 옵니다.' },
  important: { title: '중요로 표시한 것이 없습니다', description: '별을 눌러 표시합니다.' },
  planned: { title: '기한을 정한 것이 없습니다', description: '작업에 기한을 정하면 여기 섭니다.' },
  all: { title: '할 일이 없습니다', description: '아래에 적어 첫 작업을 더합니다.' },
};

function TaskListPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const tasks = Route.useLoaderData();
  const { view } = Route.useParams();
  const { task: openId, sort, dir: rawDir } = Route.useSearch();
  const dir = rawDir ?? 'asc';
  const sortKey = (SORTS.some((s) => s.value === sort) ? sort : 'created') as SortKey;
  const current = toTaskView(view);
  const today = dateKey(new Date());
  const [title, setTitle] = useState('');
  const [showDone, setShowDone] = useState(false);
  const [composing, setComposing] = useState(false);

  const sorted = [...filterByView(tasks, current, today)].sort((a, b) => {
    const order = compare(a, b, sortKey, today);
    return dir === 'desc' ? -order : order;
  });
  const visible = sorted;
  // 완료한 것은 접어 둔다. 남은 것을 먼저 보는 화면이기 때문이다.
  const active = visible.filter((task) => task.completedAt === null);
  const done = visible.filter((task) => task.completedAt !== null);

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    await api.post(ENDPOINTS.tasks, {
      title: title.trim(),
      // 나의 하루에서 더한 것은 그 자리에 남아야 한다.
      myDayOn: current === 'my-day' ? today : null,
      important: current === 'important',
    });
    setTitle('');
    await router.invalidate();
  };

  const setCompleted = async (task: TaskView, completed: boolean) => {
    await api.patch(ENDPOINTS.taskCompletion(task.id), { completed });
    await router.invalidate();
  };

  const open = openId ? (tasks.find((candidate) => candidate.id === openId) ?? null) : null;

  const closePanel = () =>
    void navigate({ to: ROUTES.taskList(current), search: { sort: sortKey, dir: rawDir } });

  const toggleImportant = async (task: TaskView) => {
    await api.patch(ENDPOINTS.taskImportance(task.id), { important: !task.important });
    await router.invalidate();
  };

  return (
    <section className="page task-page">
      {/* 넓은 화면에는 이름이, 좁은 화면에는 탭이 선다. 탭은 갈 수 있는 넷을 함께 알린다. */}
      <Text as="h1" type="display-3" className="wide-only">
        {taskViewLabel(current)}
      </Text>

      <div className="narrow-only">
        <SegmentedControl
          label="관점"
          value={current}
          onChange={(next) => void navigate({ to: ROUTES.taskList(next) })}
          layout="fill"
          size="sm"
        >
          {TASK_VIEWS.map((item) => (
            <SegmentedControlItem key={item.value} value={item.value} label={item.label} />
          ))}
        </SegmentedControl>
      </div>

      <div className="state-row">
        {SORTS.map((option) => (
          <Button
            key={option.value}
            label={option.label}
            size="sm"
            variant={sortKey === option.value ? 'secondary' : 'ghost'}
            onClick={() =>
              void navigate({
                to: ROUTES.taskList(current),
                search: { task: openId, sort: option.value, dir: rawDir },
              })
            }
          />
        ))}
        <Button
          label={dir === 'asc' ? '오름차순. 누르면 뒤집기' : '내림차순. 누르면 뒤집기'}
          isIconOnly
          icon={dir === 'asc' ? <ArrowUp /> : <ArrowDown />}
          size="sm"
          variant="ghost"
          onClick={() =>
            void navigate({
              to: ROUTES.taskList(current),
              search: { task: openId, sort: sortKey, dir: dir === 'asc' ? ('desc' as const) : undefined },
            })
          }
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState title={EMPTY[current].title} description={EMPTY[current].description} />
      ) : (
        <ul className="task-rows">
          {active.map((task) => (
            <li key={task.id}>
              <CheckboxInput
                label={task.title}
                isLabelHidden
                value={false}
                onChange={() => void setCompleted(task, true)}
              />
              <div className="task-body">
                <button
                  type="button"
                  className="task-open"
                  onClick={() =>
                    void navigate({ to: ROUTES.taskList(current), search: { task: task.id, sort: sortKey, dir: rawDir } })
                  }
                >
                  <Text as="span">{task.title}</Text>
                </button>
                {task.myDayOn === today || task.dueDate ? (
                  <span className="task-meta">
                    {task.myDayOn === today ? (
                      <span>
                        <Sun aria-hidden /> 오늘 할 일
                      </span>
                    ) : null}
                    {task.myDayOn === today && task.dueDate ? <span aria-hidden>·</span> : null}
                    {task.dueDate ? (
                      <span className={isOverdue(task, today) ? 'overdue' : undefined}>
                        <CalendarDays aria-hidden /> {describeDue(task.dueDate, today)}
                        {isOverdue(task, today) ? <span className="sr-only">지남</span> : null}
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </div>
              <Button
                label={`${task.title} 중요 표시`}
                isIconOnly
                icon={<Star className={task.important ? 'filled' : undefined} />}
                variant="ghost"
                size="sm"
                onClick={() => void toggleImportant(task)}
              />
            </li>
          ))}
        </ul>
      )}

      {done.length > 0 ? (
        <div className="done-group">
          <Button
            label={`완료 ${done.length}개`}
            variant="ghost"
            size="sm"
            icon={<ChevronRight className={showDone ? 'turned' : undefined} />}
            onClick={() => setShowDone(!showDone)}
          />
          {showDone ? (
            <ul className="task-rows">
              {done.map((task) => (
                <li key={task.id}>
                  <CheckboxInput
                    label={task.title}
                    isLabelHidden
                    value
                    onChange={() => void setCompleted(task, false)}
                  />
                  <div className="task-body">
                    <Text as="span" color="secondary" hasStrikethrough>
                      {task.title}
                    </Text>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {/*
       * 적는 자리를 여는 단추. 바닥에 붙어 있어야 엄지에 닿으므로 흐르지 않고 그 자리에 선다.
       * 넓은 화면에서는 적는 자리가 늘 보이므로 이 단추가 필요 없다.
       */}
      {!composing ? (
        <div className="fab-row narrow-only">
          <Button
            label="작업 추가"
            isIconOnly
            icon={<Plus />}
            variant="primary"
            onClick={() => setComposing(true)}
          />
        </div>
      ) : null}

      {/* 적는 자리는 바닥에 붙는다. 목록이 길어져도 손이 닿는 곳에 있어야 한다. */}
      <form
        onSubmit={add}
        className={composing ? 'task-compose' : 'task-compose wide-only-flex'}
      >
        <TextInput
          label="작업"
          isLabelHidden
          value={title}
          onChange={setTitle}
          placeholder="작업 추가"
        />
        <Button type="submit" label="추가" isIconOnly icon={<Plus />} variant="primary" />
      </form>
      {open ? (
        <TaskDetailPanel
          task={open}
          today={today}
          onClose={closePanel}
          onChanged={async () => {
            await router.invalidate();
          }}
        />
      ) : null}
    </section>
  );
}
