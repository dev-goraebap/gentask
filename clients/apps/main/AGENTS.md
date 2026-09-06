# Main 프런트엔드 규칙

- FSD 2.1의 페이지 중심 구조를 사용합니다. 외부 슬라이스에서는 `index.ts`로 공개한 항목을 참조합니다.
- 한 파일에는 React 컴포넌트를 하나만 정의합니다. 보조 컴포넌트, Provider, 라우트 연결 컴포넌트, 아이콘도 별도 파일로 분리합니다.
- 컴포넌트 이름과 파일 이름은 같은 PascalCase를 사용합니다. 예: `NoteEditor.tsx`의 `NoteEditor`.
- 페이지를 담당하는 컴포넌트와 파일에만 `Page` 접미사를 붙입니다. 예: `pages/drawer/ui/DrawerPage.tsx`.
- 페이지 슬라이스 폴더명은 kebab-case로 작성합니다. 폴더명에는 `-page`를 붙이지 않습니다.
- 페이지 그룹은 `issues/list`, `issues/detail`, `documents/list`, `documents/detail`, `workspaces/list`, `workspaces/members`, `workspaces/settings`로 구성합니다.
- 그룹 폴더에는 공통 코드, `ui`·`model` 등의 세그먼트, `index.ts`를 두지 않습니다. 각 슬라이스의 공개 진입점을 사용하며, 같은 그룹의 슬라이스끼리도 직접 참조하지 않습니다.
- 일반 함수, 상수, 타입은 컴포넌트 수에 포함하지 않습니다. `lazy`로 선언한 컴포넌트도 별도 파일로 분리합니다.
- Hook 파일은 `useDeleteWorkspace.ts`처럼 `use`로 시작하는 camelCase를 사용합니다.
- 재사용 범위가 해당 페이지뿐인 컴포넌트는 같은 슬라이스의 `ui`에 둡니다. 파일 분리만을 목적으로 `shared`로 이동하지 않습니다.
- `npm run check -w main`으로 컴포넌트 규칙, FSD 구조, 타입, 빌드를 검증합니다.


## Project-specific guidance for AI coding agents.

Follow the component and naming rules in `AGENTS.md` in this directory.

<!-- ASTRYX:START -->
Astryx v0.5.2 · 163 components
CLI: run every command as `npx astryx <cmd>` (shown below as `astryx ...`).

SETUP (once, in your app entry e.g. main.tsx) — without these, components render unstyled:
  import "@astryxdesign/core/reset.css";
  import "@astryxdesign/core/astryx.css";

WORKFLOW — discover, don't guess. Before writing UI:
1. `astryx build "<idea>"` — START HERE: returns a kit (closest [page] + [block]s + [component]s). No args = full playbook.
2. `astryx template <name> [--skeleton]` — scaffold the [page]/[block]s it named, or study their layout. Templates are reference code.
3. `astryx component <Name>` — props + examples for every component you use.

RULES:
- No <div> — components do all layout/spacing, page frame included.
- Frame first: read `astryx docs layout` before writing any page or screen — page frame, region widths, breakpoint behavior.
- Dense data = rows (Table, List/Item), never Card-wrapped list items; Card is for standalone widgets. Status = StatusDot/Token; Badge = counts only.
- Custom styling: component props first; else style/className with tokens — var(--color-*|--spacing-*|--radius-*). No raw hex/px. (No StyleX/Tailwind compiler here — don't use xstyle/utility classes.)
- Tokens for every value (`astryx docs tokens`). Brand/accent belongs in the theme (`astryx theme list` / `theme add <slug>`, or `astryx theme template` for a custom one) — never override --color-* in :root.
- SELF-CHECK before you finish: re-read the file and replace any raw <div>/<span> layout, imported .css/@apply, or hardcoded value (#hex, 16px) with the component or a token (var(--color-*|--spacing-*|…)). If unsure a component/prop exists, run `astryx component <Name>` / `astryx search "<thing>"`; don't hand-roll CSS.

MORE CLI:
  search "<query>"   find any component / hook / doc / template / block
  component --list   163 components by category
  template --list    page + block recipes
  docs <topic>       browser-support, cli-integrations, color, elevation, getting-started, icons, illustrations, internationalization, layout, migration, motion, principles, shape, spacing, styling-libraries, styling, theme, tokens, typography, working-with-ai
  swizzle <Name>     eject component source for deep customization
  upgrade --apply    run after any @astryxdesign/core bump
<!-- ASTRYX:END -->
