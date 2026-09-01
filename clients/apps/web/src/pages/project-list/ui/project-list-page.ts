import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjectService } from '@/entities/project';
import { PROJECT_CREATE_PANEL, ROUTES } from '@/shared/config';
import { injectRoutedOverlay, type RoutedOverlayRef } from '@/shared/lib';
import { HlmButton } from '@/shared/ui/button';
import { AppIcon } from '@/shared/ui/icon';
import { ProjectCreateDialog } from './project-create-dialog';

/**
 * 프로젝트들.
 *
 * <p>투두의 메뉴 안에 선다. 프로젝트는 모드가 아니라 계정에 매이므로 어느 프로젝트에도 들어가지 않은
 * 상태에서 닿을 수 있어야 하고, 그 자리가 여기다.
 */
@Component({
  selector: 'app-project-list',
  imports: [RouterLink, HlmButton, AppIcon],
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-list-page.html',
})
export class ProjectListPage {
  // --- 상수 --------------------------------------------------------------------------------------
  protected readonly routes = ROUTES;
  protected readonly createPanel = PROJECT_CREATE_PANEL;

  // --- 계약 --------------------------------------------------------------------------------------
  /** 세우는 덮개가 열려 있는가. 주소가 그것을 갖는다. */
  readonly new = input(false, { transform: booleanAttribute });

  // --- 의존 --------------------------------------------------------------------------------------
  private readonly projectService = inject(ProjectService);
  private readonly overlay = injectRoutedOverlay();

  // --- 상태 --------------------------------------------------------------------------------------
  /** 지금 떠 있는 덮개. 주소가 바뀔 때 그것을 걷기 위해 들고 있는다. */
  private creating: RoutedOverlayRef<ProjectCreateDialog> | null = null;

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly projects = this.projectService.list;

  // --- 생성 --------------------------------------------------------------------------------------
  /**
   * 주소가 덮개의 열림을 갖는다.
   *
   * <p>여기가 주소를 따라간다. 반대로 덮개가 스스로 주소를 바꾸게 하면 열림의 진실이 둘로 나뉘어
   * 뒤로가기와 새로고침에서 어긋난다.
   */
  constructor() {
    effect(() => {
      if (this.new() && this.creating === null) this.openCreate();
      if (!this.new() && this.creating !== null) this.closeCreate();
    });
  }

  // --- 동작 --------------------------------------------------------------------------------------
  private openCreate(): void {
    const ref = this.overlay.open(ProjectCreateDialog, ROUTES.projects());
    this.creating = ref;

    ref.instance.created.subscribe((id) => {
      this.creating = null;
      // 세운 것으로 곧장 들어간다. 세우고 나서 다시 고르게 하면 방금 한 일을 한 번 더 시킨다.
      ref.close(ROUTES.issues(id));
    });

    ref.instance.dismissed.subscribe(() => {
      this.creating = null;
      ref.close();
    });
  }

  /** 주소가 먼저 바뀐 경우다. 뒤로가기로 덮개를 닫았으므로 이동 없이 걷기만 한다. */
  private closeCreate(): void {
    const ref = this.creating;
    this.creating = null;
    ref?.dismiss();
  }
}
