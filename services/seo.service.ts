import { ENVIRONMENT_INITIALIZER, EnvironmentProviders, Injectable, makeEnvironmentProviders } from '@angular/core';

export interface SeoMetaConfig {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  image?: string;
  imageAlt?: string;
  siteName?: string;
  type?: 'website' | 'article';
  locale?: string;
  localesAlternate?: string[];
  currentLang?: string;
  supportedLangs?: string[];
  faviconBasePath?: string;
}

/**
 * Automatically provisions the official KMD orange circle favicon into the document `<head>`.
 * Injects or updates both:
 * 1. Modern SVG favicon (`type="image/svg+xml"`, `href="assets/design-system/favicon.svg"`).
 * 2. Legacy ICO fallback icon (`type="image/x-icon"`, `href="assets/design-system/favicon.ico"`).
 *
 * Safe to call repeatedly and during SSR (no-op if document is undefined).
 */
export function provisionFavicon(basePath = 'assets/design-system'): void {
  if (typeof document === 'undefined') return;

  const cleanBase = basePath.replace(/\/$/, '');
  const svgHref = `${cleanBase}/favicon.svg`;
  const icoHref = `${cleanBase}/favicon.ico`;

  // 1. Primary SVG favicon (crisp modern vector orange circle)
  let svgLink = document.querySelector<HTMLLinkElement>('link[rel~="icon"][type="image/svg+xml"]');
  if (!svgLink) {
    svgLink = document.createElement('link');
    svgLink.rel = 'icon';
    svgLink.type = 'image/svg+xml';
    document.head.appendChild(svgLink);
  }
  svgLink.href = svgHref;

  // 2. Legacy / alternate ICO favicon
  let icoLink = document.querySelector<HTMLLinkElement>(
    'link[rel="alternate icon"], link[rel~="icon"]:not([type="image/svg+xml"])'
  );
  if (!icoLink) {
    icoLink = document.createElement('link');
    icoLink.rel = 'alternate icon';
    icoLink.type = 'image/x-icon';
    document.head.appendChild(icoLink);
  }
  icoLink.href = icoHref;
}

/**
 * Angular environment provider that automatically provisions the KMD orange circle
 * favicon into `<head>` at application startup.
 */
export function provideKmdFavicon(basePath = 'assets/design-system'): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: ENVIRONMENT_INITIALIZER,
      multi: true,
      useValue: () => provisionFavicon(basePath)
    }
  ]);
}

/**
 * Standardized SEO & Social Media Metadata Service for KMD Labs applications.
 * Dynamically updates document title, canonical link, hreflang alternates,
 * OpenGraph meta tags, and Twitter Cards across languages and view states.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly defaultSiteName = 'KMD Labs';
  private readonly defaultOgImage = 'assets/design-system/og-image.png';

  /**
   * Applies a complete SEO metadata bundle (title, description, canonical, OpenGraph, Twitter).
   */
  update(config: SeoMetaConfig): void {
    if (typeof document === 'undefined') return;

    if (config.title) {
      this.setTitle(config.title);
    }
    if (config.description) {
      this.setDescription(config.description);
    }
    if (config.canonicalUrl) {
      this.setCanonical(config.canonicalUrl);
    }

    if (config.currentLang && config.supportedLangs && config.supportedLangs.length > 0) {
      this.syncHreflangLinks(config.currentLang, config.supportedLangs, config.canonicalUrl);
    }

    this.updateOpenGraph(config);
    this.updateTwitterCard(config);
    this.provisionFavicon(config.faviconBasePath);
  }

  /** Provisions or updates the official KMD orange circle favicon into the document `<head>`. */
  provisionFavicon(basePath = 'assets/design-system'): void {
    provisionFavicon(basePath);
  }

  setTitle(title: string): void {
    if (typeof document === 'undefined') return;
    document.title = title;
    this.setMetaTag('og:title', title, 'property');
    this.setMetaTag('twitter:title', title, 'name');
  }

  setDescription(desc: string): void {
    if (typeof document === 'undefined') return;
    this.setMetaTag('description', desc, 'name');
    this.setMetaTag('og:description', desc, 'property');
    this.setMetaTag('twitter:description', desc, 'name');
  }

  setCanonical(url: string): void {
    if (typeof document === 'undefined') return;
    this.setLinkTag('canonical', url);
    this.setMetaTag('og:url', url, 'property');
  }

  updateOpenGraph(config: SeoMetaConfig): void {
    if (typeof document === 'undefined') return;

    const siteName = config.siteName ?? this.defaultSiteName;
    const type = config.type ?? 'website';
    const image = config.image ?? this.defaultOgImage;

    this.setMetaTag('og:site_name', siteName, 'property');
    this.setMetaTag('og:type', type, 'property');
    this.setMetaTag('og:image', image, 'property');
    this.setMetaTag('og:image:width', '1200', 'property');
    this.setMetaTag('og:image:height', '630', 'property');

    if (config.imageAlt) {
      this.setMetaTag('og:image:alt', config.imageAlt, 'property');
    }
    if (config.locale) {
      this.setMetaTag('og:locale', config.locale, 'property');
    }
    if (config.localesAlternate) {
      for (const alt of config.localesAlternate) {
        this.setMetaTag('og:locale:alternate', alt, 'property');
      }
    }
  }

  updateTwitterCard(config: SeoMetaConfig): void {
    if (typeof document === 'undefined') return;

    const image = config.image ?? this.defaultOgImage;
    this.setMetaTag('twitter:card', 'summary_large_image', 'name');
    this.setMetaTag('twitter:image', image, 'name');

    if (config.imageAlt) {
      this.setMetaTag('twitter:image:alt', config.imageAlt, 'name');
    }
  }

  /**
   * Generates or synchronizes canonical and hreflang alternate links.
   */
  syncHreflangLinks(currentLang: string, supportedLangs: string[], baseUrl?: string): void {
    if (typeof document === 'undefined' || !supportedLangs.length) return;

    const base = baseUrl ? new URL(baseUrl) : new URL(location.pathname, location.origin);

    // Alternate links for each language
    for (const lang of supportedLangs) {
      const langUrl = new URL(base.href);
      if (lang === 'en') {
        langUrl.searchParams.delete('lang');
      } else {
        langUrl.searchParams.set('lang', lang);
      }
      this.setLinkTag('alternate', langUrl.href, lang);
    }

    // Default fallback to English
    const xDefaultUrl = new URL(base.href);
    xDefaultUrl.searchParams.delete('lang');
    this.setLinkTag('alternate', xDefaultUrl.href, 'x-default');
  }

  setMetaTag(key: string, content: string, attr: 'name' | 'property' = 'name'): void {
    if (typeof document === 'undefined' || !content) return;

    let meta = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attr, key);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  }

  setLinkTag(rel: string, href: string, hreflang?: string): void {
    if (typeof document === 'undefined' || !href) return;

    const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;
    let link = document.querySelector<HTMLLinkElement>(selector);
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      if (hreflang) link.hreflang = hreflang;
      document.head.appendChild(link);
    }
    link.href = href;
  }
}
