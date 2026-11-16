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
    common: {
    save: 'Enregistrer',
    saving: 'Enregistrement…',
    cancel: 'Annuler',
    delete: 'Supprimer',
    deleting: 'Suppression…',
    confirm: 'Confirmer',
    edit: 'Modifier',
    unnamed: 'Sans nom',
  },
  hours: {
    modeLabel: 'Type de saisie',
    slots: 'Créneaux',
    duration: 'Durée',
    start: 'Début',
    end: 'Fin',
    unpaidBreak: 'Pause non payée (min)',
    removeShift: 'Retirer ce créneau',
    addShift: '+ Ajouter un créneau',
    hours: 'Heures',
    minutes: 'Minutes',
    total: 'Total',
  },
  hoursErrors: {
    noShift: 'Ajoute au moins un créneau.',
    incompleteShift: 'Renseigne le début et la fin de chaque créneau.',
    endBeforeStart: 'Le créneau {{shift}} doit finir après avoir commencé.',
    invalidBreak: 'La pause doit être un nombre entier de minutes.',
    breakTooLong: 'La pause du créneau {{shift}} doit être plus courte que le créneau.',
    overlap: 'Les créneaux ne doivent pas se chevaucher.',
    invalidDuration: 'Durée invalide. Elle doit être comprise entre 1 minute et 24 heures.',
  },
  entry: {
    back: 'Retour au calendrier',
    previousDay: 'Jour précédent',
    nextDay: 'Jour suivant',
    pickDate: 'Choisir une date',
    fillWith: 'Remplir avec',
    note: 'Note (facultative)',
    deleteDay: 'Supprimer ce jour',
    confirmDelete: 'Confirmer la suppression',
    saved: 'Journée enregistrée.',
    deleted: 'Journée supprimée.',
    saveFailed: "L'enregistrement a échoué. Vérifie la saisie et réessaie.",
    deleteFailed: 'La suppression a échoué. Réessaie dans un instant.',
    loadError: 'Impossible de charger cette journée.',
    viewMonth: 'Voir le mois',
    multi: {
      title_one: '{{count}} jour sélectionné',
      title_other: '{{count}} jours sélectionnés',
      filledWarning_one: '{{count}} de ces jours a déjà des heures (encadré) : elles seront remplacées.',
      filledWarning_other: '{{count}} de ces jours ont déjà des heures (encadrés) : elles seront remplacées.',
      saved_one: '{{count}} jour enregistré.',
      saved_other: '{{count}} jours enregistrés.',
      saveFailed: "L'enregistrement a échoué. Aucun jour n'a été modifié.",
      loadError: 'Impossible de charger ces journées.',
    },
  },
}

export type Translations = typeof fr