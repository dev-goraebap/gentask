---
id: TG-010
title: 에이전트로 작업 다루기
status: 닫힘
assignee: []
created_date: '2026-08-29 07:13'
updated_date: '2026-08-31 03:33'
labels:
  - 'domain:agent'
dependencies: []
documentation:
  - docs/spec/agent/AGT-001(에이전트로 작업 다루기).md
type: story
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TG-003.04 의 토큰을 로컬 에이전트의 MCP 설정에 두고 여덟 도구로 작업을 다루는 것까지다. 후보 액터였던 로컬 에이전트를 주 액터로 올리는 자리이며 서술서는 AGT-001 이다. 서버에는 더할 것이 없고 MCP 서버가 기존 작업 API 와 Bearer 인증의 소비자다.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 [서버] When 에이전트가 토큰을 실어 작업을 남기면, 시스템은 그 토큰의 주인 계정에 그 작업을 만든다
- [x] #2 [서버] When 에이전트가 목록을 요청하면, 시스템은 그 주인의 작업만 낸다
- [x] #3 [서버] When 에이전트가 작업의 속성을 고치면, 시스템은 그 변경을 반영한다
- [x] #4 [서버] When 에이전트가 작업을 거두면, 시스템은 그것을 지운다
- [x] #5 [서버] If 토큰이 유효하지 않으면, then 시스템은 거절하고 에이전트는 다시 발급해야 함을 알린다
- [x] #6 [서버] If 토큰이 설정에 없으면, then 에이전트는 붙지 않고 토큰을 두어야 함을 알린다
- [x] #7 [서버] If 가리키는 작업이 그 주인의 것이 아니면, then 시스템은 없는 것과 같이 답한다
<!-- AC:END -->
