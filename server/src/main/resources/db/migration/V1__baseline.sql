-- 스키마 baseline.
-- 도메인 테이블은 각 기능의 설계가 확정될 때 후속 마이그레이션으로 추가한다.
--
-- health_check: 애플리케이션이 마이그레이션된 스키마를 실제로 읽을 수 있는지 확인하는 프로브.
-- 도메인 테이블이 생긴 뒤 불필요해지면 후속 마이그레이션으로 제거한다.
create table health_check (
    id   integer     not null primary key,
    note varchar(64) not null
);

insert into health_check (id, note) values (1, 'ok');
