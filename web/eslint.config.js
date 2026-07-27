// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const prettier = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      // 접두사는 둘을 허용한다.
      //   app — 애플리케이션 컴포넌트
      //   ui  — shared/ui의 디자인 시스템 컴포넌트
      // 접두사로 출처가 드러나면 템플릿만 보고도 디자인 시스템 요소인지 알 수 있다.
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: ['app', 'ui'],
          // 컴포넌트 속성 선택자와 같은 표기를 쓴다 — 호출부에서
          // <input ui-input>과 <button ui-button>이 같은 문법으로 보인다.
          style: 'kebab-case',
        },
      ],
      // 디자인 시스템은 네이티브 요소 위에 속성으로 얹는 것을 선호하므로
      // (디자인시스템.md §8.3) 컴포넌트도 attribute 선택자를 허용한다.
      // 디자인 시스템은 네이티브 요소 위에 속성으로 얹는 것을 선호하므로
      // (디자인시스템.md §8.3) 컴포넌트도 attribute 선택자를 허용한다.
      // 속성 선택자도 kebab-case로 둔다 — 이 규칙은 style에 값 하나만 받아서,
      // 생태계 관례(matButton)를 따르려면 파일별 예외를 만들어야 한다.
      // 예외 없이 한 규칙으로 끝나는 편이 키트에 낫다: <button ui-button>.
      '@angular-eslint/component-selector': [
        'error',
        {
          type: ['element', 'attribute'],
          prefix: ['app', 'ui'],
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
  // 포맷은 Prettier 전담 — ESLint 쪽 충돌 규칙을 마지막에 전부 끈다
  prettier,
]);
