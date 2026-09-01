import { isPlatformServer } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProjectService } from '@/entities/project';
import { ROUTES } from '@/shared/config';
import { AppIcon } from '@/shared/ui/icon';

/** 이 폭부터는 사이드바의 고르개가 프로젝트를 이미 보여 준다. 껍데기의 md 와 같은 값이어야 한다. */
const SIDEBAR_WIDTH = 768;

/**
 * 프로젝트들.
 *
 * <p>좁은 화면에서 트래커의 첫 자리다. 여기서 프로젝트를 고르면 그 프로젝트의 메뉴로 들어가고,
 * 거기서 목록을, 목록에서 상세로 들어간다. 할 일 쪽의 목록들과 같은 모양의 단계다.
 *
 * <p>넓은 화면에서는 사이드바의 고르개가 같은 것을 이미 보여 주므로 이 자리에 머무를 이유가 없다.
 * 곧바로 지금 프로젝트로 옮기며, 그 판정은 브라우저에서만 할 수 있으므로 서버가 그린 것을 브라우저가
 * 바로잡는다. 옮기는 동안 잘못된 화면이 보이지 않도록 이 자리는 넓은 화면에서 그려지지 않는다.
 */
@Component({
  selector: 'app-project-list',
  imports: [RouterLink, AppIcon],
  host: { class: 'flex min-h-0 flex-1 flex-col md:hidden' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-list-page.html',
})
export class ProjectListPage {
  // --- 의존 --------------------------------------------------------------------------------------
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly projects = this.projectService.list;
  protected readonly routes = ROUTES;

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
