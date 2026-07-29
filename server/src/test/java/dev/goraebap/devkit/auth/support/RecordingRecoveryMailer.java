package dev.goraebap.devkit.auth.support;

import dev.goraebap.devkit.auth.application.recovery.RecoveryMailer;
import java.util.ArrayList;
import java.util.List;

/** 발송된 복구 메일을 기록한다 — 테스트는 코드를 이 출력 경로에서만 관찰한다. */
public final class RecordingRecoveryMailer implements RecoveryMailer {

    public record Sent(String kind, String email, String code) {}

    public final List<Sent> mails = new ArrayList<>();

    @Override
    public void sendPasswordResetOtp(String email, String code) {
        mails.add(new Sent("PASSWORD_RESET", email, code));
    }

    @Override
    public void sendAccountRecoveryOtp(String email, String code) {
        mails.add(new Sent("ACCOUNT_RECOVERY", email, code));
    }

    @Override
    public void sendNoAccountGuide(String email) {
        mails.add(new Sent("NO_ACCOUNT", email, null));
    }

    @Override
    public void sendNoPasswordGuide(String email) {
        mails.add(new Sent("NO_PASSWORD", email, null));
    }

    public Sent last() {
        return mails.get(mails.size() - 1);
    }
}
