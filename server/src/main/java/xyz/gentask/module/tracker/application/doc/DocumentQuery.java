package xyz.gentask.module.tracker.application.doc;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import xyz.gentask.module.tracker.application.doc.DocumentViews.DocumentSummary;
import xyz.gentask.module.tracker.application.doc.DocumentViews.DocumentView;

public interface DocumentQuery {

    List<DocumentSummary> findAll(UUID projectId);

    Optional<DocumentView> findOne(UUID projectId, UUID documentId);
}
