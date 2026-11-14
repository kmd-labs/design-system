export type SwitcherSize = 'sm' | 'md' | 'lg';
export type SwitcherVariant = 'filled' | 'ghost';

export interface SwitcherOption<T = string> {
  value: T;
  /** Primary visible label rendered inside the segmented option. */
  label: string;
  /** Optional compact label shown when compact mode is active (e.g. "2D" / "3D"). */
  shortLabel?: string;
  /** Optional Lucide icon displayed next to the label. */
  icon?: any;
  /** Optional tooltip shown on hover/focus. */
  tooltip?: string;
  disabled?: boolean;
}
