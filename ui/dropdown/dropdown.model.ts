export type BlurToken =
  | 'none'
  | 'xs'
  | 'delicate'
  | 'sm'
  | 'md'
  | 'base'
  | 'panel'
  | 'lg'
  | 'xl'
  | 'heavy';

export interface DropdownOption<T = string> {
  value: T;
  /** Full label displayed inside the dropdown menu (e.g. "English", "Polski", "Español"). */
  label: string;
  /** Optional compact code/label shown on the trigger button (e.g. "EN", "PL", "ES"). */
  shortLabel?: string;
  /** Optional secondary badge or description in the menu item. */
  badge?: string;
  icon?: any;
  /** Special action decorator/style, e.g. high-contrast accent button for contact or primary CTAs. */
  cta?: boolean;
  variant?: 'default' | 'cta';
}
