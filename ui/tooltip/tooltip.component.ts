import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X } from 'lucide-angular';
import { TooltipService } from './tooltip.service';

@Component({
  selector: 'app-tooltip',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './tooltip.component.html',
  styleUrl: './tooltip.component.scss'
})
export class TooltipComponent {
  readonly tooltip = inject(TooltipService);
  readonly xIcon = X;

  onCloseClick(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    this.tooltip.close();
  }
}
