import { RequestState } from '@/shared/ui/request-state';
import { useRouter, type ErrorComponentProps } from '@tanstack/react-router';

export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  return <RequestState error={error} retry={() => { void router.invalidate().then(reset); }} />;
}
