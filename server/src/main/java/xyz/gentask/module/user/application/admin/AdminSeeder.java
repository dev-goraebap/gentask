package xyz.gentask.module.user.application.admin;

import java.time.Clock;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import xyz.gentask.module.user.application.AdminProperties;
import xyz.gentask.module.user.domain.user.Role;
import xyz.gentask.module.user.domain.user.User;
import xyz.gentask.module.user.domain.user.UserRepository;

/**
 * 설정이 가리키는 계정을 기동할 때 관리자로 올린다.
 *
 * 가입 시점의 승격만으로는 이미 가입해 둔 계정을 올릴 수 없다. 설정을 넣고 다시 띄우면 되도록 이
 * 자리를 둔다. 계정이 아직 없으면 아무것도 하지 않으며, 그 계정이 가입할 때 AuthService 가 같은
 * 규칙으로 올린다.
 */
@Component
@RequiredArgsConstructor
class AdminSeeder implements ApplicationRunner {

    private static final Logger LOG = LoggerFactory.getLogger(AdminSeeder.class);

    private final AdminProperties properties;
    private final UserRepository userRepository;
    private final Clock clock;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        String configured = properties.email();
        if (configured == null || configured.isBlank()) {
            return;
        }
        User user = userRepository
                .findByEmailNormalized(configured.strip().toLowerCase(java.util.Locale.ROOT))
                .orElse(null);
        if (user == null || user.role().isAdmin()) {
            return;
        }
        user.changeRole(Role.ADMIN, clock.instant());
        userRepository.save(user);
        LOG.info("설정이 가리키는 계정을 관리자로 올렸다. userId={}", user.id());
    }
}
