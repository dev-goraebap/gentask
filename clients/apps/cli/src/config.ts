import { chmodSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

/**
 * 붙을 자리와 자격.
 *
 * <p>규격은 결정-0013 이 갖는다.
 */
export interface Config {
  readonly baseUrl: string;
  readonly token: string;
  /** 지금 프로젝트의 접두어. 작업 아이템 명령이 이것 아래에서 돈다. 없으면 명령이 그때 알린다. */
  readonly projectKey: string | null;
}

export const DEFAULT_BASE_URL = 'https://api.gentask.xyz';

/** 토큰이 없을 때 사용자에게 보일 말. 무엇을 어디서 해야 하는지까지 담는다. */
export const MISSING_TOKEN = [
  '토큰이 없습니다. gentask.xyz 의 계정 화면에서 에이전트 토큰을 발급한 뒤',
  '',
  '  gentask auth login',
  '',
  '을 실행하세요. GENTASK_TOKEN 으로 넘겨도 됩니다.',
].join('\n');

/**
 * 저장된 자격이 사는 자리.
 *
 * <p>XDG 를 따르되 그 변수가 없으면 홈 아래 `.config` 로 간다. 리눅스와 맥은 이것이 관례이고,
 * 윈도우에는 XDG 가 없으나 홈 아래에 나는 것이 사용자가 찾기 쉽다.
 */
export function configPath(env: NodeJS.ProcessEnv = process.env): string {
  const base = env['XDG_CONFIG_HOME']?.trim() || join(homedir(), '.config');
  return join(base, 'gentask', 'config.json');
}

interface StoredConfig {
  token?: string;
  projectKey?: string;
}

function readStored(env: NodeJS.ProcessEnv): StoredConfig {
  try {
    return JSON.parse(readFileSync(configPath(env), 'utf8')) as StoredConfig;
  } catch {
    return {};
  }
}

/** 저장된 토큰. 파일이 없거나 읽을 수 없으면 없는 것으로 본다. */
export function readStoredToken(env: NodeJS.ProcessEnv = process.env): string | null {
  return readStored(env).token?.trim() || null;
}

/** 저장된 프로젝트 접두어. */
export function readStoredProject(env: NodeJS.ProcessEnv = process.env): string | null {
  return readStored(env).projectKey?.trim() || null;
}

/**
 * 지금 프로젝트를 저장한다. 토큰은 그대로 둔다.
 *
 * <p>프로젝트를 고르는 일이 자격을 다시 받는 일이 되어서는 안 되므로 두 값을 따로 쓴다.
 */
export function storeProject(projectKey: string, env: NodeJS.ProcessEnv = process.env): string {
  const path = configPath(env);
  const stored = readStored(env);
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  writeFileSync(path, `${JSON.stringify({ ...stored, projectKey }, null, 2)}\n`, { mode: 0o600 });
  chmodSync(path, 0o600);
  return path;
}

/**
 * 토큰을 저장한다.
 *
 * <p>소유자만 읽을 수 있게 둔다. 같은 기계의 다른 사용자가 읽을 수 있으면 그 계정의 전권이 함께
 * 넘어간다. TG-011 의 #8 이 이것이다.
 */
export function storeToken(token: string, env: NodeJS.ProcessEnv = process.env): string {
  const path = configPath(env);
  const stored = readStored(env);
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  writeFileSync(path, `${JSON.stringify({ ...stored, token }, null, 2)}\n`, { mode: 0o600 });
  chmodSync(path, 0o600);
  return path;
}

/** 저장된 자격을 지운다. 없었으면 false 를 낸다. */
export function clearToken(env: NodeJS.ProcessEnv = process.env): boolean {
  const path = configPath(env);
  if (readStoredToken(env) === null) {
    return false;
  }
  rmSync(path, { force: true });
  return true;
}

/**
 * 자격을 찾는다. 환경이 파일을 이긴다.
 *
 * <p>환경변수는 그 프로세스 하나에만 걸리므로, 저장해 둔 것을 건드리지 않고 다른 계정이나 다른
 * 서버를 한 번 볼 수 있다. TG-011 의 #9 가 이것이다.
 */
export function readConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const token = env['GENTASK_TOKEN']?.trim() || readStoredToken(env);
  if (!token) {
    throw new Error(MISSING_TOKEN);
  }
  return {
    baseUrl: (env['GENTASK_BASE_URL']?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, ''),
    token,
    projectKey: env['GENTASK_PROJECT']?.trim() || readStoredProject(env),
  };
}
