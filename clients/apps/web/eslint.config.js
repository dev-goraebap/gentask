// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

/**
 * 코드 규약의 강제 수단입니다.
 * 각 규칙의 근거는 docs/architecture/ 의 해당 문서가 원본이며,
 * 예외의 사유는 01-dev-environment.md 8절에 모여 있습니다.
 *
 * FSD 계층 규칙은 steiger.config.ts 가 담당하며 여기서 중복하지 않습니다.
 */
module.exports = tseslint.config(
  {
    ignores: [
      'dist/**',
      '.angular/**',
      'out-tsc/**',
      // 생성물에 대한 지적은 고칠 수 없으므로 잡음이 됩니다. 14-api-contract.md 1.2절.
    ],
  },

  // ── TypeScript ────────────────────────────────────────────────────────────
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      // 명명 규칙 — 03-naming.md 3절, 4절
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-class-suffix': 'off',
      '@angular-eslint/directive-class-suffix': 'off',

      // 보안 — 16-security.md 3.1절
      'no-restricted-properties': [
        'error',
        ...[
          'bypassSecurityTrustHtml',
          'bypassSecurityTrustScript',
          'bypassSecurityTrustStyle',
          'bypassSecurityTrustUrl',
          'bypassSecurityTrustResourceUrl',
        ].map((property) => ({
          property,
          message:
            'XSS 방어를 우회합니다. 불가피하면 결정 기록으로 사유를 남기고 지역 예외로 처리하십시오.',
        })),
      ],

      // 예외 · 로깅 — 15-error-handling.md 5.2절
      'no-console': ['error', { allow: ['error'] }],

      // 렌더링 — 05-rendering.md 2.1절
      'no-restricted-globals': [
        'error',
        {
          name: 'window',
          message:
            '서버에는 window 가 없습니다. isPlatformBrowser 또는 afterNextRender 로 감싸십시오.',
        },
        {
          name: 'localStorage',
          message: '서버에는 localStorage 가 없습니다. 호출 시점에 평가되도록 함수로 감싸십시오.',
        },
        {
          name: 'sessionStorage',
          message: '서버에는 sessionStorage 가 없습니다. 호출 시점에 평가되도록 함수로 감싸십시오.',
        },
        {
          name: 'matchMedia',
          message:
            '미디어 쿼리를 직접 판정하지 않습니다. shared/lib/adaptive 의 의미 신호를 사용하십시오.',
        },
      ],

      'no-restricted-imports': [
        'error',
        {
          paths: [
            // 폼 — 12-forms.md 1절
            {
              name: '@angular/forms',
              importNames: [
                'FormGroup',
                'FormControl',
                'FormArray',
                'FormBuilder',
                'ReactiveFormsModule',
                'Validators',
              ],
              message: 'Signal Forms(@angular/forms/signals)를 사용합니다. 12-forms.md 1절 참조.',
            },
            // 의존성 주입 — 05-building-block-view.md 5.2.4 절
            // 동적 토큰 주입은 구문 규칙으로 판별할 수 없어 임포트 입구를 막습니다.
            {
              name: '@angular/core',
              importNames: ['Injector'],
              message:
                'Injector 직접 사용은 임포트 그래프에 나타나지 않는 참조를 만듭니다. inject() 를 사용하십시오.',
            },
          ],
          patterns: [
            {
              group: ['../../*'],
              message: '계층을 넘는 상대 경로입니다. "@/<layer>/..." 별칭을 사용하십시오.',
            },
            // Steiger 의 no-public-api-sidestep 을 대신합니다.
            // 해제 사유는 steiger.config.ts 의 주석에 있습니다.
            {
              group: [
                '@/pages/**/ui/**',
                '@/pages/**/api/**',
                '@/pages/**/model/**',
                '@/pages/**/lib/**',
                '@/pages/**/config/**',
                '@/features/**/ui/**',
                '@/features/**/api/**',
                '@/features/**/model/**',
                '@/features/**/lib/**',
                '@/features/**/config/**',
                '@/entities/**/ui/**',
                '@/entities/**/api/**',
                '@/entities/**/model/**',
                '@/entities/**/lib/**',
                '@/entities/**/config/**',
              ],
              message: '슬라이스 내부 파일입니다. 슬라이스의 공개 API(index.ts)를 경유하십시오.',
            },
            {
              group: ['@/shared/*/*/**'],
              message:
                'shared 세그먼트의 내부 파일입니다. 세그먼트 또는 컴포넌트 진입점만 임포트하십시오.',
            },
          ],
        },
      ],
    },
  },

  // 테스트는 jsdom 에서만 실행되며 서버 렌더 경로를 지나지 않습니다.
  // 브라우저 API 제한의 근거가 서버 실행이므로 그 근거가 적용되지 않습니다.
  // 브라우저 API 를 다루는 코드를 검증하려면 그 API 에 직접 닿아야 합니다.
  {
    files: ['src/**/*.spec.ts'],
    rules: {
      'no-restricted-globals': 'off',
    },
  },

  // Node 진입점은 stdout 이 표준 로깅 채널입니다.
  // no-console 의 근거(브라우저 콘솔로의 개인정보 유출)가 적용되지 않습니다.
  {
    files: ['src/main.server.ts'],
    rules: {
      'no-console': 'off',
      'no-restricted-globals': 'off',
    },
  },

  // helm 사본은 Spartan 규약을 따릅니다. 선택자 접두사는 hlm 이며 app 으로 바꾸면
  // 컴포넌트를 재생성할 때마다 되돌아옵니다. helm 의 Injector 는
  // runInInjectionContext 인자이며 규칙이 막으려는 Injector.get 이 아닙니다.
  {
    files: ['src/shared/ui/**/*.ts'],
    rules: {
      '@angular-eslint/component-selector': 'off',
      '@angular-eslint/directive-selector': 'off',
      // aria-label 처럼 표준 속성명을 그대로 받으려면 별칭이 필요합니다.
      '@angular-eslint/no-input-rename': 'off',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@angular/forms',
              importNames: [
                'FormGroup',
                'FormControl',
                'FormArray',
                'FormBuilder',
                'ReactiveFormsModule',
                'Validators',
              ],
              message: 'Signal Forms(@angular/forms/signals)를 사용합니다. 12-forms.md 1절 참조.',
            },
          ],
          patterns: [
            {
              group: ['../../*'],
              message: '계층을 넘는 상대 경로입니다. "@/<layer>/..." 별칭을 사용하십시오.',
            },
          ],
        },
      ],
    },
  },

  // 전역 프로바이더는 shared 와 app 에서만 선언합니다. — 05-building-block-view.md 5.2.4 절
  {
    files: ['src/pages/**/*.ts', 'src/features/**/*.ts', 'src/entities/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "Property[key.name='providedIn'][value.value='root']",
          message:
            "providedIn: 'root' 는 shared 와 app 에서만 선언합니다. 화면 범위 서비스는 라우트 providers 에 등록하십시오.",
        },
      ],
    },
  },

  // ── 템플릿 ────────────────────────────────────────────────────────────────
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {},
  },
);
