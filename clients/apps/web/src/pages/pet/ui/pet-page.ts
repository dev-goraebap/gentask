import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PixelSprite } from '@/shared/ui/pixel-sprite';

/** 그려 둔 팻 넷. 규격이 서기 전까지는 고를 것이 아니라 늘어놓고 보는 것이다. */
interface PetPreview {
  readonly label: string;
  readonly sheet: string;
}

/**
 * 팻을 기르는 자리.
 *
 * 아직 자리만 잡아 둔 시안이다. 무엇을 어떻게 기르는지는 정해지지 않았고, 지금은 그려 둔 넷을
 * 나란히 세워 눈으로 보는 데 그친다. 고르는 것도 기르는 것도 아직 없다. 규격이 서면 서술서와
 * 인수 조건이 먼저 생기고 그 뒤에 이 화면이 채워진다.
 */
@Component({
  selector: 'app-pet',
  imports: [PixelSprite],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-h-0 flex-1 flex-col' },
  template: `
    <section class="mx-auto flex w-full max-w-[40rem] flex-1 flex-col px-4 pt-8 pb-8 md:pt-12">
      <h1 class="text-xl font-semibold tracking-tight">팻 관리</h1>
      <p class="text-foreground-secondary mt-1 text-sm">기르는 것을 이 자리에 둡니다.</p>

      <ul class="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        @for (pet of pets; track pet.sheet) {
          <li
            class="border-border flex flex-col items-center gap-3 rounded-(--radius-nav) border px-4 py-6"
          >
            <app-pixel-sprite [sheet]="pet.sheet" [frames]="6" [scale]="3" />
            <span class="text-foreground-secondary text-sm">{{ pet.label }}</span>
          </li>
        }
      </ul>

      <p class="text-foreground-secondary mt-6 text-sm">
        아직 고를 수 없습니다. 그려 둔 것을 보이는 자리입니다.
      </p>
    </section>
  `,
})
export class PetPage {
  // --- 상수 --------------------------------------------------------------------------------------

  protected readonly pets: readonly PetPreview[] = PETS;
}

const PETS: readonly PetPreview[] = [
  { label: '개', sheet: '/pets/dog-idle.png' },
  { label: '고양이', sheet: '/pets/cat-idle.png' },
  { label: '병아리', sheet: '/pets/chick-idle.png' },
  { label: '거북이', sheet: '/pets/turtle-idle.png' },
];
