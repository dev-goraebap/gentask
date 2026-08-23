package dev.goraebap.refarch.shared.domain;

/**
 * 검증은 정적 팩토리 of 가 하고 정규 생성자는 이미 검증된 값을 받는다. 그 생성자는 저장소가
 * 재구성할 때만 쓰며, 다른 계층에서 부르는 것을 ArchUnit 이 막는다.
 */
public interface ValueObject {}
