-- 문서와 개정 (GT-63).
--
-- 트래커 모드의 위키 자리다. 프로젝트에 귀속되는 마크다운 문서를 담되, 고친 것이 앞의 것을
-- 덮지 않는다.
--
-- **본문은 문서가 갖지 않고 개정이 갖는다.** 문서는 지금 어느 개정이 참인지를 가리킬 뿐이다.
-- 고치는 것은 update 가 아니라 insert 이며, 문서가 가리키는 자리만 옮겨 간다.
--
-- **차이(diff)를 담지 않고 개정마다 본문 전체를 담는다.** 차이만 쌓으면 한 자리가 깨질 때
-- 그 뒤가 전부 무너지고, 개정 하나를 보는 데 앞의 것을 모두 읽어야 한다. 문서는 자주 읽고
-- 드물게 고치는 것이므로 읽기가 싼 쪽을 택했다. 이 저장소의 문서를 세어 보면 하나가 평균
-- 7 KB 이고 가장 많이 고친 것이 17일에 36 번이므로, 전부를 쌓아도 드러날 규모가 아니다.
-- 같은 선택을 MediaWiki · Confluence · WordPress 가 하고 있다.
--
-- 두 본문의 차이는 담아 두지 않고 읽을 때 계산한다. 담아 두면 본문과 차이 두 자리가
-- 어긋날 수 있고, 어긋났을 때 어느 쪽이 참인지 판정할 근거가 없다 (V9 의 같은 논증).

create table documents (
    id               uuid         primary key,
    project_id       uuid         not null,
    -- 지금 참인 개정의 제목을 앞당겨 둔 것이다. 목록 한 화면을 내려고 개정을 매번 잇지
    -- 않으려는 것이며, 개정을 남기는 자리가 이 값을 함께 옮긴다.
    title            varchar(200) not null,
    -- 지금 참인 개정. 문서를 먼저 담고 첫 개정을 담은 뒤에 가리키므로 비어 있을 수 있다.
    -- 그 사이는 한 트랜잭션 안이며 밖에서 비어 있는 문서를 보는 일은 없다.
    head_revision_id uuid,
    -- 지운 것을 곧바로 없애지 않는다. 문서에는 개정이 딸려 있고 그것이 이 제품이 남기려는
    -- 것 자체이므로, 잘못 누른 한 번으로 통째로 사라지면 이력을 두는 뜻이 없어진다.
    -- 저장소에서 논리 삭제를 쓰는 첫 자리다.
    deleted_at       timestamptz,
    deleted_by       uuid,
    created_at       timestamptz  not null,
    created_by       uuid         not null,
    updated_at       timestamptz  not null,
    updated_by       uuid         not null,
    constraint fk_documents_project foreign key (project_id) references projects (id) on delete cascade,
    constraint fk_documents_created_by foreign key (created_by) references users (id) on delete cascade,
    constraint fk_documents_updated_by foreign key (updated_by) references users (id) on delete cascade,
    constraint fk_documents_deleted_by foreign key (deleted_by) references users (id) on delete cascade,
    constraint ck_documents_title_not_blank check (btrim(title) <> ''),
    -- 지운 때와 지운 사람은 함께 있거나 함께 없다. 하나만 있으면 지워진 것인지 아닌지를
    -- 두 자리가 다르게 답한다.
    constraint ck_documents_deleted check (
        (deleted_at is null and deleted_by is null)
        or (deleted_at is not null and deleted_by is not null)
    )
);

-- 개정.
--
-- **남긴 뒤 고치지 않는다.** 그래서 updated_at 과 updated_by 를 두지 않는다. 두면 고칠 수
-- 있다는 신호가 되고, 이력이 이력이기를 그친다. 지우는 것도 문서째 걷을 때뿐이다.
--
-- 되돌리기도 새 개정을 남긴다. 사이의 개정을 지우고 시계를 되감지 않는다 — 지우면 잘못
-- 고쳤다는 사실 자체가 사라져 왜 되돌렸는지를 나중에 알 수 없다.
create table document_revisions (
    id           uuid         primary key,
    document_id  uuid         not null,
    -- 문서 안에서 1부터 매긴다. 사람이 몇 번째 개정인지를 이 값으로 부른다.
    revision_no  integer      not null,
    title        varchar(200) not null,
    -- 길이를 컬럼이 가두지 않는다. 이 저장소의 가장 긴 문서가 21,238 자이고, 상한을 컬럼에
    -- 걸었다가 이력이 잘린 사례가 있다 (Redmine #20831).
    body         text         not null default '',
    -- 본문의 SHA-1. 달라지지 않은 저장이 개정을 만들지 않게 하는 자리다. 적는 자리가
    -- 마크다운을 문서 모델로 왕복시키므로 아무것도 고치지 않아도 글자가 달라질 수 있고,
    -- 그것이 쌓이면 이력에 아무 말도 하지 않는 개정만 늘어난다. 제목은 짧아 그대로 견준다.
    content_sha1 char(40)     not null,
    -- 왜 고쳤는지. 적지 않아도 된다. 필수로 걸면 "수정" 같은 말만 쌓이고, 그것은 적지 않은
    -- 것보다 나쁘다.
    comment      varchar(200),
    created_at   timestamptz  not null,
    created_by   uuid         not null,
    constraint fk_document_revisions_document foreign key (document_id) references documents (id) on delete cascade,
    constraint fk_document_revisions_created_by foreign key (created_by) references users (id) on delete cascade,
    constraint uq_document_revisions_document_no unique (document_id, revision_no),
    constraint ck_document_revisions_title_not_blank check (btrim(title) <> ''),
    constraint ck_document_revisions_no check (revision_no >= 1)
);

-- 문서를 먼저 담고 첫 개정을 담은 뒤에 가리키므로, 이 제약은 두 표가 다 선 뒤에 건다.
alter table documents
    add constraint fk_documents_head foreign key (head_revision_id) references document_revisions (id);

-- 목록은 프로젝트 안에서 낸다.
create index ix_documents_project_id on documents (project_id);

-- 이력은 최근 것부터 낸다.
create index ix_document_revisions_document_no on document_revisions (document_id, revision_no desc);
