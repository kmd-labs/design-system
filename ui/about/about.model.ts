export interface TeamMember {
  firstName: string;
  lastName: string;
  photo: string | null;
  linkedin: string;
  github?: string;
}

export interface PersonText {
  bio: string;
  tasks: string[];
}

export interface AboutRef {
  label: string;
  href: string;
  title: string;
  aria: string;
}

export interface AboutText {
  docTitle: string;
  metaDescription: string;
  cta: string;
  contact: string;
  openAbout: string;
  title: string;
  kicker: string;
  leads: string[];
  refs: AboutRef[];
  back: string;
  tasksLabel: string;
  photoSoon: string;
  linkedinAria: (name: string) => string;
  githubAria: (name: string) => string;
  footer: string;
  people: PersonText[];
}
