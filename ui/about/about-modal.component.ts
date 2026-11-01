import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ExternalLink, Github, Linkedin, Mail, Globe } from 'lucide-angular';
import { AboutText, TeamMember } from './about.model';
import { ABOUT_DICTS, TEAM_MEMBERS } from './about.data';
import { AboutService } from './about.service';

/**
 * Resolves the active site language for contact actions.
 * Inspects explicit parameter, document.documentElement.lang, and localStorage (*.lang).
 * If the detected language is 'pl', returns 'pl'.
 * If it is anything else than 'pl' or 'en' (e.g. 'es', 'de', 'fr', fallback), returns 'en'.
 */
export function resolveSiteMailLang(explicitLang?: string): 'en' | 'pl' {
  const normalize = (l?: string | null): 'en' | 'pl' | null => {
    if (!l) return null;
    const prefix = l.trim().toLowerCase().slice(0, 2);
    if (prefix === 'pl') return 'pl';
    if (prefix === 'en') return 'en';
    // Anything else than 'pl' or 'en' strictly falls back to 'en'
    return 'en';
  };

  if (explicitLang) {
    const res = normalize(explicitLang);
    if (res) return res;
  }

  if (typeof document !== 'undefined') {
    const docLang = normalize(document.documentElement.lang);
    if (docLang) return docLang;
  }

  if (typeof localStorage !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.endsWith('.lang') || key === 'lang' || key === 'locale')) {
          const stored = normalize(localStorage.getItem(key));
          if (stored) return stored;
        }
      }
    } catch {
      // localStorage may be restricted in sandboxed environments
    }
  }

  if (typeof navigator !== 'undefined') {
    const candidates = [
      ...(Array.isArray(navigator.languages) ? navigator.languages : []),
      navigator.language
    ].filter(Boolean);

    for (const c of candidates) {
      const navLang = normalize(c);
      if (navLang) return navLang;
    }
  }

  return 'en';
}

/**
 * Generates the standardized prefilled mailto URL for KMD Labs inquiries.
 * Automatically formats subject and inquiry body in Polish if the site is in 'pl',
 * or English if in 'en' or any other language.
 */
export function getContactMailtoUrl(explicitLang?: string): string {
  const mailLang = resolveSiteMailLang(explicitLang);
  const a = ABOUT_DICTS[mailLang] ?? ABOUT_DICTS.en;
  const email = a.contactEmail ?? 'hello@kmd-labs.org';
  const subject = encodeURIComponent(a.contactMailSubject ?? 'Project Inquiry · KMD Labs');
  const body = encodeURIComponent(
    a.contactMailBody ??
      'Hello KMD Labs team,\n\nI would like to discuss an interactive data visualization or geospatial application project.\n\nBest regards,'
  );
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

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
    // Read the site language: 'pl' for Polish, or 'en' for any other language
    const siteLang = this.lang ?? this.aboutService?.currentLang();
    return getContactMailtoUrl(siteLang);
  }
}
