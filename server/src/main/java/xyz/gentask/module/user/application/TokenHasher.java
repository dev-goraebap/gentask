package xyz.gentask.module.user.application;

public interface TokenHasher {

    enum Purpose {
        SESSION("session"),
        API_TOKEN("api_token"),
        // 같은 여섯 자리가 가입과 재설정에서 서로 다른 해시를 내도록 자리마다 나눈다. 근거는 결정-0012.
        SIGNUP_CODE("signup_code"),
        PASSWORD_RESET_CODE("password_reset_code");

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
