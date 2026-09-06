import KanbanIcon from '@hugeicons/core-free-icons/KanbanIcon';
import { SvgIcon } from './SvgIcon';
export function HgiViewBoard({ size = 20 }: { readonly size?: number }) { return <SvgIcon data={KanbanIcon} size={size} />; }
