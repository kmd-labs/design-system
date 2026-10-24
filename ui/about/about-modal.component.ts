import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ExternalLink, Github, Linkedin } from 'lucide-angular';
import { AboutText, TeamMember } from './about.model';
import { ABOUT_DICTS, TEAM_MEMBERS } from './about.data';
import { AboutService } from './about.service';

/**
 * Shared KMD Labs "About us" modal dialog component.
 * Displays the team behind KMD Labs, CASSINI hackathon credentials, bios, and links.
 */
@Component({
  selector: 'app-about-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './about-modal.component.html',
  styleUrl: './about-modal.component.scss'
})
export class AboutModalComponent {
  private readonly aboutService = inject(AboutService, { optional: true });

  @Input() lang?: 'en' | 'pl' | 'es';
  @Input() data?: AboutText;
  @Input() team: TeamMember[] = TEAM_MEMBERS;

  readonly linkedinIcon = Linkedin;
  readonly githubIcon = Github;
  readonly refIcon = ExternalLink;

  get resolvedLang(): 'en' | 'pl' | 'es' {
    if (this.lang && (this.lang === 'en' || this.lang === 'pl' || this.lang === 'es')) {
      return this.lang;
    }
    const serviceLang = this.aboutService?.currentLang();
    if (serviceLang && (serviceLang === 'en' || serviceLang === 'pl' || serviceLang === 'es')) {
      return serviceLang;
    }
    if (typeof document !== 'undefined') {
      const docLang = document.documentElement.lang?.slice(0, 2);
      if (docLang === 'pl' || docLang === 'es' || docLang === 'en') {
        return docLang;
      }
    }
    return 'en';
  }

  get aboutText(): AboutText {
    if (this.data) return this.data;
    return ABOUT_DICTS[this.resolvedLang] ?? ABOUT_DICTS.en;
  }
}
