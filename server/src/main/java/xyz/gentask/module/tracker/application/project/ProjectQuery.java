package xyz.gentask.module.tracker.application.project;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import xyz.gentask.module.tracker.application.project.ProjectViews.ProjectView;

public interface ProjectQuery {

    List<ProjectView> findAll(UUID ownerId);

    Optional<ProjectView> findOne(UUID ownerId, String publicId);
}
