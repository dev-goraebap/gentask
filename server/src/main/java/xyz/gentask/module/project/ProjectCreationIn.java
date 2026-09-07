package xyz.gentask.module.project;

import java.util.UUID;

/** 회원 가입 시 기본 프로젝트를 생성하는 공개 계약이다. */
public interface ProjectCreationIn {

    /** 프로젝트를 생성하고 URL에서 사용하는 식별자를 반환한다. */
    String create(UUID ownerId, String name, String key);
}
