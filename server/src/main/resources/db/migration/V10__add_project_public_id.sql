-- 프로젝트를 주소에서 가리키는 값 (TG-060).
--
-- 접두어(key)가 주소와 번호 접두어 둘을 겸하고 있었다. 둘의 요구가 다르다 — 번호 접두어는
-- 짧고 사람이 읽는 것이어야 하고, 주소는 고유해야 한다. 한 값에 두 요구를 걸어 한쪽이 졌다.
-- 접두어가 영문 대문자와 숫자만 받는 것이 주소 때문이었고, 그 탓에 한글로 지은 이름은 `P` 가
-- 되어 주소가 어느 프로젝트인지 말하지 않았다.
--
-- 그래서 가른다. 주소는 이 열이 갖고 접두어는 이슈 이름(`GT-43`)에만 남는다.
--
-- 소유자 안이 아니라 전역으로 유일하다. 주소에 소유자가 드러나지 않으므로, 소유자 안에서만
-- 유일하면 그 주소를 건넸을 때 받는 사람의 다른 프로젝트가 열린다.

alter table projects add column public_id varchar(16);

-- [jooq ignore start]
-- 이미 선 프로젝트에 값을 준다. 식별자의 앞 12 자리를 쓰는 것은 그것이 이미 유일하고, 옮기는
-- 자리에서 난수를 만드는 문법이 데이터베이스마다 다르기 때문이다. 새로 서는 것은 애플리케이션이
-- nanoid 로 만든다.
update projects
   set public_id = substr(replace(cast(id as varchar(64)), '-', ''), 1, 12)
 where public_id is null;
-- [jooq ignore stop]

alter table projects alter column public_id set not null;

alter table projects add constraint uq_projects_public_id unique (public_id);

-- 접두어의 유일 제약을 걷는다.
--
-- 이제 접두어는 이슈 이름에만 쓰이고 해석은 public_id 가 한다. 겹쳐도 서버가 헷갈릴 자리가
-- 없으므로 막을 이유가 없다. 겹치지 않는 것을 뽑아 주던 자리(`P` · `P2`)도 함께 사라진다.
alter table projects drop constraint uq_projects_owner_key;
