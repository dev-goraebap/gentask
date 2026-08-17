import { defineConfig } from 'steiger';
import fsd from '@feature-sliced/steiger-plugin';

/*
 * FSD 계층 규칙의 강제 지점입니다.
 * 규칙의 근거는 docs/architecture/references/02-package-structure.md 가 원본이며,
 * 예외의 사유는 docs/architecture/references/01-dev-environment.md 8절에 있습니다.
 */
export default defineConfig([
  ...fsd.configs.recommended,

  {
    /*
     * 프레임워크 진입점입니다. 어느 계층에도 속하지 않습니다.
     * 실측으로는 등재 전에도 경고되지 않았으나, 향후 규칙이 추가될 때
     * 동작이 바뀌지 않도록 의도를 설정에 남깁니다.
     */
    ignores: ['./src/main.ts', './src/main.server.ts', './src/server.ts', './src/index.html'],
  },

  {
    /*
     * helm 사본의 폴더 구조는 Spartan 생성기가 정합니다. 손으로 평탄화하면
     * 컴포넌트를 추가하거나 재생성할 때마다 같은 작업을 반복하게 됩니다.
     */
    files: ['./src/shared/ui/**'],
    rules: {
      'fsd/public-api': 'off',
      'fsd/no-reserved-folder-names': 'off',
    },
  },

  {
    /*
     * `@/shared/ui/button` 은 tsconfig 가 `button/src/index.ts` 로 매핑하는
     * 그 컴포넌트의 공개 API 이며 내부 파일이 아닙니다. Steiger 가 경로 문자열만
     * 보고 우회로 판정하는데 규칙 단위 예외를 둘 수 없어 전역 해제하고,
     * 슬라이스 내부 파일 직접 임포트 금지는 ESLint no-restricted-imports 가 대신합니다.
     */
    rules: {
      'fsd/no-public-api-sidestep': 'off',
    },
  },

  {
    /*
     * 슬라이스가 하나뿐인 초기 단계에서는 과분할 지적이 유효하지 않습니다.
     * 슬라이스가 셋 이상이 되면 이 블록을 제거합니다.
     */
    files: ['./src/pages/**'],
    rules: {
      'fsd/excessive-slicing': 'off',
    },
  },
]);
