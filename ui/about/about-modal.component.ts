import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ExternalLink, Github, Linkedin, Mail, Globe } from 'lucide-angular';
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
  readonly mailIcon = Mail;
  readonly globeIcon = Globe;

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

  get websiteUrl(): string {
    return this.aboutText.websiteUrl ?? 'https://kmd-labs.org/';
  }

  get contactMailto(): string {
    const a = this.aboutText;
    const email = a.contactEmail ?? 'hello@kmd-labs.org';
    const subject = encodeURIComponent(a.contactMailSubject ?? 'Project Inquiry · KMD Labs');
    const body = encodeURIComponent(
      a.contactMailBody ??
        'Hello KMD Labs team,\n\nI would like to discuss an interactive data visualization or geospatial application project.\n\nBest regards,'
    );
    return `mailto:${email}?subject=${subject}&body=${body}`;
  }
}
