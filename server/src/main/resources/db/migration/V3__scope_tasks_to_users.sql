-- 작업을 계정 단위로 좁힌다 (TK-005). 계정 도입 전의 작업에는 주인이 없다.
-- 개발 데이터뿐이므로 지우고 not null 로 간다. 주인 없는 작업이라는 상태를 남기지 않는다.
delete from tasks;

alter table tasks add column user_id uuid not null;
alter table tasks add constraint fk_tasks_user foreign key (user_id) references users (id) on delete cascade;
create index ix_tasks_user_id on tasks (user_id);
