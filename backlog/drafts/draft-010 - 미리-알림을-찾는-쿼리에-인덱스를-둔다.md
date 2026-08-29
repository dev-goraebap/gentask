---
id: DRAFT-010
title: 미리 알림을 찾는 쿼리에 인덱스를 둔다
status: Draft
assignee: []
created_date: '2026-08-29 19:04'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ReminderScheduler 가 1분마다 부르는 findDue 가 tasks 를 순차로 훑는다. remind_at 에 인덱스가 없고 tasks 에 있는 것은 ix_tasks_user_id 하나다.

거르는 조건이 remind_at is not null and remind_at <= now and completed_at is null 이므로 부분 인덱스가 맞다. 미리 알림을 붙인 미완료 작업만 담으면 되고 그 수는 전체 작업 수보다 훨씬 적다.

지금은 작업이 적어 드러나지 않는다. 작업이 늘고 그중 미리 알림을 붙인 것의 비율이 낮을수록 손해가 커진다. 마이그레이션 하나로 끝나므로 그때 넣어도 늦지 않다.
<!-- SECTION:DESCRIPTION:END -->
