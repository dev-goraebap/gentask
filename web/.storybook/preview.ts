import type { Preview } from '@storybook/angular-vite';

// 앱과 같은 전역 스타일을 쓴다 — 워크벤치에서 보이는 것이 앱에서 보이는 것과 같아야 한다.
import '../src/styles.css';

// 애플리케이션 프로바이더를 여기서 추가하지 않는다.
// web/은 zoneless이고(angular.json에 polyfills 없음) 앱도 별도 프로바이더 없이 동작한다.
// 워크벤치만 다른 변경 감지 설정을 쓰면 한쪽에서만 재현되는 버그가 생긴다.
const preview: Preview = {
  parameters: {
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/ },
    },
  },
};

export default preview;
