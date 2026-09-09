import { ScopeSelector } from '@/features/select-resource-scope';
import { PageLayout, PageContent, PageHeader } from "@/shared/ui/page-layout";
import { WIDTH } from "@/shared/config";
import { MobileFilterBar, MOBILE_QUERY } from "@/shared/ui/mobile";
import { RequestState } from "@/shared/ui/request-state";
import {
  Button,
  EmptyState,
  LayoutFooter,
  Selector,
  Text,
  TextInput,
  Toolbar,
  VStack,
} from "@astryxdesign/core";
import { useMediaQuery } from "@astryxdesign/core/hooks";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { notesOptions } from "../api/notes";
import { NoteMasonry } from "./NoteMasonry";
import { NoteComposer } from "./NoteComposer";
import { NoteDetail } from "./NoteDetail";
import "./notes.css";
export function NotesPage({
  selectedId,
  onSelect,
  onClose,
  projectId,
  personal = false,
  q,
  onFilter,
  sort,
  onSort,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  projectId?: string;
  personal?: boolean;
  q: string;
  sort: string;
  onSort: (value: string) => void;
  onFilter: (project: string | undefined, q: string) => void;
}) {
  const mobile = useMediaQuery(MOBILE_QUERY);
  const query = useInfiniteQuery(notesOptions(projectId, q, personal, sort));
  const [search, setSearch] = useState(q);
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    setSearch(q);
  }, [q]);
  useEffect(() => {
    if (search.trim() === q) return;
    const timer = window.setTimeout(() => onFilter(projectId, search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search, q, projectId, onFilter]);
  const notes = query.data?.pages.flatMap((page) => page.items) ?? [];
  const sortControl = <Selector label="메모 정렬" isLabelHidden size="sm" value={sort} onChange={onSort}
    options={[{ value: 'created-desc', label: '최근 작성순' }, { value: 'updated-desc', label: '최근 수정순' }, { value: 'created-asc', label: '오래된 작성순' }]} />;
  return (
    <>
      <PageLayout
        padding={0}
        height="fill"
        contentWidth={WIDTH.wide}
        header={<PageHeader
            title="메모"
            compact={mobile}
            toolbar={mobile ? <MobileFilterBar label="메모 필터" searchLabel="메모 검색" placeholder="메모 검색"
            query={search} onQueryChange={setSearch} leadingContent={<ScopeSelector />} actions={sortControl} /> :
            <Toolbar className="page-filter-toolbar" label="메모 필터" size="sm" endContent={sortControl}
              startContent={<><ScopeSelector /><TextInput label="메모 검색" isLabelHidden placeholder="메모 검색"
                value={search} onChange={setSearch} hasClear width="17.5rem" /></>} />}
          />}
        content={
          <PageContent padding={mobile ? 2 : 4}>
            <VStack gap={3}>

              {query.isPending ? (
                <RequestState />
              ) : query.isError ? (
                <RequestState
                  error={query.error}
                  retry={() => void query.refetch()}
                />
              ) : notes.length ? (
                <NoteMasonry notes={notes} onSelect={onSelect} />
              ) : (
                <EmptyState
                  title={
                    q || projectId
                      ? "표시할 메모가 없습니다"
                      : "생각이 떠오르면, 여기에"
                  }
                  description={
                    q || projectId
                      ? "검색어나 프로젝트를 바꿔보세요."
                      : "짧은 생각부터 사진과 자료까지 편하게 남겨보세요."
                  }
                />
              )}
              {query.hasNextPage ? (
                <Button
                  label="더 보기"
                  variant="secondary"
                  isLoading={query.isFetchingNextPage}
                  onClick={() => void query.fetchNextPage()}
                />
              ) : null}
            </VStack>
          </PageContent>
        }
        footer={
          <LayoutFooter padding={mobile ? 2 : 3} style={mobile ? { paddingBottom: 'calc(var(--spacing-2) + env(safe-area-inset-bottom))' } : undefined}>
            <NoteComposer key={projectId ?? "personal"} initialProjectId={projectId}
              onCreated={() => setAnnouncement("메모를 등록했습니다.")}
            />
            <Text
              role="status"
              aria-live="polite"
              className="note-announcement"
            >
              {announcement}
            </Text>
          </LayoutFooter>
        }
      />
      {selectedId ? (
        <NoteDetail key={selectedId} id={selectedId} onClose={onClose} />
      ) : null}
    </>
  );
}
