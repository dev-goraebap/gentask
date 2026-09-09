import { NoteOrganizationFilters } from './NoteOrganizationFilters';
import { FilterIndicator } from '@/shared/ui/listing';
import { useNoteInfiniteScroll } from '../model/useNoteInfiniteScroll';
import { NoteListLoading } from './NoteListLoading';
import { PageState as EmptyState } from '@/shared/ui/page-state';
import { PageLayout, PageContent, PageHeader } from "@/shared/ui/page-layout";
import { WIDTH } from "@/shared/config";
import { MobileFilterBar, MOBILE_QUERY } from "@/shared/ui/mobile";
import { RequestState } from "@/shared/ui/request-state";
import {
  LayoutFooter,
  Selector,
  Text,
  TextInput,
  Toolbar,
  VStack,
} from '@astryxdesign/core';
import { useMediaQuery } from "@astryxdesign/core/hooks";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  onSort, archive, tag, onOrganization,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  projectId?: string;
  personal?: boolean;
  q: string;
  sort: string;
  archive: string; tag: string; onOrganization: (archive:string,tag:string)=>void;
  onSort: (value: string) => void;
  onFilter: (project: string | undefined, q: string) => void;
}) {
  const mobile = useMediaQuery(MOBILE_QUERY);
  const query = useInfiniteQuery(notesOptions(projectId, q, personal, sort, archive, tag));
  const contentRef = useRef<HTMLDivElement>(null);
  const loadMore = useCallback(() => query.fetchNextPage({ cancelRefetch: false }), [query.fetchNextPage]);
  const sentinel = useNoteInfiniteScroll({ root: contentRef,
    enabled: Boolean(query.hasNextPage && !query.isFetching && !query.isError && !selectedId), loadMore });
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
  const notes = useMemo(() => Array.from(new Map(
    (query.data?.pages.flatMap(page => page.items) ?? []).map(note => [note.id, note])
  ).values()), [query.data]);
  const organization = <NoteOrganizationFilters archive={archive} tag={tag} onChange={onOrganization} />;
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
            query={search} onQueryChange={setSearch} leadingContent={<FilterIndicator />} actions={<>{organization}{sortControl}</>} /> :
            <Toolbar className="page-filter-toolbar" label="메모 필터" size="sm" endContent={sortControl}
              startContent={<><FilterIndicator /><TextInput label="메모 검색" isLabelHidden placeholder="메모 검색"
                value={search} onChange={setSearch} hasClear width="17.5rem" />{organization}</>} />}
          />}
        content={
          <PageContent ref={contentRef} padding={mobile ? 2 : 4}>
            <VStack gap={3}>

              {query.isRefetchError && !query.isFetchNextPageError ? <RequestState error={query.error} retry={() => void query.refetch()} /> : null}
              {query.isPending ? (
                <RequestState />
              ) : query.isError && !query.data ? (
                <RequestState
                  error={query.error}
                  retry={() => void query.refetch()}
                />
              ) : notes.length ? (
                <NoteMasonry notes={notes} onSelect={onSelect} />
              ) : (
                <EmptyState kind={q ? 'search' : 'empty'}
                  title={
                    q || projectId || tag || archive !== "active"
                      ? "표시할 메모가 없습니다"
                      : "생각이 떠오르면, 여기에"
                  }
                  description={
                    q || projectId
                      ? "검색어, 태그 또는 보관 필터를 바꿔보세요."
                      : "짧은 생각부터 사진과 자료까지 편하게 남겨보세요."
                  }
                />
              )}
              {notes.length > 0 || query.hasNextPage ? <VStack ref={sentinel} gap={0}>
                <NoteListLoading fetching={query.isFetchingNextPage} failed={query.isFetchNextPageError}
                  complete={!query.hasNextPage && !query.isFetching && !query.isError}
                  retry={() => { void loadMore(); }} />
              </VStack> : null}
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
