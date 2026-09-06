import { MobilePageHeader } from '@/shared/ui/mobile';
import { filterByView, isCompleted, splitByCompletion, TASK_VIEWS, useTaskStore, type TaskViewKey } from '@/entities/task';
import { TITLE_PAD_TOP, TITLE_ROW, TODAY, WIDTH } from '@/shared/config';
import {
    HgiCancel,
    HgiCheckCircle,
    HgiPlus
} from '@/shared/ui/icons';
import { MOBILE_QUERY } from '@/shared/ui/mobile';
import {
    Badge,
    Button,
    Collapsible,
    Dialog,
    EmptyState,
    Heading,
    HStack,
    Layout,
    LayoutContent,
    LayoutFooter,
    LayoutHeader,
    List,
    Tab,
    TabList,
    Text,
    TextInput,
    VStack
} from '@astryxdesign/core';
import { useMediaQuery } from '@astryxdesign/core/hooks';
import { useState } from 'react';
import { TaskDetail } from './TaskDetail';
import { TaskRow } from './TaskRow';
import { DRAWER_WIDTH, type TasksProps } from './tasks';
import { ViewIcon } from './ViewIcon';

export function TasksPage({ view, taskId, onViewChange, onSelect }: TasksProps) {
  const mobile = useMediaQuery(MOBILE_QUERY);
  const { tasks, addTask, patchTask, toggleTaskDone } = useTaskStore();
  const [draft, setDraft] = useState('');

  const inView = filterByView(tasks, view, TODAY);
  const { active, completed } = splitByCompletion(inView);
  const selected = tasks.find((t) => t.id === taskId) ?? null;

  const add = () => {
    const title = draft.trim();
    if (!title) return;
    addTask(title);
    setDraft('');
  };

  return (
    <>
    <Layout
      padding={0}
      height="fill"
      contentWidth={WIDTH.narrow}
      header={
        <>
          {mobile ? <MobilePageHeader title="작업" /> : <LayoutHeader hasDivider={false}>
            <VStack gap={2}>
            <HStack
              justify="between"
              align="center"
              width="100%"
              height={mobile ? undefined : TITLE_ROW}
              paddingBlock={mobile ? 2 : undefined} paddingBlockStart={mobile ? 2 : TITLE_PAD_TOP}
              paddingInline={mobile ? 3 : 4}
              gap={3}
            >
              <Heading level={1}>작업</Heading>
              <Text type="supporting">
                남은 {active.length} · 완료 {completed.length}
              </Text>
            </HStack>
              <VStack paddingInline={mobile ? 3 : 4}>
                <Text color="secondary">개인 작업을 정리하고 일정과 진행 상황을 확인합니다.</Text>
              </VStack>
            </VStack>
          </LayoutHeader>}

          {/* 탭의 밑줄이 곧 머리글의 경계선이 되도록 rail 을 TabList 가 그린다. */}
          <LayoutHeader hasDivider={false}>
            <TabList
              value={view}
              onChange={(v) => onViewChange(v as TaskViewKey)}
              size="md"
              hasDivider
              /*
               * 패딩은 테두리 안쪽이므로 탭만 본문 선으로 밀리고 rail 은 칸 폭을 그대로
               * 지킨다. TabList 에 패딩 prop 이 없어 토큰으로 지정한다.
               */
              style={{ paddingInline: 'var(--spacing-4)' }}
            >
              {TASK_VIEWS.map((v) => (
                <Tab
                  key={v.value}
                  value={v.value}
                  label={v.label}
                  icon={<ViewIcon view={v.value} />}
                  endContent={
                    <Badge label={`${filterByView(tasks, v.value, TODAY).filter((t) => !isCompleted(t)).length}`} />
                  }
                />
              ))}
            </TabList>
          </LayoutHeader>
        </>
      }
      footer={
        <LayoutFooter hasDivider>
          {/* 생성 자리는 바닥에 고정한다. 목록이 길어져도 늘 닿는다. */}
          <HStack gap={2} align="center" width="100%" padding={3}>
            <TextInput
              label="작업 추가"
              isLabelHidden
              value={draft}
              onChange={setDraft}
              onEnter={add}
              placeholder="작업을 적고 Enter"
              startIcon={<HgiPlus />}
              width="100%"
            />
            <Button label="추가" variant="primary" onClick={add} isDisabled={!draft.trim()} />
          </HStack>
        </LayoutFooter>
      }
    >
      <LayoutContent padding={mobile ? 3 : 4}>
        {mobile ? <VStack gap={2}><Text color="secondary">개인 작업을 정리하고 일정과 진행 상황을 확인합니다.</Text><Text type="supporting">남은 {active.length} · 완료 {completed.length}</Text></VStack> : null}
        {inView.length === 0 ? (
          <EmptyState
            icon={<HgiCheckCircle />}
            title="비어 있습니다"
            description="아래에서 작업을 추가하세요."
          />
        ) : (
          <VStack gap={4}>
            <List hasDividers style={{ marginInline: 'calc(-1 * var(--spacing-2))' }}>
              {active.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  isSelected={task.id === taskId}
                  onToggle={() => toggleTaskDone(task.id)}
                  onOpen={() => onSelect(task.id)}
                  onStar={() => patchTask(task.id, { important: !task.important })}
                />
              ))}
            </List>

            {completed.length > 0 ? (
              <Collapsible trigger={<Text type="supporting">완료 {completed.length}</Text>}>
                <List hasDividers style={{ marginInline: 'calc(-1 * var(--spacing-2))' }}>
                  {completed.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      isSelected={task.id === taskId}
                      onToggle={() => toggleTaskDone(task.id)}
                      onOpen={() => onSelect(task.id)}
                      onStar={() => patchTask(task.id, { important: !task.important })}
                    />
                  ))}
                </List>
              </Collapsible>
            ) : null}
          </VStack>
        )}
      </LayoutContent>
    </Layout>

      {/*
        * 상세는 화면 오른쪽 가장자리에 붙는 전체 높이 드로어로 연다. Dialog 를 가장자리로
        * 밀고 높이를 채우면 별도 컴포넌트 없이 같은 모양이 된다.
        */}
      <Dialog
        isOpen={selected !== null}
        onOpenChange={(open) => {
          if (!open) onSelect(null);
        }}
        purpose="info"
        variant={mobile ? 'fullscreen' : 'standard'}
        width={DRAWER_WIDTH}
        maxHeight="100dvh"
        position={mobile ? undefined : { top: 0, bottom: 0, end: 0 }}
        padding={0}
        /*
         * dialog 요소는 기본 높이가 내용에 맞춰지므로 top/bottom 을 0 으로 두어도 늘어나지
         * 않는다. 높이를 직접 지정한다. 구조 치수는 토큰이 아니라 값으로 둔다.
         */
        style={{ borderRadius: 0, height: '100dvh' }}
      >
        {selected ? (
          <Layout height="fill" padding={0}>
            <LayoutHeader hasDivider padding={mobile ? 0 : undefined}>
              {/*
                * DialogHeader 는 자체 인셋을 겹쳐 쌓아 본문과 선이 어긋난다. 머리글을 직접
                * 그리고 본문과 같은 값을 준다.
                */}
              <HStack
                justify="between"
                align="center"
                width="100%"
                gap={2}
                paddingBlock={3}
                paddingInline={mobile ? 3 : 4}
              >
                <Text weight="semibold">{selected.title}</Text>
                <Button
                  label="닫기"
                  isIconOnly
                  icon={<HgiCancel />}
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelect(null)}
                />
              </HStack>
            </LayoutHeader>
            <LayoutContent padding={mobile ? 3 : 4}>
              <TaskDetail
                task={selected}
                onPatch={(patch) => patchTask(selected.id, patch)}
              />
            </LayoutContent>
          </Layout>
        ) : null}
      </Dialog>
    </>
  );
}
