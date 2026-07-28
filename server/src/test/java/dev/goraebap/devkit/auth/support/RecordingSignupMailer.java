package dev.goraebap.devkit.auth.support;

import dev.goraebap.devkit.auth.application.registration.SignupMailer;
import java.util.ArrayList;
import java.util.List;

/** 발송된 메일을 기록한다 — 테스트는 OTP 코드를 이 출력 경로에서만 관찰한다. */
public final class RecordingSignupMailer implements SignupMailer {

    public record SentOtp(String email, String code) {}

    public final List<SentOtp> otpMails = new ArrayList<>();
    public final List<String> existingAccountGuides = new ArrayList<>();

    @Override
    public void sendOtp(String email, String code) {
        otpMails.add(new SentOtp(email, code));
    }

    @Override
    public void sendExistingAccountGuide(String email) {
        existingAccountGuides.add(email);
    }

    public String lastOtpCode() {
        return otpMails.get(otpMails.size() - 1).code();
    }
}
