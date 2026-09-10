import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@astryxdesign/core';
import { get } from '@/shared/api';
import { assignTask, changeTaskState, editTask, scheduleTask, type Task } from '../api/tasks';

type Field = 'title' | 'note' | 'dueDate' | 'scheduledDate' | 'state' | 'assigneeId';
type TextField = 'title' | 'note';
type Update = { [K in Field]: { field: K; value: Task[K] } }[Field];

export function useTaskAutosave(task: Task) {
  const client = useQueryClient();
  const toast = useToast();
  const [draft, setDraft] = useState<Partial<Pick<Task, Field>>>({});
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const timers = useRef<Partial<Record<TextField, ReturnType<typeof setTimeout>>>>({});
  const pending = useRef<Partial<Record<TextField, string>>>({});
  const mounted = useRef(true);
  const mutation = useMutation({
    scope: { id: `task-autosave:${task.id}` },
    mutationFn: async (update: Update) => {
      if (update.field === 'state') return changeTaskState(task.id, update.value);
      if (update.field === 'assigneeId') return assignTask(task.id, update.value);
      const current = await get<Task>('/tasks/' + task.id);
      if (update.field === 'scheduledDate' || update.field === 'dueDate') {
        return scheduleTask(task.id, {scheduledDate: current.scheduledDate, dueDate: current.dueDate, [update.field]: update.value});
      }
      return editTask(task.id, {
        title: current.title, note: current.note, dueDate: current.dueDate, remindAt: current.remindAt,
        [update.field]: update.field === 'title' ? update.value?.trim() : update.value,
      });
    },
    onSuccess: async (_data, update) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['tasks', 'detail', task.id] }),
        client.invalidateQueries({ queryKey: ['tasks', 'list'] }),
      ]);
      if (!mounted.current) return;
      setDraft(previous => {
        if (previous[update.field] !== update.value) return previous;
        const next = { ...previous }; delete next[update.field]; return next;
      });
      setErrors(previous => { const next = { ...previous }; delete next[update.field]; return next; });
    },
    onError: (error, update) => {
      if (mounted.current) setErrors(previous => ({ ...previous, [update.field]: error.message }));
      toast({ type: 'error', body: `변경 내용을 저장하지 못했습니다. ${error.message}` });
    },
  });
  const mutate = mutation.mutate;
  const flush = (field: TextField) => {
    clearTimeout(timers.current[field]); delete timers.current[field];
    const value = pending.current[field]; delete pending.current[field];
    if (value !== undefined && (field !== 'title' || value.trim())) mutate({ field, value });
  };
  const changeText = (field: TextField, value: string, composing = false) => {
    setDraft(previous => ({ ...previous, [field]: value }));
    clearTimeout(timers.current[field]);
    pending.current[field] = value;
    if (!composing) timers.current[field] = setTimeout(() => flush(field), 500);
  };
  const change = async (update: Update) => {
    setDraft(previous => ({ ...previous, [update.field]: update.value }));
    await mutation.mutateAsync(update).catch(() => undefined);
  };
  const retry = () => {
    for (const field of Object.keys(errors) as Field[]) {
      const value = draft[field];
      if (value !== undefined && (field !== 'title' || String(value).trim())) mutate({ field, value } as Update);
    }
  };
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      for (const field of ['title', 'note'] as const) {
        clearTimeout(timers.current[field]);
        const value = pending.current[field]; delete pending.current[field];
        if (value !== undefined && (field !== 'title' || value.trim())) mutate({ field, value });
      }
    };
  }, [mutate]);
  const dirty = Object.keys(draft).length > 0;
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);
  const values = { ...task, ...draft };
  const status = (field: Field) => {
    const message = field === 'title' && !values.title.trim() ? '작업 제목을 입력해 주세요.' : errors[field];
    return message ? { type: 'error' as const, message } : undefined;
  };
  return { values, changeText, change, flush, status, retry, hasErrors: Object.keys(errors).length > 0, isPending: mutation.isPending, dirty };
}
