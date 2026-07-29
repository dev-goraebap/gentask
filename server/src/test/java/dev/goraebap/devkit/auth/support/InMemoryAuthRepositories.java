package dev.goraebap.devkit.auth.support;

import dev.goraebap.devkit.auth.domain.account.Account;
import dev.goraebap.devkit.auth.domain.account.AccountRepository;
import dev.goraebap.devkit.auth.domain.account.AuthProvider;
import dev.goraebap.devkit.auth.domain.session.Session;
import dev.goraebap.devkit.auth.domain.session.SessionRepository;
import dev.goraebap.devkit.auth.domain.user.User;
import dev.goraebap.devkit.auth.domain.user.UserRepository;
import dev.goraebap.devkit.auth.domain.verification.Verification;
import dev.goraebap.devkit.auth.domain.verification.VerificationPurpose;
import dev.goraebap.devkit.auth.domain.verification.VerificationRepository;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;

/** 명령 서비스 단위 테스트용 인메모리 저장소 (설계/서버.md §9). */
public final class InMemoryAuthRepositories {

    private InMemoryAuthRepositories() {}

    public static final class Users implements UserRepository {
        public final Map<UUID, User> rows = new LinkedHashMap<>();

        @Override
        public void save(User user) {
            boolean duplicate = rows.values().stream()
                    .anyMatch(existing -> !existing.id().equals(user.id())
                            && existing.email().normalized().equals(user.email().normalized()));
            if (duplicate) {
                throw new DataIntegrityViolationException("uq_users_email_normalized");
            }
            rows.put(user.id(), user);
        }

        @Override
        public boolean registerIfEmailAvailable(User user) {
            if (existsByEmailNormalized(user.email().normalized())) {
                return false;
            }
            rows.put(user.id(), user);
            return true;
        }

        @Override
        public Optional<User> findById(UUID id) {
            return Optional.ofNullable(rows.get(id));
        }

        @Override
        public Optional<User> findByEmailNormalized(String emailNormalized) {
            return rows.values().stream()
                    .filter(user -> user.email().normalized().equals(emailNormalized))
                    .findFirst();
        }

        @Override
        public boolean existsByEmailNormalized(String emailNormalized) {
            return findByEmailNormalized(emailNormalized).isPresent();
        }
    }

    public static final class Accounts implements AccountRepository {
        public final Map<UUID, Account> rows = new LinkedHashMap<>();

        @Override
        public void save(Account account) {
            rows.put(account.id(), account);
        }

        @Override
        public Optional<Account> findByUserIdAndProvider(UUID userId, AuthProvider provider) {
            return rows.values().stream()
                    .filter(account -> account.userId().equals(userId) && account.provider() == provider)
                    .findFirst();
        }

        @Override
        public Optional<Account> findByProviderAndProviderAccountId(AuthProvider provider, String providerAccountId) {
            return rows.values().stream()
                    .filter(account -> account.provider() == provider
                            && account.providerAccountId().equals(providerAccountId))
                    .findFirst();
        }
    }

    public static final class Sessions implements SessionRepository {
        public final Map<UUID, Session> rows = new LinkedHashMap<>();

        @Override
        public void save(Session session) {
            rows.put(session.id(), session);
        }

        @Override
        public Optional<Session> findByTokenHash(String tokenHash) {
            return rows.values().stream()
                    .filter(session -> session.tokenHash().equals(tokenHash))
                    .findFirst();
        }

        @Override
        public void deleteById(UUID id) {
            rows.remove(id);
        }

        @Override
        public boolean deleteByIdAndUserId(UUID id, UUID userId) {
            Session session = rows.get(id);
            if (session == null || !session.userId().equals(userId)) {
                return false;
            }
            rows.remove(id);
            return true;
        }

        @Override
        public void deleteAllByUserId(UUID userId) {
            rows.values().removeIf(session -> session.userId().equals(userId));
        }
    }

    public static final class Verifications implements VerificationRepository {
        public final Map<UUID, Verification> rows = new LinkedHashMap<>();

        @Override
        public void save(Verification verification) {
            rows.put(verification.id(), verification);
        }

        @Override
        public Optional<Verification> findByIdAndPurpose(UUID id, VerificationPurpose purpose) {
            return Optional.ofNullable(rows.get(id)).filter(verification -> verification.purpose() == purpose);
        }

        @Override
        public Optional<Verification> findForAttempt(UUID id, VerificationPurpose purpose) {
            return findByIdAndPurpose(id, purpose);
        }

        @Override
        public int deleteAllByUserIdAndPurpose(UUID userId, VerificationPurpose purpose) {
            int before = rows.size();
            rows.values()
                    .removeIf(
                            verification -> purpose == verification.purpose() && userId.equals(verification.userId()));
            return before - rows.size();
        }
    }
}
