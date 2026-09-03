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
  // 곧바로 끊지 않는다. 앞선 요청이 남긴 소켓이 닫히는 중에 process.exit 를 부르면 윈도우에서
  // libuv 가 어서션으로 죽고 종료 코드가 1 이 아니라 3221226505 가 된다. 그러면 코드로 갈라
  // 판단하는 스크립트가 속는다. 값만 정해 두면 남은 것이 정리된 뒤에 그 코드로 끝난다.
  process.exitCode = 1;
});
