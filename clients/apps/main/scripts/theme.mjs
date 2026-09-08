import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const app = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = 'themes/gentaskTheme.ts';
const output = 'src/app/styles/gentask.css';
const check = process.argv.includes('--check');
const tempRoot = resolve(tmpdir());
const temp = mkdtempSync(join(tempRoot, 'gentask-theme-'));
const generated = join(temp, 'gentask.css');
const extensions = ['css', 'js', 'd.ts', 'variants.d.ts'];

// 생성 주석의 경로만 정규화하여 Windows와 Linux의 산출물을 동일하게 비교한다.
function normalize(text) {
  return text.replace(/\r\n/g, '\n').replace(/^\/\*[\s\S]*?\*\//, header =>
    header.replace(/\\/g, '/').replace(/^ \* Source:.*$/m, ` * Source: ${source}`)
      .replace(/^ \* Command:.*$/m, ` * Command: astryx theme build ${source} --out ${output}`));
}

try {
  const result = spawnSync(process.execPath, [require.resolve('@astryxdesign/cli'), 'theme', 'build', source, '-o', generated], { cwd: app, encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || '테마 생성 실패');
  const stale = [];
  for (const extension of extensions) {
    const expected = normalize(readFileSync(join(temp, `gentask.${extension}`), 'utf8'));
    const target = join(app, 'src/app/styles', `gentask.${extension}`);
    if (check) {
      if (!existsSync(target) || normalize(readFileSync(target, 'utf8')) !== expected) stale.push(target);
    } else {
      writeFileSync(target, expected);
    }
  }
  if (stale.length) throw new Error(`테마 산출물을 갱신하세요: npm run theme:build\n${stale.join('\n')}`);
  console.log(check ? '테마 산출물이 최신입니다.' : '테마 산출물을 갱신했습니다.');
} finally {
  if (dirname(resolve(temp)) !== tempRoot) throw new Error('임시 디렉터리 경로가 일치하지 않습니다.');
  rmSync(temp, { recursive: true, force: true });
}
