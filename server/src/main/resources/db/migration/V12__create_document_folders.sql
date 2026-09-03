-- 문서 폴더 (GT-70).
--
-- 문서가 쌓이면 목록을 훑는 것으로는 찾는 것에 닿지 않는다. 폴더는 문서를 어디에 둘지만 정하고
-- 그 자체로 읽을 것을 담지 않는다.
--
-- **폴더가 폴더를 담고 깊이를 제한하지 않는다.** 몇 단계까지 허용할지를 정하면 그 수가 무엇에
-- 근거하는지 답할 자리가 없다.
--
-- **논리 삭제를 두지 않는다.** 문서가 deleted_at 을 가진 것은 개정이 딸려 있어 한 번 누른 것으로
-- 이력이 통째로 사라지면 안 되기 때문이었다. 폴더에는 그런 것이 딸리지 않는다 — 담긴 문서와 하위
-- 폴더는 지울 때 한 단계 위로 올라가고 폴더만 없어지므로, 되살릴 것이 이름 하나뿐이다
-- (DOC-008 A7). 되살리는 자리를 두지 않기로 한 것도 그 서술서다.
--
-- **같은 부모 아래 같은 이름을 막지 않는다.** 폴더를 가리키는 것은 이름이 아니라 식별자이며,
-- 문서 제목이 겹치는 것을 막지 않는 것과 같은 자리다 (DOC-008 A2). 그래서 unique 가 없다.
create table document_folders (
    id         uuid         primary key,
    project_id uuid         not null,
    name       varchar(200) not null,
    -- 담긴 자리. 비어 있으면 뿌리에 선다.
    parent_id  uuid,
    created_at timestamptz  not null,
    created_by uuid         not null,
    updated_at timestamptz  not null,
    updated_by uuid         not null,
    constraint fk_document_folders_project foreign key (project_id) references projects (id) on delete cascade,
    -- 지우는 동작을 걸지 않는다. cascade 면 폴더 하나를 걷었을 때 그 아래가 통째로 사라지고,
    -- set null 이면 손자가 뿌리까지 떨어진다. 담긴 것을 한 단계 위로 올리는 것은 애플리케이션이
    -- 하며(DOC-008 A7), 그것을 빠뜨린 채 지우면 여기서 막힌다. 프로젝트를 걷을 때는 그 프로젝트의
    -- 폴더가 한 문장 안에서 함께 사라지므로 이 제약이 걸리지 않는다.
    constraint fk_document_folders_parent foreign key (parent_id) references document_folders (id),
    constraint fk_document_folders_created_by foreign key (created_by) references users (id) on delete cascade,
    constraint fk_document_folders_updated_by foreign key (updated_by) references users (id) on delete cascade,
    -- 이름의 모양은 애플리케이션이 지킨다. 정규식 연산자를 쓰면 코드 생성기가 재생하는 H2 가 읽지
    -- 못한다 (V9 의 같은 사정). 여기서는 빈 값만 막는다.
    constraint ck_document_folders_name_not_blank check (btrim(name) <> ''),
    -- 자기 자신을 담을 수 없다. 자손 아래로 옮기는 것까지는 표가 판정하지 못하므로 애플리케이션이
    -- 함께 막는다 (DOC-008 A6).
    constraint ck_document_folders_parent_not_self check (parent_id <> id)
);

-- 문서가 담긴 자리.
--
-- 널을 허용한다. 이미 선 문서는 어느 폴더에도 담기지 않은 것으로 두며, 그 상태가 곧 뿌리다
-- (DOC-006 A1).
alter table documents add column folder_id uuid;

-- 폴더가 지워질 때 담긴 문서를 한 단계 위로 올리는 것은 애플리케이션이 한다. set null 을 걸면
-- 손자 자리의 문서가 부모가 아니라 뿌리로 떨어져 서술서가 정한 것과 다른 자리에 놓인다
-- (DOC-008 A7).
alter table documents
    add constraint fk_documents_folder foreign key (folder_id) references document_folders (id);

-- 목록은 프로젝트 안에서 낸다.
create index ix_document_folders_project_id on document_folders (project_id);

-- 한 자리 아래의 것을 펼치고 센다.
create index ix_document_folders_parent_id on document_folders (parent_id);
create index ix_documents_folder_id on documents (folder_id);
