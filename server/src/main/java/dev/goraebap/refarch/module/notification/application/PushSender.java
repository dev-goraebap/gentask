package dev.goraebap.refarch.module.notification.application;

import dev.goraebap.refarch.module.notification.domain.subscription.PushSubscription;

/**
 * 알림을 실제로 내보내는 포트. 구현은 인프라가 갖는다.
 *
 * <p>보내는 것과 그 결과를 다루는 것을 가른다. 푸시 서비스가 자리가 죽었다고 답하면 그 자리를 걷어야
 * 하는데, 그 판단은 도메인 규칙이므로 여기서 결과만 받아 서비스가 판정한다.
 */
public interface PushSender {

    enum Result {
        /** 푸시 서비스가 받았다. 실제로 표시되는지는 알 수 없다 */
        SENT,
        /** 그 자리가 더 이상 유효하지 않다. 걷어야 한다 */
        GONE,
        /** 일시적 실패. 다음 회차에 다시 시도한다 */
        FAILED
    }

    /**
     * 결과와 그 사유.
     *
     * <p>사유를 함께 내는 것은 관리 화면이 "왜 못 갔는가"에 답해야 하기 때문이다. 결과만으로는 상태
     * 코드가 무엇이었는지도, 어떤 예외였는지도 남지 않는다.
     *
     * @param detail 사람이 읽을 짧은 설명. 성공이면 없다
     */
    record Outcome(Result result, String detail) {

        public static Outcome sent() {
            return new Outcome(Result.SENT, null);
        }

        public static Outcome gone(String detail) {
            return new Outcome(Result.GONE, detail);
        }

        public static Outcome failed(String detail) {
            return new Outcome(Result.FAILED, detail);
        }

        public boolean isSent() {
            return result == Result.SENT;
        }
    }

    Outcome send(PushSubscription subscription, String payload);
}
