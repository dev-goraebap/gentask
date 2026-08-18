/*
 * hlm 만 내보냅니다. provideSpartanHlm 은 같은 배럴에 두지 않습니다.
 *
 * 그 함수가 @angular/cdk/overlay 의 토큰을 임포트하는데, 이 배럴은 hlm-button 을 비롯한
 * 거의 모든 helm 이 클래스 병합을 위해 거쳐 가는 자리입니다. 셸에 버튼 하나만 있어도
 * CDK 오버레이 모듈이 초기 번들의 그래프에 올라오고, 그 뒤 어느 화면이 오버레이를
 * 실제로 쓰기 시작하면 구현 46kB 가 지연 청크가 아니라 초기 번들에 눌러앉습니다.
 *
 * 프로바이더는 @/shared/ui/utils/providers 로 따로 가져갑니다.
 * 근거는 docs/architecture/references/02-package-structure.md 7.4절입니다.
 */
export * from './lib/hlm';
