package xyz.gentask.module.project;

import java.util.UUID;

/** 프로젝트 접근 권한을 확인하고 내부 식별자를 반환한다. */
public interface ProjectAccessIn {
    UUID requireAccess(UUID userId, String projectId);
}
