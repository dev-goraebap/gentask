import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

test('배포 CSS는 하위 요소의 모드 전환을 위해 light-dark()를 유지한다', async () => {
  const result = await build({
    configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
    logLevel: 'silent',
    build: {
      write: false,
      rollupOptions: {
        input: fileURLToPath(new URL('../src/app/styles/gentask.css', import.meta.url)),
      },
    },
  });
  const outputs = (Array.isArray(result) ? result : [result]).flatMap(result => 'output' in result ? result.output : []);
  const css = outputs.filter(output => output.type === 'asset' && output.fileName.endsWith('.css'))
    .map(output => String(output.source)).join('\n');
  assert.match(css, /--color-background-body:\s*light-dark\(/);
  assert.doesNotMatch(css, /--lightningcss-(?:light|dark)/);
});
