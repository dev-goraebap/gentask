import {
  AlertDialog,
  Button,
  CheckboxInput,
  DateInput,
  Text,
  TextArea,
  TextInput,
  useToast,
} from '@astryxdesign/core';
import { Star, Sun, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, type TaskView } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';

interface TaskDetailPanelProps {
  readonly task: TaskView;
  readonly today: string;
  readonly onClose: () => void;
  readonly onChanged: () => Promise<void>;
}

type ISODate = `${number}${number}${number}${number}-${number}${number}-${number}${number}`;

function asISODate(value: string | null): ISODate | undefined {
  return value === null ? undefined : (value as ISODate);
}

/**
 * 할 일 하나를 펼치는 곁자리.
 *
 * 넓은 화면에서는 오른쪽에 서고 좁은 화면에서는 화면을 덮는다. 목록과 나란히 두면 좁은 화면에서
 * 둘 다 좁아져 어느 쪽도 읽히지 않는다.
 */
export function TaskDetailPanel({ task, today, onClose, onChanged }: TaskDetailPanelProps) {
  const [title, setTitle] = useState(task.title);
  const [note, setNote] = useState(task.note);
  const [confirming, setConfirming] = useState(false);
  const showToast = useToast();

  // 다른 할 일을 열면 적고 있던 것이 아니라 그 할 일의 값을 보여야 한다.
  useEffect(() => {
    setTitle(task.title);
    setNote(task.note);
  }, [task.id, task.title, task.note]);

  const patch = async (body: Record<string, unknown>) => {
    await api.patch(ENDPOINTS.task(task.id), body);
    await onChanged();
  };

  const inMyDay = task.myDayOn === today;

  return (
    <aside className="task-panel" aria-label="작업 상세">
      <div className="panel-head">
        <Button
          label="목록으로 돌아가기"
          isIconOnly
          icon={<X />}
          variant="ghost"
          size="sm"
          onClick={onClose}
        />
      </div>

      <div className="panel-row">
        <CheckboxInput
          label="완료"
          isLabelHidden
          value={task.completedAt !== null}
          onChange={(checked) =>
            void api
              .patch(ENDPOINTS.taskCompletion(task.id), { completed: checked })
              .then(onChanged)
          }
        />
        <TextInput
          label="제목"
          isLabelHidden
          value={title}
          onChange={setTitle}
          changeAction={async (next) => {
            if (next.trim() && next !== task.title) await patch({ title: next.trim() });
          }}
        />
        <Button
          label="중요로 표시"
          isIconOnly
          icon={<Star className={task.important ? 'filled' : undefined} />}
          variant={task.important ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() =>
            void api
              .patch(ENDPOINTS.taskImportance(task.id), { important: !task.important })
              .then(onChanged)
          }
        />
      </div>

      <Button
        label={inMyDay ? '나의 하루에서 빼기' : '나의 하루에 추가'}
        icon={<Sun />}
        variant={inMyDay ? 'secondary' : 'ghost'}
        onClick={() =>
          void api
            .patch(ENDPOINTS.taskMyDay(task.id), { myDayOn: inMyDay ? null : today })
            .then(onChanged)
        }
      />

      <div className="panel-field">
        <DateInput
          label="기한"
          value={asISODate(task.dueDate)}
          onChange={(next) => void patch({ dueDate: next ?? null })}
          isOptional
        />
        {task.dueDate ? (
          <Button
            label="기한 지우기"
            variant="ghost"
            size="sm"
            onClick={() => void patch({ dueDate: null })}
          />
        ) : null}
      </div>

      <TextArea
        label="메모"
        value={note}
        onChange={setNote}
        rows={6}
        placeholder="메모 추가"
        changeAction={async (next) => {
          if (next !== task.note) await patch({ note: next });
        }}
      />

      <Text as="p" type="supporting" color="secondary">
        {task.completedAt
          ? `${task.completedAt.slice(0, 10)} 에 완료했습니다`
          : '아직 완료하지 않았습니다'}
      </Text>

      <div className="panel-foot">
        <Button
          label="작업 삭제"
          variant="destructive"
          onClick={() => setConfirming(true)}
        />
      </div>

      <AlertDialog
        isOpen={confirming}
        onOpenChange={setConfirming}
        title="이 작업을 지웁니다"
        description="지운 작업은 되돌릴 수 없습니다."
        actionLabel="삭제"
        actionVariant="destructive"
        onAction={() => {
          void api.delete(ENDPOINTS.task(task.id)).then(async () => {
            setConfirming(false);
            onClose();
            await onChanged();
            showToast({ body: '작업을 지웠습니다' });
          });
        }}
      />
    </aside>
  );
}
