package xyz.gentask.module.note.application;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.module.file.AttachmentSlot;
import xyz.gentask.module.file.AttachmentView;
import xyz.gentask.module.file.Attachments;
import xyz.gentask.module.note.application.NoteStore.NoteRecord;
import xyz.gentask.module.note.application.NoteViews.NotePage;
import xyz.gentask.module.note.application.NoteViews.NoteView;
import xyz.gentask.module.project.ProjectAccessIn;
import xyz.gentask.shared.domain.NanoId;

@Service
@RequiredArgsConstructor
public class NoteService {
    private final NoteStore store;
    private final ProjectAccessIn projects;
    private final Attachments attachments;
    private final Clock clock;
    private static final AttachmentSlot SLOT = AttachmentSlot.NOTE_FILES;

    @Transactional
    public String create(UUID userId, NoteRequests.CreateNote request) {
        if (request.projectId() != null) projects.requireAccess(userId, request.projectId());
        var keys = request.objectKeys();
        requireContent(request.body(), keys.size());
        String id = NanoId.create(
                value -> value,
                value -> store.insert(value, userId, request.projectId(), request.body(), clock.instant()));
        for (String key : keys) attachments.attach(SLOT, fileOwner(id), userId, key);
        return id;
    }

    @Transactional(readOnly = true)
    public NotePage list(UUID userId, String projectId, String search, int offset) {
        if (projectId != null) projects.requireAccess(userId, projectId);
        var rows = store.list(userId, projectId, search, offset, 31);
        return new NotePage(rows.stream().limit(30).map(this::view).toList(), rows.size() > 30 ? offset + 30 : null);
    }

    @Transactional(readOnly = true)
    public NoteView detail(UUID userId, String id) {
        var note = find(id, false);
        if (!note.ownerId().equals(userId)) {
            if (!note.shared() || note.projectId() == null) throw NoteErrorCode.NOTE_NOT_FOUND.raise();
            projects.requireAccess(userId, note.projectId());
        }
        return view(note);
    }

    @Transactional
    public void edit(UUID userId, String id, String body) {
        var note = own(userId, id);
        if (note.shared()) projects.requireWrite(userId, note.projectId());
        requireContent(body, attachments.list(SLOT, fileOwner(id)).size());
        store.edit(id, body, clock.instant());
    }

    @Transactional
    public void connect(UUID userId, String id, String projectId) {
        var note = own(userId, id);
        if (Objects.equals(note.projectId(), projectId)) return;
        if (projectId != null) projects.requireAccess(userId, projectId);
        store.connect(id, projectId, clock.instant());
    }

    @Transactional
    public void share(UUID userId, String id, boolean shared) {
        var note = own(userId, id);
        if (shared) {
            if (note.projectId() == null) throw NoteErrorCode.NOTE_PROJECT_REQUIRED.raise();
            projects.requireWrite(userId, note.projectId());
        }
        store.share(id, shared, clock.instant());
    }

    @Transactional
    public void delete(UUID userId, String id) {
        own(userId, id);
        attachments.detachAll(SLOT, fileOwner(id));
        store.delete(id);
    }

    @Transactional
    public AttachmentView attach(UUID userId, String id, String objectKey) {
        var note = own(userId, id);
        if (note.shared()) projects.requireWrite(userId, note.projectId());
        var file = attachments.attach(SLOT, fileOwner(id), userId, objectKey);
        store.edit(id, note.body(), clock.instant());
        return file;
    }

    @Transactional
    public void detach(UUID userId, String id, UUID fileId) {
        var note = own(userId, id);
        if (note.shared()) projects.requireWrite(userId, note.projectId());
        var files = attachments.list(SLOT, fileOwner(id));
        requireContent(note.body(), files.size() - 1);
        attachments.detach(SLOT, fileOwner(id), fileId);
        store.edit(id, note.body(), clock.instant());
    }

    private NoteRecord find(String id, boolean lock) {
        return store.find(id, lock).orElseThrow(NoteErrorCode.NOTE_NOT_FOUND::raise);
    }

    private NoteRecord own(UUID userId, String id) {
        var note = find(id, true);
        if (!note.ownerId().equals(userId)) throw NoteErrorCode.NOTE_OWNER_REQUIRED.raise();
        return note;
    }

    private NoteView view(NoteRecord note) {
        return new NoteView(
                note.id(),
                note.body(),
                note.projectId(),
                note.projectName(),
                note.shared(),
                note.ownerId(),
                note.authorName(),
                note.createdAt(),
                note.updatedAt(),
                attachments.list(SLOT, fileOwner(note.id())));
    }

    private static void requireContent(String body, int fileCount) {
        if (body.isBlank() && fileCount == 0) throw NoteErrorCode.NOTE_CONTENT_REQUIRED.raise();
    }
    // 메모의 NanoID를 기존 UUID 첨부 그룹 계약에 연결한다. 외부 식별자는 NanoID를 그대로 사용한다.
    private static UUID fileOwner(String id) {
        return UUID.nameUUIDFromBytes(("gentask:note:" + id).getBytes(StandardCharsets.UTF_8));
    }
}
