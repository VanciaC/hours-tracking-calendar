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
    duration: {
    hours: '{{hours}}h',
    hoursMinutes: '{{hours}}h {{minutes}}m',
  },
  calendar: {
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    today: 'Today',
    week: 'Week',
    loadError: 'Could not load the calendar.',
    dayLink: 'Enter hours for {{date}}',
    selection: {
      count_one: '{{count}} day selected',
      count_other: '{{count}} days selected',
      go_one: 'Enter this day',
      go_other: 'Enter these days',
      clear: 'Clear',
    },
    legend: {
      label: 'Legend',
      short: 'under 4h',
      regular: '4h to 7h',
      full: '7h or more',
    },
    hint: {
      title: 'Several days?',
      drag: 'Drag',
      dragDetail: 'over days (weekends skipped)',
      or: 'or',
      shift: 'Shift',
      click: 'click',
      then: 'then',
    },
    stats: {
      hours: 'Hours this month',
      workedDays: 'Days worked',
      average: 'Average per day',
      pay: 'Estimated gross pay',
      noRate: 'No hourly rate set',
      unpricedDays_one: '{{count}} day without an hourly rate, not counted',
      unpricedDays_other: '{{count}} days without an hourly rate, not counted',
      manageRates: 'Manage rates',
      perHour: '{{amount}}/h',
    },
    rateSpan: '{{month}} {{from}}–{{to}}',
    firstOfMonth: '1',
  },
}