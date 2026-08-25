package dev.goraebap.refarch.module.user.application;

public interface TokenHasher {

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
