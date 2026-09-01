---
id: TG-045
title: backlog 를 트래커로 옮기고 원본과 대조한다
status: 열림
assignee: []
created_date: '2026-09-01 12:27'
labels:
  - 'domain:tracker'
dependencies: []
parent_task_id: TG-041
type: task
ordinal: 43000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
backlog/tasks · completed · archive 의 마크다운을 읽어 issues 로 넣는다. 옮긴 뒤 원본과 대조해 항목 수 · 번호 · 계층 · 인수 조건 수가 같은지 본다.

옮기면 잃는 것이 하나 있다. 프런트매터의 dependencies 는 값이 든 항목이 있으나 담을 자리가 이 설계에 없다. assignee 와 labels 는 전부 비어 있어 잃을 것이 없다.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 When 옮기기를 돌리면, 시스템은 원본의 항목 수와 같은 수의 작업 아이템을 낸다
- [ ] #2 When 옮기기를 돌리면, 시스템은 원본의 번호를 그대로 쓴다
- [ ] #3 When 옮기기를 돌리면, 시스템은 원본의 parent_task_id 를 부모로 잇는다
- [ ] #4 When 옮기기를 두 번 돌리면, 시스템은 항목을 두 벌로 만들지 않는다
<!-- AC:END -->
