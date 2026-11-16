import type { Translations } from './fr'

export const en: Translations = {
  app: {
    name: 'My Hours',
  },
  nav: {
    label: 'Main navigation',
    calendar: 'Calendar',
    entry: 'Time entry',
    settings: 'Settings',
  },
  session: {
    logout: 'Sign out',
  },
  status: {
    loading: 'Loading…',
    apiUnreachable: 'API unreachable · {{message}}',
  },
  settings: {
    rates: {
      title: 'Hourly rates',
      description: 'Each day is paid at the rate in force on its date.',
      loadError: 'Could not load the rates.',
    },
    templates: {
      title: 'Entry templates',
      description: 'Your usual days, to fill a day in one click. The default template pre-fills empty days.',
      loadError: 'Could not load the templates.',
    },
    appearance: {
      title: 'Appearance',
      description: 'The theme is saved on this device. "System" follows your computer or phone setting.',
    },
    language: {
      title: 'Language',
      description: 'The interface language, saved on this device.',
    },
  },
  theme: {
    label: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  },
}