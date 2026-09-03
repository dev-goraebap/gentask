import { chmodSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

/**
 * CLI 연결 설정 및 인증 자격 증명 인터페이스다.
 */
export interface Config {
  readonly baseUrl: string;
  readonly token: string;
  /** 현재 작업 디렉터리에 설정된 프로젝트 식별자다. */
  readonly projectId: string | null;
}

export const DEFAULT_BASE_URL = 'https://gentask.xyz';

/** 인증 토큰 미설정 시 출력할 가이드 메시지다. */
export const MISSING_TOKEN = [
  '토큰이 없습니다. gentask.xyz 의 계정 화면에서 에이전트 토큰을 발급한 뒤',
  '',
  '  gentask auth login',
  '',
  '을 실행하세요. GENTASK_TOKEN 으로 넘겨도 됩니다.',
].join('\n');

/**
 * CLI 설정 파일 경로를 반환한다.
 *
 * XDG_CONFIG_HOME 환경 변수가 설정되어 있으면 해당 경로를 따르고, 없으면 홈 디렉터리의 .config/gentask/config.json 경로를 반환한다.
 */
export function configPath(env: NodeJS.ProcessEnv = process.env): string {
  const base = env['XDG_CONFIG_HOME']?.trim() || join(homedir(), '.config');
  return join(base, 'gentask', 'config.json');
}

interface StoredConfig {
  token?: string;
  /**
   * 작업 디렉터리 경로별 매핑된 프로젝트 식별자 목록이다.
   */
  projects?: Record<string, string>;
  /** 인증 토큰과 매핑된 대상 API 서버 주소다. */
  baseUrl?: string;
}

function readStored(env: NodeJS.ProcessEnv): StoredConfig {
  try {
    return JSON.parse(readFileSync(configPath(env), 'utf8')) as StoredConfig;
  } catch {
    return {};
  }
}

/** 저장된 인증 토큰을 반환하며 파일이 없거나 읽을 수 없으면 null을 반환한다. */
export function readStoredToken(env: NodeJS.ProcessEnv = process.env): string | null {
  return readStored(env).token?.trim() || null;
}

/** 저장된 API 서버 기본 주소를 반환한다. */
export function readStoredBaseUrl(env: NodeJS.ProcessEnv = process.env): string | null {
  return readStored(env).baseUrl?.trim() || null;
}

/** 디렉터리 경로의 역슬래시 및 대소문자를 정규화하여 키로 반환한다. */
function normalize(where: string): string {
  return where.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
}

/**
 * 현재 작업 디렉터리에 매핑된 프로젝트 식별자를 조회한다.
 *
 * 하위 디렉터리에서 실행 시 상위 디렉터리의 설정을 상속 탐색한다.
 */
export function readStoredProject(
  env: NodeJS.ProcessEnv = process.env,
  cwd: string = process.cwd(),
): string | null {
  const projects = readStored(env).projects ?? {};
  const here = normalize(cwd);

  let longest = '';
  let found: string | null = null;
  for (const [where, projectId] of Object.entries(projects)) {
    const candidate = normalize(where);
    if (here !== candidate && !here.startsWith(`${candidate}/`)) continue;
    if (candidate.length <= longest.length) continue;
    longest = candidate;
    found = projectId.trim() || null;
  }
  return found;
}

/**
 * 현재 작업 디렉터리에 대상 프로젝트 식별자를 저장한다.
 */
export function storeProject(
  projectId: string,
  env: NodeJS.ProcessEnv = process.env,
  cwd: string = process.cwd(),
): string {
  const path = configPath(env);
  const stored = readStored(env);
  const projects = { ...(stored.projects ?? {}), [normalize(cwd)]: projectId };
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  writeFileSync(path, `${JSON.stringify({ ...stored, projects }, null, 2)}\n`, { mode: 0o600 });
  chmodSync(path, 0o600);
  return path;
}

/**
 * 인증 토큰 및 서버 주소를 소유자 전용 권한(0600)으로 파일에 저장한다.
 */
export function storeToken(
  token: string,
  baseUrl: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const path = configPath(env);
  const stored = readStored(env);
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  writeFileSync(path, `${JSON.stringify({ ...stored, token, baseUrl }, null, 2)}\n`, {
    mode: 0o600,
  });
  chmodSync(path, 0o600);
  return path;
}

/** 저장된 인증 설정을 삭제한다. */
export function clearToken(env: NodeJS.ProcessEnv = process.env): boolean {
  const path = configPath(env);
  if (readStoredToken(env) === null) {
    return false;
  }
  rmSync(path, { force: true });
  return true;
}

/**
 * 현재 유효한 프로젝트 식별자를 반환하며, 미설정 시 설정 가이드 오류를 던진다.
 */
export function currentProject(env: NodeJS.ProcessEnv = process.env): string {
  const projectId = readConfig(env).projectId;
  if (projectId === null) {
    throw new Error(
      [
        '이 자리의 프로젝트가 정해지지 않았습니다. 아래를 차례로 실행하면 정해집니다.',
        '',
        '  gentask project list           내 프로젝트와 그 식별자를 봅니다',
        '  gentask project use <식별자>   이 자리의 프로젝트로 둡니다',
        '',
        '고른 것은 지금 디렉터리에 매여 저장되므로 다른 저장소의 것을 건드리지 않습니다.',
        '한 번만 다른 것을 보려면 GENTASK_PROJECT 로 넘깁니다.',
      ].join('\n'),
    );
  }
  return projectId;
}

/**
 * 현재 CLI 설정을 로드한다. 환경 변수 설정이 저장된 설정 파일보다 우선한다.
 */
export function readConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const token = env['GENTASK_TOKEN']?.trim() || readStoredToken(env);
  if (!token) {
    throw new Error(MISSING_TOKEN);
  }
  return {
    /*
     * 저장된 서버 주소가 기본 주소보다 우선 적용된다.
     */
    baseUrl: (
      env['GENTASK_BASE_URL']?.trim() ||
      readStoredBaseUrl(env) ||
      DEFAULT_BASE_URL
    ).replace(/\/+$/, ''),
    token,
    projectId: env['GENTASK_PROJECT']?.trim() || readStoredProject(env),
  };
}
