package xyz.gentask.module.tracker.application.doc;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import xyz.gentask.module.tracker.application.doc.DocumentViews.DocumentSummary;
import xyz.gentask.module.tracker.application.doc.DocumentViews.DocumentView;
import xyz.gentask.module.tracker.application.doc.DocumentViews.RevisionSummary;
import xyz.gentask.module.tracker.application.doc.DocumentViews.RevisionView;

public interface DocumentQuery {

    List<DocumentSummary> findAll(UUID projectId);

    Optional<DocumentView> findOne(UUID projectId, UUID documentId);

    /**
     * 개정 이력 한 쪽. 최근 것부터 낸다(DOC-004).
     *
     * <p>프로젝트를 함께 받아 남의 것과 지워진 것을 그 자리에서 걸러 낸다(DOC-004 A4 · A5).
     */
    List<RevisionSummary> findRevisions(UUID projectId, UUID documentId, int limit, int offset);

    /** 이 문서의 개정 수. 지워졌거나 남의 것이면 0 이다. */
    long countRevisions(UUID projectId, UUID documentId);

    /** 개정 하나. 그때의 제목과 본문을 낸다(DOC-004). */
    Optional<RevisionView> findRevision(UUID projectId, UUID documentId, int revisionNo);
}
