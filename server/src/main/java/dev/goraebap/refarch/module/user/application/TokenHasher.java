package dev.goraebap.refarch.module.user.application;

/**
 * 토큰 저장용 해시 포트. bcrypt 가 아니라 결정적 해시(HMAC)여야 한다 —
 * 조회가 `where token_hash = ?` 인덱스 접근이기 때문이다.
 */
public interface TokenHasher {

    /** 용도 라벨을 섞어 세션 해시와 에이전트 토큰 해시가 서로의 자리에 쓰이지 못하게 한다. */
    enum Purpose {
        SESSION("session"),
        API_TOKEN("api_token");

        private final String label;

        Purpose(String label) {
            this.label = label;
        }

        public String label() {
            return label;
        }
    }

    String hmac(Purpose purpose, String token);
}
