import { Component, computed, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { TooltipDirective } from '../tooltip/tooltip.directive';
import { SwitcherOption, SwitcherSize, SwitcherVariant } from './switcher.model';

@Component({
  selector: 'app-switcher',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TooltipDirective],
  templateUrl: './switcher.component.html',
  styleUrl: './switcher.component.scss',
  host: {
    '[class.switcher-host--full]': 'fullWidth()'
  }
})
export class SwitcherComponent<T = string> {
  readonly options = input<SwitcherOption<T>[]>([]);
  readonly value = model<T | undefined>(undefined);
  readonly size = input<SwitcherSize>('sm');
  readonly variant = input<SwitcherVariant>('filled');
  readonly compact = input<boolean>(false);
  readonly iconOnly = input<boolean>(false);
  readonly fullWidth = input<boolean>(false);
  readonly ariaLabel = input<string>('');

  readonly iconSize = computed(() => (this.size() === 'sm' ? 12 : this.size() === 'lg' ? 16 : 15));

  select(option: SwitcherOption<T>): void {
    if (!option.disabled && option.value !== this.value()) {
      this.value.set(option.value);
    }
  }
}
