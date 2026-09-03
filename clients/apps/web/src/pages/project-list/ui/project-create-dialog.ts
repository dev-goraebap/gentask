import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { form, FormField, FormRoot, requiredError, validate } from '@angular/forms/signals';
import { ProjectService } from '@/entities/project';
import { HlmButton } from '@/shared/ui/button';
import { HlmField, HlmFieldError, HlmFieldLabel } from '@/shared/ui/field';
import { AppIcon } from '@/shared/ui/icon';
import { HlmInput } from '@/shared/ui/input';

/**
 * 프로젝트를 세우는 덮개.
 *
 * 작업 아이템을 세우는 것과 같은 골격이다. 같은 성격의 일을 자리마다 다르게 만들면 하나를 고칠 때
 * 나머지가 남는다.
 */
@Component({
  selector: 'app-project-create-dialog',
  imports: [FormRoot, FormField, HlmButton, HlmField, HlmFieldError, HlmFieldLabel, HlmInput, AppIcon],
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  template: `
    <header class="border-border flex h-14 shrink-0 items-center gap-3 border-b px-4">
      <button
        hlmBtn
        type="button"
        variant="ghost"
        size="icon-sm"
        class="rounded-(--radius-nav) -ml-2 md:hidden"
        aria-label="앞 단계로 돌아가기"
        (click)="dismissed.emit()"
      >
        <app-icon name="hgiArrowLeft" size="lg" />
      </button>

      <h2 class="flex-1 text-base font-semibold tracking-tight">새 프로젝트</h2>

      <button
        hlmBtn
        type="button"
        variant="ghost"
        size="icon-sm"
        class="rounded-(--radius-nav) max-md:hidden"
        aria-label="닫기"
        (click)="dismissed.emit()"
      >
        <app-icon name="hgiCancel" />
      </button>
    </header>

    <form
      novalidate
      [formRoot]="createForm"
      (submit)="$event.preventDefault()"
      class="flex min-h-0 flex-1 flex-col"
    >
      <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        <div hlmField>
          <label hlmFieldLabel for="project-create-name" class="sr-only">이름</label>
          <input
            hlmInput
            id="project-create-name"
            class="h-11 border-0 px-0 text-base shadow-none focus-visible:ring-0 dark:bg-transparent"
            [formField]="createForm.name"
            placeholder="이름"
            autocomplete="off"
            enterkeyhint="done"
            (keydown)="createOnEnter($event)"
          />
          <!-- 단추를 잠그는 것만으로는 왜 세워지지 않는지 말하지 않는다(PRJ-001 A1). -->
          @if (createForm.name().touched()) {
            @for (error of createForm.name().errors(); track error.kind) {
              <hlm-field-error forceShow>{{ error.message }}</hlm-field-error>
            }
          }
        </div>

        <div hlmField>
          <label hlmFieldLabel for="project-create-key">작업 아이템 접두어</label>
          <input
            hlmInput
            id="project-create-key"
            class="w-40 font-mono uppercase"
            [formField]="createForm.key"
            placeholder="GT"
            autocomplete="off"
            enterkeyhint="done"
            (keydown)="createOnEnter($event)"
          />
          @if (createForm.key().touched()) {
            @for (error of createForm.key().errors(); track error.kind) {
              <hlm-field-error forceShow>{{ error.message }}</hlm-field-error>
            }
          }
        </div>

        <p class="text-foreground-secondary text-sm">
          접두어는 작업 아이템의 이름 앞에 붙습니다 — <span class="font-mono">GT-43</span>. 주소에는
          쓰이지 않으므로 다른 프로젝트와 겹쳐도 됩니다. 이름과 접두어 둘 다 나중에 프로젝트 설정에서
          바꿉니다.
        </p>
      </div>

      <footer class="border-border flex shrink-0 items-center gap-2 border-t p-3">
        <span class="flex-1"></span>
        <button hlmBtn type="button" variant="ghost" size="sm" (click)="dismissed.emit()">
          그만두기
        </button>
        <button hlmBtn type="button" size="sm" [disabled]="!creatable()" (click)="create()">
          세우기
        </button>
      </footer>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCreateDialog {
  // --- 계약 --------------------------------------------------------------------------------------
  readonly created = output<string>();
  readonly dismissed = output<void>();

  // --- 의존 --------------------------------------------------------------------------------------
  private readonly projectService = inject(ProjectService);

  // --- 상태 --------------------------------------------------------------------------------------
  private readonly draft = signal({ name: '', key: '' });
  protected readonly createForm = form(this.draft, (path) => {
    validate(path.name, ({ value }) =>
      value().trim() === '' ? requiredError({ message: '이름을 입력해 주세요.' }) : undefined,
    );
    /*
     * 접두어는 사람이 정한다. 이름에서 뽑던 규칙을 걷은 것은, 한글로만 지은 이름에서 남는 것이 없어
     * 뜻 없는 값이 커밋의 `Refs:` 에 박히기 때문이다(GT-60).
     */
    validate(path.key, ({ value }) => {
      const key = value().trim();
      if (key === '') return requiredError({ message: '접두어를 입력해 주세요.' });
      return /^[A-Za-z0-9]+$/.test(key)
        ? undefined
        : requiredError({ message: '접두어는 영문과 숫자만 쓸 수 있습니다.' });
    });
  });

  // --- 파생 --------------------------------------------------------------------------------------
  protected readonly creatable = computed(() => {
    const { name, key } = this.draft();
    return name.trim() !== '' && /^[A-Za-z0-9]+$/.test(key.trim());
  });

  // --- 동작 --------------------------------------------------------------------------------------
  protected async create(): Promise<void> {
    if (!this.creatable()) return;

    const { name, key } = this.draft();
    this.created.emit(await this.projectService.create(name.trim(), key.trim()));
  }

  protected createOnEnter(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.isComposing) return;
    event.preventDefault();
    this.create();
  }
}
