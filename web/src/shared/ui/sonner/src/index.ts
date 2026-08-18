import { HlmToaster } from './lib/hlm-toaster';

export * from './lib/hlm-toaster';

/*
 * 토스트를 띄우는 함수를 helm 배럴이 함께 내보냅니다. 화면이 brain 을 직접 임포트하면
 * 프리미티브 교체가 사용처 전부를 건드리는 일이 됩니다. 02-package-structure.md 7.4절.
 */
export { toast } from '@spartan-ng/brain/sonner';

export const HlmToasterImports = [HlmToaster] as const;
