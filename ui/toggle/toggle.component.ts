import { Component, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipDirective } from '../tooltip/tooltip.directive';

export type ToggleSize = 'sm' | 'md';

@Component({
  selector: 'app-toggle',
  standalone: true,
  imports: [CommonModule, TooltipDirective],
  templateUrl: './toggle.component.html',
  styleUrl: './toggle.component.scss',
  host: {
    '[class.toggle-host--block]': 'fullWidth()'
  }
})
export class ToggleComponent {
  readonly checked = model<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly label = input<string>('');
  readonly description = input<string>('');
  readonly size = input<ToggleSize>('md');
  readonly fullWidth = input<boolean>(false);
  readonly swatchColor = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null);
  readonly tooltipText = input<string | null>(null);

  onToggle(): void {
    if (!this.disabled()) {
      this.checked.update((value) => !value);
    }
  }
}
