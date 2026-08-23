-- 작업 (TK-001 ~ TK-004).
--
-- 시각 컬럼의 타입이 둘로 갈린다. created_at 과 completed_at 은 실제로 일어난 순간이므로
-- timestamptz 이고, remind_at 은 사용자가 고른 "그 날 그 시각" 이지 절대 순간이 아니므로
-- timestamp 다. 후자에 시간대를 붙이면 고른 값과 저장된 값이 달라져 화면에 낼 때마다
-- 되돌려야 한다.
--
-- due_date 와 my_day_on 은 날짜만 갖는다. 기한은 "언제까지" 이고 나의 하루는 "어느 날에
-- 담았는가" 라서 둘 다 시각이 판정에 관여하지 않는다.
create table tasks (
    id           uuid         primary key,
    title        varchar(200) not null,
    note         text         not null default '',
    due_date     date,
    remind_at    timestamp,
    important    boolean      not null default false,
    my_day_on    date,
    completed_at timestamptz,
    created_at   timestamptz  not null,
    updated_at   timestamptz  not null
);

-- 제목이 공백만인 것은 제목이 아니다. 도메인이 같은 규칙을 갖지만 그것은 애플리케이션을
-- 거치는 경로만 지킨다.
alter table tasks add constraint tasks_title_not_blank check (btrim(title) <> '');
