-- 대기 레코드에 사용자가 입력한 이메일 원문을 보존한다 (결정-0015 §결정 5).
--
-- target_email(정규화된 값)만 저장하면 가입 완료 시 users.email에도 정규화된 값이 들어가,
-- "원문을 저장하고 유일성 제약은 정규화된 값에 건다"는 결정이 지켜지지 않는다.
-- 유일성 판정은 여전히 정규화된 값으로만 한다 — 이 컬럼에는 제약을 두지 않는다.

alter table verifications add column target_email_raw varchar(320);

-- 기존 행(있다면)은 정규화된 값을 원문으로 삼는다. 대기 레코드는 10분이면 만료되므로 영향이 없다.
update verifications set target_email_raw = target_email where target_email_raw is null;

alter table verifications alter column target_email_raw set not null;
