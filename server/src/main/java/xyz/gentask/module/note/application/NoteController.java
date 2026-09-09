package xyz.gentask.module.note.application;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.net.URI;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import xyz.gentask.module.file.AttachmentView;
import xyz.gentask.shared.web.CurrentUser;

@RestController
@RequestMapping("/api/v1/notes")
@RequiredArgsConstructor
public class NoteController {
    private final NoteService notes;

    @GetMapping
    public NoteViews.NotePage list(
            @CurrentUser UUID userId,
            @RequestParam(required = false) String projectId,
            @RequestParam(required = false) String scope,
            @RequestParam(defaultValue = "") @Size(max = 200) String q,
            @RequestParam(defaultValue = "created-desc") String sort,
            @RequestParam(defaultValue = "0") @Min(0) @Max(100000) int offset) {
        return notes.list(userId, projectId, scope, q, offset, sort);
    }

    @PostMapping
    public ResponseEntity<Void> create(@CurrentUser UUID userId, @Valid @RequestBody NoteRequests.CreateNote request) {
        return ResponseEntity.created(URI.create("/api/v1/notes/" + notes.create(userId, request)))
                .build();
    }

    @GetMapping("/{id}")
    public NoteViews.NoteView detail(@CurrentUser UUID userId, @PathVariable String id) {
        return notes.detail(userId, id);
    }

    @PatchMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void edit(
            @CurrentUser UUID userId, @PathVariable String id, @Valid @RequestBody NoteRequests.EditNote request) {
        notes.edit(userId, id, request.body());
    }

    @PutMapping("/{id}/project")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void connect(
            @CurrentUser UUID userId, @PathVariable String id, @Valid @RequestBody NoteRequests.ConnectNote request) {
        notes.connect(userId, id, request.projectId());
    }

    @PutMapping("/{id}/sharing")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void share(
            @CurrentUser UUID userId, @PathVariable String id, @Valid @RequestBody NoteRequests.ShareNote request) {
        notes.share(userId, id, request.shared());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@CurrentUser UUID userId, @PathVariable String id) {
        notes.delete(userId, id);
    }

    @PostMapping("/{id}/files")
    @ResponseStatus(HttpStatus.CREATED)
    public AttachmentView attach(
            @CurrentUser UUID userId,
            @PathVariable String id,
            @Valid @RequestBody NoteRequests.AttachNoteFile request) {
        return notes.attach(userId, id, request.objectKey());
    }

    @DeleteMapping("/{id}/files/{fileId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void detach(@CurrentUser UUID userId, @PathVariable String id, @PathVariable UUID fileId) {
        notes.detach(userId, id, fileId);
    }
}
