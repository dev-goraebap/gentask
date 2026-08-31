#!/usr/bin/env node
import { run } from './cli.js';

/**
 * 명령이 들어오는 자리.
 *
 * <p>기계가 읽는 것은 표준출력으로, 사람에게 하는 말은 표준오류로 낸다. 파이프로 이어 붙일 때
 * 안내나 오류가 섞이면 받는 쪽이 그것까지 파싱한다.
 */
async function main(): Promise<void> {
  const outcome = await run(process.argv.slice(2));
  if (outcome.out) {
    process.stdout.write(`${outcome.out}\n`);
  }
  process.exitCode = outcome.code;
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
