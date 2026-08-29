-- 첨부 파일을 도메인마다 따로 두지 않고 한 자리에 모은다.
--
-- Ruby on Rails 의 Active Storage 를 준용한다. blobs 가 파일 실체 하나를 갖고,
-- attachments 가 그것이 어느 도메인의 무엇에 붙었는지를 갖는다. 도메인이 늘어도
-- 테이블은 늘지 않고 owner_type 의 값이 하나 늘 뿐이다.
--
-- 외래 키를 owner 에 걸지 않는다. 다형 연결이라 참조 대상 테이블이 행마다 다르기
-- 때문이며, 이것이 이 방식이 치르는 대가다. owner 가 사라질 때 첨부를 함께 지우는
-- 것은 각 도메인이 수행한다.

create table blobs (
    id           uuid         primary key,
    storage_key  varchar(512) not null,
    file_name    varchar(255) not null,
    content_type varchar(100) not null,
    byte_size    bigint       not null,
    created_at   timestamptz  not null,
    constraint uq_blobs_storage_key unique (storage_key)
);

-- name 은 같은 owner 에 붙는 첨부의 용도를 가른다. 하나만 허용하는 자리(프로필
-- 이미지)와 여럿을 허용하는 자리(작업 첨부)가 같은 표에 있으므로 개수는 제약이
-- 아니라 애플리케이션이 강제한다. 작업당 5개 제한을 V4 가 그렇게 둔 것과 같다.
create table attachments (
    id         uuid        primary key,
    blob_id    uuid        not null,
    owner_type varchar(32) not null,
    owner_id   uuid        not null,
    name       varchar(32) not null,
    created_at timestamptz not null,
    constraint fk_attachments_blob foreign key (blob_id) references blobs (id) on delete cascade
);

create index ix_attachments_owner on attachments (owner_type, owner_id, name);

-- presign 만 하고 붙지 않은 업로드. 보관소에는 객체가 있으나 어디에도 매이지 않은
-- 상태이며, 청소가 이 목록을 근거로 삼는다.
--
-- 붙일 때 owner 일치를 이 행으로 확인한다. 보관소 키의 접두어를 검사하는 방식은
-- 키 형식이 owner 를 담고 있어야만 성립하므로 두지 않는다.
create table pending_uploads (
    id           uuid         primary key,
    storage_key  varchar(512) not null,
    owner_type   varchar(32)  not null,
    owner_id     uuid         not null,
    name         varchar(32)  not null,
    file_name    varchar(255) not null,
    content_type varchar(100) not null,
    created_at   timestamptz  not null,
    constraint uq_pending_uploads_storage_key unique (storage_key)
);

create index ix_pending_uploads_created_at on pending_uploads (created_at);

-- 옛 자리의 데이터를 옮긴다. 행이 없으면 아무것도 하지 않는다.
--
-- 아래 구간은 코드 생성기가 읽지 않는다. DDLDatabase 가 인메모리 H2 로 스크립트를
-- 재생하는데 PostgreSQL 함수가 거기 없기 때문이며, 생성물에 필요한 것은 스키마뿐이다.
-- [jooq ignore start]

insert into blobs (id, storage_key, file_name, content_type, byte_size, created_at)
select id, object_key, file_name, content_type, file_size, created_at
from task_files;

insert into attachments (id, blob_id, owner_type, owner_id, name, created_at)
select id, id, 'TASK', task_id, 'files', created_at
from task_files;

-- 프로필 이미지는 컬럼 하나였으므로 파일명과 미디어 타입을 갖지 않는다. 되찾을 수
-- 없는 값이라 보관소 키의 마지막 마디를 파일명으로 두고 타입은 빈 값으로 남긴다.
-- 크기는 0 이며, 다음 교체 때 실측 값으로 채워진다.
insert into blobs (id, storage_key, file_name, content_type, byte_size, created_at)
select gen_random_uuid(), profile_image_key, split_part(profile_image_key, '/', -1), '', 0, updated_at
from users
where profile_image_key is not null;

insert into attachments (id, blob_id, owner_type, owner_id, name, created_at)
select gen_random_uuid(), b.id, 'USER', u.id, 'profile_image', u.updated_at
from users u
         join blobs b on b.storage_key = u.profile_image_key
where u.profile_image_key is not null;

-- [jooq ignore stop]

alter table users
    drop column profile_image_key;

drop table task_files;
