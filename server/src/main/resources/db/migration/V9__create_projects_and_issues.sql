-- 프로젝트와 작업 아이템 (TG-012).
--
-- 저장소의 `backlog/` 마크다운이 갖던 자리를 이 두 표가 받는다. 사람은 화면으로 읽고
-- 에이전트는 명령줄로 읽는다.
--
-- 유형 넷(EPIC · STORY · TASK · BUG)을 한 표에 둔다. 담는 것이 같고 계층으로만 갈리기
-- 때문이다. 표를 넷으로 나누면 목록 하나를 내기 위해 넷을 합쳐야 하고, 유형을 바꾸는 일이
-- 표를 옮기는 일이 된다.

create table projects (
    id          uuid         primary key,
    owner_id    uuid         not null,
    name        varchar(100) not null,
    -- 항목 번호의 접두어다. 사람이 부르는 이름이며 프로젝트 안에서 바뀌지 않는다.
    key         varchar(10)  not null,
    -- 다음에 내줄 번호. 지운 항목의 번호를 다시 쓰지 않으려면 최댓값이 아니라 이 값이
    -- 있어야 한다. 번호는 부여 뒤 불변이라는 규약(결정-0007)이 여기에 기댄다.
    next_number integer      not null default 1,
    created_at  timestamptz  not null,
    updated_at  timestamptz  not null,
    constraint fk_projects_owner foreign key (owner_id) references users (id) on delete cascade,
    constraint uq_projects_owner_key unique (owner_id, key),
    -- 접두어의 모양(대문자와 숫자)은 애플리케이션이 지킨다. 정규식 연산자를 쓰면 코드
    -- 생성기가 재생하는 H2 가 읽지 못한다. 여기서는 빈 값만 막는다.
    constraint ck_projects_key_not_blank check (btrim(key) <> ''),
    constraint ck_projects_next_number check (next_number >= 1)
);

create index ix_projects_owner_id on projects (owner_id);

-- 작업 아이템.
--
-- 번호를 프로젝트 안에서 평평하게 매긴다. 부모의 번호를 앞에 다는 방식을 걷은 것은,
-- 소속을 번호로 읽으면 부모를 바꿀 때 번호가 함께 바뀌어야 하는데 그 번호를 이미 테스트와
-- 커밋이 가리키고 있기 때문이다. 계층은 parent_id 가 갖는다 (결정-0007).
--
-- 인수 조건을 표로 쪼개지 않는다. `backlog/` 가 쓰던 관례를 그대로 본문 마크다운에 둔다 —
-- 파서가 `#<n>` 을 읽고, 검증 여부는 `- [x]` 가, 결번은 문장이 갖는다. 본문을 그대로 옮기면
-- 인수 조건이 함께 따라오는 것이 이 선택의 값이다. 대신 목록에서 인수 조건 수를 내려면
-- 본문을 함께 실어 와 세야 하며, 항목이 수천이 되면 그때 다시 본다.
--
-- 파생값을 저장하지 않는다. 자식 수는 집계가, 인수 조건 수와 미검증 수는 본문을 세는 것이
-- 낸다. 저장하면 두 자리가 어긋날 때 어느 쪽이 참인지 판정할 근거가 없다.
create table issues (
    id         uuid         primary key,
    project_id uuid         not null,
    number     integer      not null,
    kind       varchar(20)  not null,
    state      varchar(20)  not null,
    title      varchar(200) not null,
    body       text         not null default '',
    parent_id  uuid,
    -- 목록의 손으로 고친 순서. 값 사이에 자리를 남기려고 띄엄띄엄 매긴다.
    ordinal    integer      not null,
    author_id  uuid         not null,
    due_date   date,
    -- 더 손댈 것이 없는 자리로 옮긴 순간. COMPLETED 와 CANCELED 둘 다 여기에 남는다.
    closed_at  timestamptz,
    created_at timestamptz  not null,
    updated_at timestamptz  not null,
    constraint fk_issues_project foreign key (project_id) references projects (id) on delete cascade,
    -- 부모를 지워도 자식은 남는다. 계층이 끊길 뿐 항목이 사라질 이유는 없다.
    constraint fk_issues_parent foreign key (parent_id) references issues (id) on delete set null,
    constraint fk_issues_author foreign key (author_id) references users (id) on delete cascade,
    constraint uq_issues_project_number unique (project_id, number),
    constraint ck_issues_parent_not_self check (parent_id <> id),
    constraint ck_issues_title_not_blank check (btrim(title) <> ''),
    -- 값을 애플리케이션이 아니라 표가 가둔다. 옮기는 스크립트가 애플리케이션을 거치지
    -- 않으므로, 그 경로로 틀린 값이 조용히 들어오는 것을 여기서 막는다.
    constraint ck_issues_kind check (kind in ('EPIC', 'STORY', 'TASK', 'BUG')),
    constraint ck_issues_state check (state in ('BACKLOG', 'UNSTARTED', 'STARTED', 'COMPLETED', 'CANCELED')),
    -- 닫힌 날은 닫힌 상태에만 있다. 둘이 어긋나면 목록의 닫힘 판정과 상세의 날짜가 다른 것을
    -- 가리킨다.
    constraint ck_issues_closed_at check (
        (state in ('COMPLETED', 'CANCELED') and closed_at is not null)
        or (state not in ('COMPLETED', 'CANCELED') and closed_at is null)
    )
);

-- 목록은 프로젝트 안에서 상태로 거른다.
create index ix_issues_project_state on issues (project_id, state);

-- 자식을 세고 부모 아래를 펼친다.
create index ix_issues_parent_id on issues (parent_id);

-- 손으로 고친 순서대로 낸다.
create index ix_issues_project_ordinal on issues (project_id, ordinal);
