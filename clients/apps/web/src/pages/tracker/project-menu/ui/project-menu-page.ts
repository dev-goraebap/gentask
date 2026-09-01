import { isPlatformServer } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProjectService } from '@/entities/project';
import { ROUTES, trackerNavGroups } from '@/shared/config';
import { AppIcon } from '@/shared/ui/icon';
import { AppPageBack } from '@/shared/ui/page-back';

/** 이 폭부터는 사이드바가 같은 메뉴를 이미 보여 준다. 껍데기의 md 와 같은 값이어야 한다. */
const SIDEBAR_WIDTH = 768;

/**
 * 프로젝트의 메뉴.
 *
 * <p>좁은 화면에서 프로젝트를 고른 다음 자리다. 사이드바가 보여 주는 것과 같은 것을 화면 하나로
 * 편다 — 같은 목록을 두 곳에 적으면 하나를 더할 때 한쪽만 늘어나므로 껍데기가 쓰는 그 메뉴를
 * 그대로 받는다.
 *
 * <p>넓은 화면에서는 사이드바가 그것을 이미 보여 주므로 곧바로 작업 아이템으로 옮긴다.
 */
@Component({
  selector: 'app-project-menu',
  imports: [AppPageBack, RouterLink, AppIcon],
  host: { class: 'flex min-h-0 flex-1 flex-col md:hidden' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-menu-page.html',
})
export class ProjectMenuPage {
  // --- 의존 --------------------------------------------------------------------------------------
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly routes = ROUTES;
  protected readonly project = this.projectService.current;
  protected readonly groups = computed(() => trackerNavGroups(this.project().id));

  // --- 생성 --------------------------------------------------------------------------------------
  constructor() {
    if (isPlatformServer(inject(PLATFORM_ID))) return;

    afterNextRender(() => {
      if (globalThis.innerWidth < SIDEBAR_WIDTH) return;
      // 이력에 남기지 않는다. 뒤로 눌렀을 때 이 자리로 되돌아오면 다시 옮겨져 갇힌다.
      void this.router.navigateByUrl(ROUTES.issues(this.projectService.current().id), {
        replaceUrl: true,
      });
    });
  }
}
