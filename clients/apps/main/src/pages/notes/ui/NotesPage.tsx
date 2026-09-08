import { PageLayout, PageContent, PageHeader } from "@/shared/ui/page-layout";
import { WIDTH } from "@/shared/config";
import { MOBILE_QUERY } from "@/shared/ui/mobile";
import { RequestState } from "@/shared/ui/request-state";
import { useWorkspaceStore } from "@/entities/workspace";
import {
  Button,
  EmptyState,
  HStack,
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
import { NotesMenu } from "./NotesMenu";
import "./notes.css";
export function NotesPage({
  selectedId,
  onSelect,
  onClose,
  projectId,
  q,
  onFilter,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  projectId?: string;
  q: string;
  onFilter: (project: string | undefined, q: string) => void;
}) {
  const mobile = useMediaQuery(MOBILE_QUERY);
  const { projects } = useWorkspaceStore();
  const query = useInfiniteQuery(notesOptions(projectId, q));
  const [search, setSearch] = useState(q);
  const [announcement, setAnnouncement] = useState("");
  const [viewport, setViewport] = useState<number>();
  useEffect(() => {
    setSearch(q);
  }, [q]);
  useEffect(() => {
    if (search.trim() === q) return;
    const timer = window.setTimeout(() => onFilter(projectId, search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search, q, projectId, onFilter]);
  useEffect(() => {
    if (!mobile) return;
    const visual = window.visualViewport;
    const resize = () => setViewport(visual?.height ?? window.innerHeight);
    resize();
    visual?.addEventListener("resize", resize);
    return () => visual?.removeEventListener("resize", resize);
  }, [mobile]);
  const notes = query.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <>
      <PageLayout
        padding={0}
        height="fill"
        contentWidth={WIDTH.wide}
        style={
          mobile && viewport
            ? { height: viewport, maxHeight: viewport }
            : undefined
        }
        header={<>
          <PageHeader
            title="메모"
            description="떠오른 생각부터 사진과 자료까지 편하게 남겨보세요."
            compact={mobile}
            actions={mobile ? <NotesMenu /> : undefined}
          />
          <Toolbar className="page-filter-toolbar" label="메모 필터" size="sm"
            startContent={
              <HStack
                gap={1}
                wrap="wrap"
              >
                <TextInput
                  label="메모 검색"
                  isLabelHidden
                  placeholder="메모 검색"
                  value={search}
                  onChange={setSearch}
                  hasClear
                  width={mobile ? "100%" : 280}
                />
                <Selector
                  label="프로젝트별 메모"
                  isLabelHidden
                  size="sm"
                  variant="ghost"
                  value={projectId ?? ""}
                  options={[
                    { value: "", label: "모든 메모" },
                    ...projects.map((p) => ({ value: p.id, label: p.name })),
                  ]}
                  onChange={(value) =>
                    onFilter(value || undefined, search.trim())
                  }
                />
              </HStack>
            } />
        </>}
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
                  variant="ghost"
                  isLoading={query.isFetchingNextPage}
                  onClick={() => void query.fetchNextPage()}
                />
              ) : null}
            </VStack>
          </PageContent>
        }
        footer={
          <LayoutFooter padding={mobile ? 2 : 3}>
            <NoteComposer
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
