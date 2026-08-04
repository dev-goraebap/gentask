import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { TransitionOverlay } from './transition-overlay';

/**
 * 앱 셸.
 *
 * 화면은 전부 라우트가 그린다 — 여기에는 모든 라우트가 공유하는 것만 둔다. 지금은 전환
 * 오버레이 하나뿐이고, 헤더·내비게이션이 생기면 그것들은 인증 후 영역의 레이아웃
 * 라우트(`app/`)에 붙지 공개 페이지까지 덮는 이 자리에 오지 않는다.
 */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, TransitionOverlay],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
