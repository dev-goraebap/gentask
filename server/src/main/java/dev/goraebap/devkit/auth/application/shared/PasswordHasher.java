package dev.goraebap.devkit.auth.application.shared;

/** 비밀번호 해시 포트. 구현은 bcrypt (AUTH-01). */
public interface PasswordHasher {

    String hash(String rawPassword);

    boolean matches(String rawPassword, String passwordHash);
}
