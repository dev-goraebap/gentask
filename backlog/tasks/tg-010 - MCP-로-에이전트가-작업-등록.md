---
id: TG-010
title: 에이전트로 작업 다루기
status: 열림
assignee: []
created_date: '2026-08-29 07:13'
updated_date: '2026-08-30 13:41'
labels:
  - 'domain:agent'
dependencies: []
documentation:
  - docs/spec/agent/AGT-001(에이전트로 작업 다루기).md
type: story
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TG-003.04 의 토큰을 로컬 에이전트의 MCP 설정에 넣어 등록이 성립하는 것까지다. 후보 액터(로컬 에이전트)를 올리는 시점이며 새 유스케이스다. 서술서가 없으므로 아직 Story 가 아니다.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 [서버] When 에이전트가 토큰을 실어 작업을 남기면, 시스템은 그 토큰의 주인 계정에 그 작업을 만든다
- [ ] #2 [서버] When 에이전트가 목록을 요청하면, 시스템은 그 주인의 작업만 낸다
- [ ] #3 [서버] When 에이전트가 작업의 속성을 고치면, 시스템은 그 변경을 반영한다
- [ ] #4 [서버] When 에이전트가 작업을 거두면, 시스템은 그것을 지운다
- [ ] #5 [서버] If 토큰이 유효하지 않으면, then 시스템은 거절하고 에이전트는 다시 발급해야 함을 알린다
- [ ] #6 [서버] If 토큰이 설정에 없으면, then 에이전트는 붙지 않고 토큰을 두어야 함을 알린다
- [ ] #7 [서버] If 가리키는 작업이 그 주인의 것이 아니면, then 시스템은 없는 것과 같이 답한다
<!-- AC:END -->
