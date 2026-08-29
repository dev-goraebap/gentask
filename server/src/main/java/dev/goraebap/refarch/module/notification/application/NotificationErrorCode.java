package dev.goraebap.refarch.module.notification.application;

import dev.goraebap.refarch.shared.error.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum NotificationErrorCode implements ErrorCode {
    // 서버에 VAPID 키가 없으면 구독을 받아도 보낼 수 없다. 설정 결함이며 요청의 잘못이 아니다
    PUSH_NOT_CONFIGURED(HttpStatus.SERVICE_UNAVAILABLE, "알림을 보낼 수 없는 상태입니다"),

    PUSH_SUBSCRIPTION_LIMIT_EXCEEDED(HttpStatus.BAD_REQUEST, "등록할 수 있는 기기 수를 넘었습니다");

    private final HttpStatus status;
    private final String message;
}
