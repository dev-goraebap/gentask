import { type TaskViewKey } from '@/entities/task';
import {
    HgiCalendar,
    HgiCheckCircle,
    HgiStar,
    HgiSun
} from '@/shared/ui/icons';

export function ViewIcon({ view }: { readonly view: TaskViewKey }) {
  if (view === 'my-day') return <HgiSun size={16} />;
  if (view === 'important') return <HgiStar size={16} />;
  if (view === 'planned') return <HgiCalendar size={16} />;
  return <HgiCheckCircle size={16} />;
}
