-- 인증 스키마 (AUTH-06). 설계 의도와 불변식 대응은 docs/설계/데이터베이스.md.
--
-- 이 파일의 제약들은 편의가 아니라 결정-0015의 불변식을 스키마 수준에서 강제하기 위한 것이다.
-- 특히 다음 둘은 지우거나 바꾸기 전에 그 결정기록을 읽어야 한다:
--   1) users.email_verified_at NOT NULL       — 미검증 사용자를 표현할 수 없게 한다
--   2) verifications에 유일성 제약을 두지 않음 — 대기 시도가 이메일을 선점하지 못하게 한다
--
-- 기본키는 애플리케이션이 생성한다(DB 기본값을 두지 않는다). 시각도 주입된 Clock으로 채운다.

create table users (
    id                uuid         not null,
    email             varchar(320) not null,
    email_normalized  varchar(320) not null,
    email_verified_at timestamp with time zone not null,
    nickname          varchar(30),
    created_at        timestamp with time zone not null,
    updated_at        timestamp with time zone not null,

    constraint pk_users primary key (id),
    constraint uq_users_email_normalized unique (email_normalized)
);

create table accounts (
    id                  uuid        not null,
    user_id             uuid        not null,
    provider            varchar(20) not null,
    provider_account_id varchar(255) not null,
    password_hash       varchar(100),
    access_token        varchar(2048),
    refresh_token       varchar(2048),
    token_expires_at    timestamp with time zone,
    created_at          timestamp with time zone not null,
    updated_at          timestamp with time zone not null,

    constraint pk_accounts primary key (id),
    constraint fk_accounts_user foreign key (user_id) references users (id) on delete cascade,

    -- 한 제공자 신원이 두 사용자에 붙는 것을 막는다
    constraint uq_accounts_provider_account unique (provider, provider_account_id),
    -- 한 사용자가 같은 제공자로 두 계정을 갖는 것을 막는다 (credential이 둘이면 비밀번호가 둘)
    constraint uq_accounts_user_provider unique (user_id, provider),
    -- 비밀번호는 credential 계정에만 존재한다
    constraint ck_accounts_credential_password check (
        (provider = 'credential' and password_hash is not null)
        or (provider <> 'credential' and password_hash is null)
    )
);

create table sessions (
    id           uuid        not null,
    user_id      uuid        not null,
    token_hash   varchar(64) not null,
    expires_at   timestamp with time zone not null,
    last_used_at timestamp with time zone not null,
    ip_address   varchar(45),
    user_agent   varchar(512),
    created_at   timestamp with time zone not null,

    constraint pk_sessions primary key (id),
    constraint fk_sessions_user foreign key (user_id) references users (id) on delete cascade,
    -- 토큰은 원문이 아니라 HMAC으로 저장된다 — DB 유출이 활성 세션을 넘기지 않게 한다
    constraint uq_sessions_token_hash unique (token_hash)
);

-- OTP 대기 레코드. 네 용도(EMAIL_SIGNUP·EMAIL_CHANGE·PASSWORD_RESET·ACCOUNT_RECOVERY)가
-- 한 테이블을 공유하므로 컬럼이 용도별로 희소하다 — AUTH-06이 4테이블을 고정했기 때문이다.
--
-- target_email에 유일성 제약이 없는 것은 누락이 아니다. 대기 시도가 이메일을 예약하면
-- 공격자가 코드 발급만 반복해 남의 이메일을 선점할 수 있다. 같은 이메일에 여러 대기
-- 레코드가 동시에 존재하고, 먼저 코드를 맞힌 쪽이 계정을 얻는다.
create table verifications (
    id                         uuid        not null,
    purpose                    varchar(30) not null,
    target_email               varchar(320) not null,
    code_hash                  varchar(64) not null,
    attempts                   integer     not null default 0,
    expires_at                 timestamp with time zone not null,
    consumed_at                timestamp with time zone,
    user_id                    uuid,
    social_provider            varchar(20),
    social_provider_account_id varchar(255),
    created_at                 timestamp with time zone not null,

    constraint pk_verifications primary key (id),
    -- 가입 대기 레코드는 아직 사용자가 없다 — user_id가 null을 허용하는 유일한 이유
    constraint fk_verifications_user foreign key (user_id) references users (id) on delete cascade
);

create index ix_accounts_user_id on accounts (user_id);
create index ix_sessions_user_id on sessions (user_id);
create index ix_sessions_expires_at on sessions (expires_at);
create index ix_verifications_email_purpose on verifications (target_email, purpose);
create index ix_verifications_expires_at on verifications (expires_at);
