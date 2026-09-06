import FilterHorizontalIcon from '@hugeicons/core-free-icons/FilterHorizontalIcon';
import { SvgIcon } from './SvgIcon';

export function HgiFilter({ size = 20 }: { readonly size?: number }) {
  return <SvgIcon data={FilterHorizontalIcon} size={size} />;
}
