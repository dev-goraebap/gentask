-- 계정 (TK-005 · TK-006). 테이블 구성은 Webapp devkit 의 auth 스키마를 준용한다.
--
-- users 와 accounts 를 가르는 이유는 한 사용자가 자격 수단을 여럿 가질 수 있어서다.
-- 지금은 credential(이메일·비밀번호) 하나지만, 소셜이 붙어도 users 는 바뀌지 않는다.
--
-- email 은 적은 그대로, email_normalized 는 소문자 정규화 값이다. 유일성은 정규화 값에만
-- 건다. 대소문자만 다른 두 계정이 생기면 사람은 같은 주소로 읽기 때문이다.
create table users (
    id                uuid         primary key,
    email             varchar(320) not null,
    email_normalized  varchar(320) not null,
    nickname          varchar(30)  not null,
    profile_image_key varchar(400),
    created_at        timestamptz  not null,
    updated_at        timestamptz  not null,
    constraint uq_users_email_normalized unique (email_normalized)
);

create table accounts (
    id                  uuid         primary key,
    user_id             uuid         not null,
    provider            varchar(20)  not null,
    provider_account_id varchar(255) not null,
    password_hash       varchar(100),
    created_at          timestamptz  not null,
    updated_at          timestamptz  not null,
    constraint fk_accounts_user foreign key (user_id) references users (id) on delete cascade,
    constraint uq_accounts_provider_account unique (provider, provider_account_id),
    constraint uq_accounts_user_provider unique (user_id, provider),
    -- credential 은 비밀번호가 본체다. 없는 행이 생기면 로그인할 수 없는 계정이 된다.
    constraint ck_accounts_credential_password check (
        (provider = 'credential' and password_hash is not null)
        or (provider <> 'credential' and password_hash is null)
    )
);

create index ix_accounts_user_id on accounts (user_id);

-- 세션 토큰은 원문을 저장하지 않는다. HMAC-SHA256 hex 64자만 남기며, 결정적 해시라
-- token_hash 인덱스 조회가 성립한다. bcrypt 는 salt 때문에 이 조회가 불가능하다.
create table sessions (
    id           uuid        primary key,
    user_id      uuid        not null,
    token_hash   varchar(64) not null,
    expires_at   timestamptz not null,
    last_used_at timestamptz not null,
    created_at   timestamptz not null,
    constraint fk_sessions_user foreign key (user_id) references users (id) on delete cascade,
    constraint uq_sessions_token_hash unique (token_hash)
);

create index ix_sessions_user_id on sessions (user_id);
create index ix_sessions_expires_at on sessions (expires_at);

-- 에이전트(MCP)용 토큰 (TK-006 A3). devkit 에는 없는 테이블이다 — 그쪽은 세션 토큰의
-- Bearer 재사용뿐인데, 에이전트 설정에 넣는 토큰은 세션 만료와 무관해야 해서 따로 둔다.
-- 계정당 하나이며 재발급이 곧 교체다.
create table api_tokens (
    id         uuid        primary key,
    user_id    uuid        not null,
    token_hash varchar(64) not null,
    created_at timestamptz not null,
    constraint fk_api_tokens_user foreign key (user_id) references users (id) on delete cascade,
    constraint uq_api_tokens_user unique (user_id),
    constraint uq_api_tokens_token_hash unique (token_hash)
);
