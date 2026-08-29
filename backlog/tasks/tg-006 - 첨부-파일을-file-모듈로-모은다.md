---
id: TG-006
title: 첨부 파일을 file 모듈로 모은다
status: 닫힘
assignee: []
created_date: '2026-08-29 07:49'
updated_date: '2026-08-29 10:30'
labels: []
dependencies: []
ordinal: 26000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
여러 도메인의 첨부 파일을 `file` 모듈 하나가 처리한다. 지금은 task 가 `task_files` 전용 테이블을 갖고 user 는 `users.profile_image_key` 컬럼 하나를 갖는다. 두 방식이 다르고 프로필 이미지는 파일명·타입·크기를 잃는다.
<!-- SECTION:DESCRIPTION:END -->
