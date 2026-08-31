package xyz.gentask.module.notification.application;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import xyz.gentask.shared.error.ErrorCode;

@Getter
@RequiredArgsConstructor
public enum NotificationErrorCode implements ErrorCode {
    // 서버에 VAPID 키가 없으면 구독을 받아도 보낼 수 없다. 설정 결함이며 요청의 잘못이 아니다
    PUSH_NOT_CONFIGURED(HttpStatus.SERVICE_UNAVAILABLE, "알림을 보낼 수 없는 상태입니다"),

    PUSH_SUBSCRIPTION_LIMIT_EXCEEDED(HttpStatus.BAD_REQUEST, "등록할 수 있는 기기 수를 넘었습니다"),

    PUSH_FAILURE_NOT_FOUND(HttpStatus.NOT_FOUND, "그 알림 문제를 찾을 수 없습니다");

    private final HttpStatus status;
    private final String message;
}
