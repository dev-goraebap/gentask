-- 일회용 코드 (TG-009.01 · TG-009.02). 규격은 결정-0012 가 갖는다.
--
-- 가입과 재설정이 한 표를 쓴다. 보관하는 것이 하나만 다르고 — 가입은 아직 계정이 없어
-- 계정의 재료를 함께 들고 있어야 한다 — 발급과 검증과 시도 세기는 완전히 같다. 결정-0005 가
-- 세션과 API 토큰을 각각의 표로 둔 뒤 그 중복을 감수 항목으로 적었고, 그 자리를 반복하지 않는다.
--
-- code_hash 는 세션 토큰과 같은 HMAC-SHA256 hex 64자다. 해시에 용도를 결합하므로 같은
-- 여섯 자리가 가입과 재설정에서 서로 다른 값이 된다.
--
-- (email_normalized, purpose) 가 유일하다. 다시 요청하는 것은 행을 더하는 것이 아니라
-- 그 행을 갈아 끼우는 것이며, 그래서 한 주소가 만드는 행이 용도마다 하나로 묶인다.
create table verification_codes (
    id                   uuid         primary key,
    purpose              varchar(20)  not null,
    email_normalized     varchar(320) not null,
    code_hash            varchar(64)  not null,
    -- 가입에서만 값을 갖는다. 계정이 만들어지기 전까지 그 재료를 갖는 자리가 여기뿐이다.
    signup_password_hash varchar(100),
    signup_nickname      varchar(30),
    attempts             integer      not null,
    expires_at           timestamptz  not null,
    created_at           timestamptz  not null,
    constraint uq_verification_codes_email_purpose unique (email_normalized, purpose),
    constraint ck_verification_codes_signup_password check (
        (purpose = 'SIGNUP' and signup_password_hash is not null)
        or (purpose <> 'SIGNUP' and signup_password_hash is null)
    )
);

create index ix_verification_codes_expires_at on verification_codes (expires_at);
