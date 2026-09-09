import { NoteImage } from "./NoteImage";
import {
  ClickableCard,
  HStack,
  Markdown,
  Text,
  VStack,
} from "@astryxdesign/core";
import { HgiAttachment } from "@/shared/ui/icons";
import type { Note } from "../api/notes";
export function NoteCard({ note, onOpen }: { note: Note; onOpen: () => void }) {
  const image = note.files.find((file) =>
    /^image\/(png|jpeg|webp|gif|avif)$/.test(file.contentType),
  );
  return (
    <ClickableCard
      label={note.body.slice(0, 70) || note.files[0]?.fileName || "메모 열기"}
      onClick={onOpen}
      padding={3}
      className="note-card"
    >
      <VStack gap={2}>
        {image ? (
          <NoteImage src={image.url} alt={image.fileName} color={image.dominantColor} width={image.width} height={image.height} />
        ) : null}
        {note.body ? (
          <Markdown
            density="compact"
            headingLevelStart={2}
            className="note-card-body"
          >
            {note.body.slice(0, 2500)}
          </Markdown>
        ) : null}
        {note.files.length ? (
          <HStack gap={1} align="center">
            <HgiAttachment size={14} />
            <Text type="supporting" maxLines={1}>
              {note.files.length === 1
                ? note.files[0].fileName
                : "첨부파일 " + note.files.length + "개"}
            </Text>
          </HStack>
        ) : null}
        {note.tags?.length ? <Text type="supporting" color="secondary">{note.tags.map(tag=>"#"+tag).join(" · ")}</Text> : null}
        {note.archived ? <Text type="supporting">보관됨</Text> : null}
        <HStack gap={1} wrap="wrap">
          <Text type="supporting" color="secondary">
            {note.projectName ?? "개인"}
          </Text>
          <Text type="supporting" color="secondary">
            · {note.shared ? "프로젝트 공유" : "나만 보기"}
          </Text>
        </HStack>
        <Text type="supporting" color="secondary">
          {new Date(note.createdAt).toLocaleDateString("ko-KR")} ·{" "}
          {note.authorName}
        </Text>
      </VStack>
    </ClickableCard>
  );
}
