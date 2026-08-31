---
id: DRAFT-011
title: 가상 키보드가 올라오면 적는 자리를 그 위에 둔다
status: Draft
assignee: []
created_date: '2026-08-31 04:28'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
좁은 화면에서 적는 자리에 포커스가 가면 가상 키보드가 그 자리를 덮는다. Android Chrome 에서 확인했다.

셸이 h-dvh 에 overflow-hidden 이라 문서가 스크롤되지 않는다. 적는 자리는 sticky bottom-0 으로 스크롤 컨테이너 바닥에 붙는데 그 컨테이너의 높이가 100dvh, 곧 레이아웃 뷰포트 기준이다. 가상 키보드는 비주얼 뷰포트만 줄이므로 레이아웃 뷰포트도 100dvh 도 그대로고 적는 자리는 원래 높이에 남는다. 브라우저가 입력을 보이도록 스크롤하려 해도 문서에 밀 자리가 없다.

수단이 둘이다. 뷰포트 meta 에 interactive-widget=resizes-content 를 더하면 Chrome 108 이상이 키보드만큼 레이아웃 뷰포트를 줄이고 sticky 가 그것을 따라 올라온다. 한 줄이다. iOS Safari 는 이 속성을 읽지 않으므로 visualViewport 의 height 와 offsetTop 을 재서 셸 높이에 넣고 Safari 가 페이지를 밀어 올리는 것까지 보정해야 한다.

착수 조건은 iOS 에서 같은 증상인지 확인하는 것이다. Android 만이면 meta 한 줄로 끝나고 iOS 도 겪으면 코드가 붙는다. 실기기 확인은 저장소 주인이 한다.
<!-- SECTION:DESCRIPTION:END -->
