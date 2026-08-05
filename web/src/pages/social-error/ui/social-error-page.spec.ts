import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SocialErrorPage } from './social-error-page';

describe('SocialErrorPage', () => {
  let fixture: ComponentFixture<SocialErrorPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocialErrorPage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SocialErrorPage);
    await fixture.whenStable();
  });

  async function 사유(value?: string): Promise<string> {
    if (value !== undefined) {
      fixture.componentRef.setInput('reason', value);
    }
    await fixture.whenStable();
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('AUTH-02·03 사유가 없으면 사유를 지어내지 않는다', async () => {
    // 서버는 제공자 응답에 계정 정보가 섞일 수 있어 실패 사유를 노출하지 않는다.
    // 화면이 추측해 채우면 그 설계가 무너진다.
    expect(await 사유()).toContain('로그인을 완료하지 못했습니다');
  });

  it('AUTH-02·03 서버가 준 사유는 사용자 문구로 옮긴다', async () => {
    expect(await 사유('unsupported')).toContain('지원하지 않는 로그인 방법');
    expect(await 사유('auth_otp_rate_limited')).toContain('요청이 너무 잦습니다');
  });

  it('모르는 사유는 기본 문구로 되돌아간다', async () => {
    expect(await 사유('made-up-value')).toContain('로그인을 완료하지 못했습니다');
  });

  it('AUTH-02·03 다시 시도할 경로를 화면에 둔다', async () => {
    await 사유();

    // 실패 화면의 존재 이유는 "무엇을 할 수 있는가"를 주는 것이다
    const links = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('a[href]'),
    ).map((a) => a.getAttribute('href'));

    expect(links).toContain('/oauth2/authorization/google');
    expect(links).toContain('/oauth2/authorization/kakao');
  });
});
