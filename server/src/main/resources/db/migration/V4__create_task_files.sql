-- 작업에 붙인 파일 (TK-003 A11). 바이트는 오브젝트 스토리지가 갖고 여기는 목록이다.
--
-- 개수(작업당 5개)와 크기(각 10MB)는 애플리케이션이 강제한다. 개수는 행 수 제약으로
-- 적을 수 없고, 크기는 확정 시점에 보관소의 실제 크기로 확인한다.
create table task_files (
    id           uuid         primary key,
    task_id      uuid         not null,
    file_name    varchar(255) not null,
    content_type varchar(100) not null,
    file_size    bigint       not null,
    object_key   varchar(400) not null,
    created_at   timestamptz  not null,
    constraint fk_task_files_task foreign key (task_id) references tasks (id) on delete cascade,
    constraint uq_task_files_object_key unique (object_key)
);

create index ix_task_files_task_id on task_files (task_id);
