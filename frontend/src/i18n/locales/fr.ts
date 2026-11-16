/**
 * Reference translations: every other language must provide exactly these keys.
 * Values are plain strings; {{name}} marks a value inserted at runtime.
 */
export const fr = {
  app: {
    name: 'Mes heures',
  },
  nav: {
    label: 'Navigation principale',
    calendar: 'Calendrier',
    entry: 'Saisie',
    settings: 'Réglages',
  },
  session: {
    logout: 'Se déconnecter',
  },
  status: {
    loading: 'Chargement…',
    apiUnreachable: 'API injoignable · {{message}}',
  },
  settings: {
    rates: {
      title: 'Taux horaires',
      description: 'Le salaire de chaque jour est calculé avec le taux en vigueur à sa date.',
      loadError: 'Impossible de charger les taux.',
    },
    templates: {
      title: 'Modèles de saisie',
      description:
        'Tes journées habituelles, pour remplir un jour en un clic. Le modèle par défaut pré-remplit les jours vides.',
      loadError: 'Impossible de charger les modèles.',
    },
    appearance: {
      title: 'Apparence',
      description:
        'Le thème est enregistré sur cet appareil. « Système » suit le réglage de ton ordinateur ou de ton téléphone.',
    },
    language: {
      title: 'Langue',
      description: "La langue de l'interface, enregistrée sur cet appareil.",
    },
  },
  theme: {
    label: 'Thème',
    light: 'Clair',
    dark: 'Sombre',
    system: 'Système',
  },
    duration: {
    hours: '{{hours}}h',
    hoursMinutes: '{{hours}}h{{minutes}}',
  },
  calendar: {
    previousMonth: 'Mois précédent',
    nextMonth: 'Mois suivant',
    today: "Aujourd'hui",
    week: 'Semaine',
    loadError: 'Impossible de charger le calendrier.',
    dayLink: 'Saisir les heures du {{date}}',
    selection: {
      count_one: '{{count}} jour sélectionné',
      count_other: '{{count}} jours sélectionnés',
      go_one: 'Saisir ce jour',
      go_other: 'Saisir ces jours',
      clear: 'Effacer',
    },
    legend: {
      label: 'Légende',
      short: 'moins de 4h',
      regular: '4h à 7h',
      full: '7h et plus',
    },
    hint: {
      title: 'Plusieurs jours ?',
      drag: 'Glisse',
      dragDetail: 'sur les jours (hors week-end)',
      or: 'ou',
      shift: 'Maj',
      click: 'clic',
      then: 'puis',
    },
    stats: {
      hours: 'Heures du mois',
      workedDays: 'Jours travaillés',
      average: 'Moyenne par jour',
      pay: 'Salaire brut estimé',
      noRate: 'Aucun taux horaire défini',
      unpricedDays_one: '{{count}} jour sans taux horaire, non compté',
      unpricedDays_other: '{{count}} jours sans taux horaire, non comptés',
      manageRates: 'Gérer les taux',
      perHour: '{{amount}}/h',
    },
    rateSpan: 'Du {{from}} au {{to}} {{month}}',
    firstOfMonth: '1er',
  },
}

export type Translations = typeof fr