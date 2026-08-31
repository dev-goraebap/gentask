/**
 * 붙을 자리와 자격.
 *
 * <p>토큰은 환경에서만 온다. 파일에 쓰거나 어딘가에 보관하지 않으며 프로세스가 사는 동안만 있다.
 * 규격은 결정-0013 이 갖는다.
 */
export interface Config {
  readonly baseUrl: string;
  readonly token: string;
}

export const DEFAULT_BASE_URL = 'https://api.todogen.app';

/** 토큰이 없을 때 사용자에게 보일 말. 무엇을 어디서 해야 하는지까지 담는다. */
export const MISSING_TOKEN =
  'TODOGEN_TOKEN 이 없습니다. todogen 의 계정 화면에서 에이전트 토큰을 발급해 이 MCP 서버의 설정에 두세요.';

/**
 * 환경에서 설정을 읽는다. 토큰이 없으면 붙기 전에 멈춘다.
 *
 * <p>없는 채로 보내면 거절만 돌아오고 사용자는 그 이유를 알 자리가 없다. AGT-001 의 A1 이 이것이다.
 */
export function readConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const token = env['TODOGEN_TOKEN']?.trim();
  if (!token) {
    throw new Error(MISSING_TOKEN);
  }
  return {
    baseUrl: (env['TODOGEN_BASE_URL']?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, ''),
    token,
  };
}
