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
}

export type Translations = typeof fr