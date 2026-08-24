package dev.goraebap.refarch.module.user.application;

/** 비밀번호 해싱 포트. 구현이 어떤 라이브러리를 쓰는지 애플리케이션이 모르게 한다. */
public interface PasswordHasher {

    String hash(String rawPassword);

    boolean matches(String rawPassword, String passwordHash);
}
