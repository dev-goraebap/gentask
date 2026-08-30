import { isPlatformServer } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TASK_VIEWS } from '@/entities/task';
import { UserAvatar, UserService } from '@/entities/user';
import { ROUTES } from '@/shared/config';
import { AppIcon } from '@/shared/ui/icon';

/** 이 폭부터는 사이드바가 목록들을 이미 보여 준다. 껍데기의 md 와 같은 값이어야 한다. */
const SIDEBAR_WIDTH = 768;

/**
 * 목록들.
 *
 * <p>좁은 화면의 첫 자리다. 여기서 목록 하나를 고르면 그 목록으로 들어가고, 거기서 작업 하나를 고르면
 * 상세로 들어간다. 깊이가 셋이며 각 단계가 화면을 온전히 쓴다.
 *
 * <p>하단에 자리를 나누는 띠를 두지 않는다. 사이드바에 있는 것은 성격이 다른 자리가 아니라 같은 것을
 * 다르게 거른 목록이며, 목록이 늘면 몇 칸으로는 담기지 않는다.
 *
 * <p>넓은 화면에서는 사이드바가 같은 것을 이미 보여 주므로 이 자리에 머무를 이유가 없다. 곧바로 기본
 * 목록으로 옮기며, 그 판정은 브라우저에서만 할 수 있으므로 서버가 그린 것을 브라우저가 바로잡는다.
 * 옮기는 동안 잘못된 화면이 보이지 않도록 이 자리는 넓은 화면에서 그려지지 않는다.
 */
@Component({
  selector: 'app-task-lists',
  imports: [RouterLink, AppIcon, UserAvatar],
  host: { class: 'flex min-h-0 flex-1 flex-col md:hidden' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-lists-page.html',
})
export class TaskListsPage {
  // --- 의존 --------------------------------------------------------------------------------------
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly views = TASK_VIEWS;
  protected readonly me = this.userService.me;
  protected readonly routes = ROUTES;

  // --- 생성 --------------------------------------------------------------------------------------
  constructor() {
    if (isPlatformServer(inject(PLATFORM_ID))) return;

    afterNextRender(() => {
      if (globalThis.innerWidth < SIDEBAR_WIDTH) return;
      // 이력에 남기지 않는다. 뒤로 눌렀을 때 이 자리로 되돌아오면 다시 옮겨져 갇힌다.
      void this.router.navigateByUrl(ROUTES.taskList(), { replaceUrl: true });
    });
  }
}
