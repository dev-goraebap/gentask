import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { ApiError } from '@/shared/api';
import { SessionApi, SessionStore, type UserSession } from '@/shared/auth';

import { DevicesPage } from './devices-page';

function 세션(overrides: Partial<UserSession> = {}): UserSession {
  return {
    id: 's-1',
    ipAddress: '203.0.113.10',
    userAgent: 'Mozilla/5.0 (Macintosh)',
    lastUsedAt: '2026-08-05T01:00:00Z',
    createdAt: '2026-08-01T01:00:00Z',
    current: false,
    ...overrides,
  };
}

class 가짜세션API {
  목록: UserSession[] = [];
  무효화한것: string[] = [];
  무효화실패: ApiError | null = null;

  activeSessions(): Promise<UserSession[]> {
    return Promise.resolve(this.목록);
  }

  revokeSession(sessionId: string): Promise<void> {
    this.무효화한것.push(sessionId);
    return this.무효화실패 ? Promise.reject(this.무효화실패) : Promise.resolve();
  }
}

class 가짜세션저장소 {
  만료처리횟수 = 0;

  markExpired(): void {
    this.만료처리횟수 += 1;
  }
}

describe('DevicesPage', () => {
  let api: 가짜세션API;
  let store: 가짜세션저장소;
  let fixture: ComponentFixture<DevicesPage>;
  let 이동경로: string[];

  async function 화면(sessions: UserSession[]): Promise<ComponentFixture<DevicesPage>> {
    fixture = TestBed.createComponent(DevicesPage);
    fixture.componentRef.setInput('sessions', sessions);
    await fixture.whenStable();
    return fixture;
  }

  beforeEach(async () => {
    api = new 가짜세션API();
    store = new 가짜세션저장소();
    이동경로 = [];

    await TestBed.configureTestingModule({
      imports: [DevicesPage],
      providers: [
        provideRouter([]),
        { provide: SessionApi, useValue: api },
        { provide: SessionStore, useValue: store },
      ],
    }).compileComponents();

    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockImplementation((url) => {
      이동경로.push(String(url));
      return Promise.resolve(true);
    });
  });

  function 본문(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function 버튼들(): HTMLButtonElement[] {
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    );
  }

  it('AUTH-06 리졸버가 넘긴 목록을 로딩 분기 없이 바로 그린다', async () => {
    await 화면([세션(), 세션({ id: 's-2', userAgent: 'Mozilla/5.0 (Windows)' })]);

    expect(본문()).toContain('Mozilla/5.0 (Macintosh)');
    expect(본문()).toContain('Mozilla/5.0 (Windows)');
    expect(본문()).toContain('203.0.113.10');
  });

  it('AUTH-06 공격자 통제 값인 userAgent를 마크업으로 해석하지 않는다', async () => {
    // 자기 로그인 요청에 임의의 User-Agent를 넣을 수 있다(server/docs/references/API-설계.md §6.1).
    // innerHTML을 쓰면 이 자리에서 자기 화면 한정 XSS가 된다.
    const 공격 = '<img src=x onerror="alert(1)">';
    await 화면([세션({ userAgent: 공격 })]);

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('img')).toBeNull();
    expect(본문()).toContain(공격);
  });

  it('AUTH-06 현재 기기를 구분해 보여준다', async () => {
    await 화면([
      세션({ id: 's-1', current: true }),
      세션({ id: 's-2', userAgent: 'Mozilla/5.0 (Windows)' }),
    ]);

    // 사용자가 실수로 자기 기기를 끊지 않게 하는 유일한 단서다
    expect(본문()).toContain('현재 기기');
    expect(본문()).toContain('이 기기 로그아웃');
  });

  it('AUTH-06 다른 기기를 로그아웃하면 목록을 다시 불러온다', async () => {
    await 화면([
      세션({ id: 's-1', current: true }),
      세션({ id: 's-2', userAgent: 'Mozilla/5.0 (Windows)' }),
    ]);
    api.목록 = [세션({ id: 's-1', current: true })];

    버튼들()[1].click();
    await fixture.whenStable();

    expect(api.무효화한것).toEqual(['s-2']);
    expect(본문()).not.toContain('Mozilla/5.0 (Windows)');
    expect(이동경로).toEqual([]);
  });

  it('AUTH-06 자기 세션을 끊으면 로컬 상태를 맞추고 로그인으로 보낸다', async () => {
    await 화면([세션({ id: 's-1', current: true })]);

    버튼들()[0].click();
    await fixture.whenStable();

    // 서버가 쿠키까지 지웠으므로 목록을 다시 불러 봐야 401이다
    expect(api.무효화한것).toEqual(['s-1']);
    expect(store.만료처리횟수).toBe(1);
    expect(이동경로).toEqual(['/login']);
  });

  it('로그아웃이 실패하면 목록을 그대로 두고 사유를 보여준다', async () => {
    api.무효화실패 = new ApiError('server', '서버에 문제가 생겼습니다.', 503);
    await 화면([
      세션({ id: 's-1', current: true }),
      세션({ id: 's-2', userAgent: 'Mozilla/5.0 (Windows)' }),
    ]);

    버튼들()[1].click();
    await fixture.whenStable();

    expect(본문()).toContain('서버에 문제가 생겼습니다.');
    expect(본문()).toContain('Mozilla/5.0 (Windows)');
  });
});
