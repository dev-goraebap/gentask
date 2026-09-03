#!/usr/bin/env node
import { run } from './cli.js';

/**
 * CLI 메인 진입점.
 *
 * 결과 데이터는 표준 출력(stdout)으로 출력하고 오류 및 안내 메시지는 표준 오류(stderr)로 분리 출력한다.
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
  // 곧바로 끊지 않는다. 앞선 요청이 남긴 소켓이 닫히는 중에 process.exit 를 부르면 윈도우에서
  // libuv 가 어서션으로 죽고 종료 코드가 1 이 아니라 3221226505 가 된다. 그러면 코드로 갈라
  // 판단하는 스크립트가 속는다. 값만 정해 두면 남은 것이 정리된 뒤에 그 코드로 끝난다.
  process.exitCode = 1;
});
