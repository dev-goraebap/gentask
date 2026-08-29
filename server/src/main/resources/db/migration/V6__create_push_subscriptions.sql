-- 알림을 받을 자리. 웹 푸시의 구독 하나가 행 하나다.
--
-- 계정에 하나가 아니라 기기마다 선다. 한 사람이 폰과 데스크톱에서 각각 켤 수 있고,
-- 한쪽을 꺼도 다른 쪽은 계속 받아야 하기 때문이다. 규격은 NTF-001 의 A3 이 갖는다.
--
-- endpoint 는 푸시 서비스가 발급한 주소이며 그 자체가 구독의 식별자다. 같은 브라우저가
-- 다시 구독하면 같은 값이 오므로 유일성을 걸어 중복 등록을 막는다.
--
-- p256dh 와 auth 는 브라우저가 만든 공개 키와 인증 비밀이다. 보내는 쪽이 이 둘로 페이로드를
-- 암호화하며, 서버는 복호화하지 않으므로 그대로 보관한다.
create table push_subscriptions (
    id         uuid          primary key,
    user_id    uuid          not null,
    endpoint   varchar(1000) not null,
    p256dh     varchar(255)  not null,
    auth       varchar(255)  not null,
    created_at timestamptz   not null,
    constraint fk_push_subscriptions_user foreign key (user_id) references users (id) on delete cascade,
    constraint uq_push_subscriptions_endpoint unique (endpoint)
);

create index ix_push_subscriptions_user_id on push_subscriptions (user_id);

-- 보낸 미리 알림. 같은 것을 두 번 보내지 않기 위한 자리다.
--
-- 작업마다 한 행이며 그 작업의 미리 알림 시각을 함께 담는다. 사용자가 시각을 바꾸면
-- 그 값이 달라지므로 다시 보낼 수 있어야 하고, 시각까지 함께 보아 그것을 판정한다.
create table sent_reminders (
    task_id   uuid      primary key,
    remind_at timestamp not null,
    sent_at   timestamptz not null,
    constraint fk_sent_reminders_task foreign key (task_id) references tasks (id) on delete cascade
);
