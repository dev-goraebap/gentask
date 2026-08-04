import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('앱 셸은 라우터 아웃렛을 그린다', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('전환 오버레이는 보이지 않는 동안 접근성 트리에서 빠진다', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    // 요소는 항상 DOM에 있고 투명도만 바뀐다(삽입되는 요소에는 CSS 전환이 걸리지 않는다).
    // 그래서 "보이지 않음"을 aria-hidden이 따로 말해 주어야 한다.
    const overlay = (fixture.nativeElement as HTMLElement).querySelector(
      'app-transition-overlay div',
    );
    expect(overlay?.getAttribute('aria-hidden')).toBe('true');
  });
});
