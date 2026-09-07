package xyz.gentask.shared.domain;

import java.security.SecureRandom;

public final class NanoId {
    public static final int LENGTH = 12;
    private static final String ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
    private static final SecureRandom RANDOM = new SecureRandom();

    private NanoId() {}

    public static String generate() {
        StringBuilder result = new StringBuilder(LENGTH);
        for (int index = 0; index < LENGTH; index++) {
            result.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return result.toString();
    }

    public static <T> T create(java.util.function.Function<String, T> factory, java.util.function.Predicate<T> insert) {
        for (int attempt = 0; attempt < 5; attempt++) {
            T entity = factory.apply(generate());
            if (insert.test(entity)) return entity;
        }
        throw new IllegalStateException("고유 식별자를 생성하지 못했습니다");
    }

    public static String requireValid(String value) {
        if (value == null || value.length() != LENGTH) throw new IllegalArgumentException("식별자는 12자리여야 합니다");
        for (char character : value.toCharArray()) {
            if (ALPHABET.indexOf(character) < 0) throw new IllegalArgumentException("식별자에 사용할 수 없는 문자입니다");
        }
        return value;
    }
}
