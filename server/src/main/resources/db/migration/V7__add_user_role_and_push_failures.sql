-- 권한과 알림 실패 기록 (TG-008).
--
-- 역할을 users 의 컬럼 하나로 둔다. 권한을 자원별로 나누는 표를 따로 세우지 않는 것은 지금 가르는
-- 것이 "관리 화면에 들어갈 수 있는가" 하나뿐이기 때문이다. 가를 것이 늘면 그때 표로 옮긴다.
--
-- 기본값을 USER 로 두어 이미 가입한 사용자가 모두 일반 사용자가 된다. 첫 관리자는 설정값
-- app.admin.email 이 가리키는 계정을 기동 시에 올린다.
alter table users
    add column role varchar(20) not null default 'USER';

-- 알림이 닿지 않은 자리. 발송이 실패한 회차마다 한 행이다.
--
-- 로그로만 남기면 관리자가 서버에 들어가야 볼 수 있고, 어느 사용자가 몇 번 놓쳤는지 세지 못한다.
-- 화면에서 다루려면 조회할 수 있는 자리가 있어야 한다.
--
-- endpoint 를 구독의 id 가 아니라 값 그대로 담는다. 자리가 사라져 구독 행이 지워진 뒤에도 무엇이
-- 실패했는지 남아야 하기 때문이다.
--
-- task_id 는 어느 작업의 미리 알림이었는지를 가리킨다. 작업이 지워져도 기록은 남아야 하므로
-- 연결만 끊는다.
--
-- reason 은 FAILED(거절 또는 예외) 와 GONE(자리가 사라짐) 둘이다. GONE 은 시스템이 자리를 스스로
-- 거둔 경우이며 관리자가 할 일이 없다. 그럼에도 남기는 것은 사용자가 왜 알림을 못 받게 되었는지
-- 설명할 수 있어야 하기 때문이다.
create table push_delivery_failures (
    id          uuid          primary key,
    user_id     uuid          not null,
    endpoint    varchar(1000) not null,
    task_id     uuid,
    reason      varchar(20)   not null,
    detail      varchar(500),
    occurred_at timestamptz   not null,
    resolved_at timestamptz,
    constraint fk_push_delivery_failures_user foreign key (user_id) references users (id) on delete cascade,
    constraint fk_push_delivery_failures_task foreign key (task_id) references tasks (id) on delete set null
);

-- 목록이 최근 것부터이므로 정렬 자리를 인덱스가 갖는다.
create index ix_push_delivery_failures_occurred_at on push_delivery_failures (occurred_at desc);

create index ix_push_delivery_failures_user_id on push_delivery_failures (user_id);
