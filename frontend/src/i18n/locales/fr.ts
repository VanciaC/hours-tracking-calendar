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
    admin: 'Administration',
    adminBadge: 'Admin',
    myArea: 'Mon espace',
    teamPlanning: "Planning d'équipe",
    users: 'Utilisateurs',
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
  time: {
    hour: '{{hours}}h',
    hourMinutes: '{{hours}}h{{minutes}}',
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
    operationFailed: "L'opération a échoué. Réessaie dans un instant.",
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
  rates: {
    newTitle: 'Nouveau taux',
    history: 'Historique',
    empty: "Aucun taux enregistré pour l'instant.",
    add: 'Ajouter',
    fromDate: 'à partir du {{date}}',
    amountLabel: 'Taux horaire brut',
    effectiveFrom: 'À partir du',
    invalidAmount: 'Montant invalide, par exemple {{example}}.',
    missingDate: 'Choisis une date de début.',
    dateTaken: 'Un taux commence déjà à cette date. Modifie-le dans la liste.',
  },
  templates: {
    new: '+ Nouveau modèle',
    create: 'Créer le modèle',
    empty: "Aucun modèle pour l'instant.",
    default: 'Par défaut',
    duration: 'Durée',
    nameLabel: 'Nom du modèle',
    namePlaceholder: 'Journée standard',
    useAsDefault: 'Utiliser par défaut pour les nouveaux jours',
    missingName: 'Donne un nom au modèle, par exemple « Journée standard ».',
  },
  login: {
    title: 'Connexion',
    email: 'Email',
    password: 'Mot de passe',
    submit: 'Se connecter',
    submitting: 'Connexion…',
    invalidCredentials: 'Email ou mot de passe incorrect.',
    serverUnreachable: 'Le serveur est injoignable, réessaie dans un instant.',
    notVerified:
      "Votre adresse e-mail n'est pas encore validée. Cliquez sur le lien reçu par e-mail, ou demandez-en un nouveau ci-dessous.",
    noAccount: 'Pas encore de compte ?',
    toRegister: 'Créer un compte',
    tooManyAttempts: 'Trop de tentatives. Patientez une minute avant de réessayer.',
    sessionExpired: 'Votre session a expiré. Reconnectez-vous pour continuer.',
  },
  register: {
    title: 'Créer un compte',
    name: 'Nom',
    passwordHint: 'Au moins {{min}} caractères.',
    passwordConfirmation: 'Confirmer le mot de passe',
    passwordMismatch: 'Les deux mots de passe ne correspondent pas.',
    emailTaken: 'Cette adresse e-mail est déjà utilisée.',
    invalid: 'Certains champs ne sont pas valides.',
    disabled: 'Les inscriptions sont fermées pour le moment.',
    submit: 'Créer mon compte',
    submitting: 'Création…',
    haveAccount: 'Déjà un compte ?',
    toLogin: 'Se connecter',
  },
  checkEmail: {
    title: 'Vérifiez votre boîte mail',
    text: "Un e-mail de validation a été envoyé à {{email}}. Cliquez sur le lien qu'il contient pour activer votre compte. Il est valable 24 heures.",
    notReceived: "Vous ne l'avez pas reçu ? Vérifiez vos spams, ou demandez-en un nouveau.",
  },
  resend: {
    submit: "Renvoyer l'e-mail",
    sending: 'Envoi…',
    sent: "Si un compte non validé existe pour cette adresse, un nouvel e-mail vient d'être envoyé.",
  },
  verifyEmail: {
    verifying: 'Validation de votre adresse…',
    invalidTitle: 'Lien invalide ou expiré',
    invalidText:
      "Ce lien de validation n'est plus valable : il a peut-être déjà été utilisé, ou il a expiré. Saisissez votre adresse pour en recevoir un nouveau.",
    backToLogin: 'Retour à la connexion',
  },
  admin: {
    comingSoon: 'Cette page arrive à la prochaine étape.',
    planning: { title: "Planning d'équipe" },
    users: { title: 'Utilisateurs' },
  },
}

/**
 * Every language must provide the reference keys. Next to a plural key ("…_other"),
 * a language may add the extra forms it needs: Arabic uses zero, two, few and many.
 */
type Messages<T> = {
  [K in keyof T]: T[K] extends string ? string : Messages<T[K]>
} & {
  [K in keyof T as K extends `${infer Base}_other` ? `${Base}_${'zero' | 'two' | 'few' | 'many'}` : never]?: string
}

export type Translations = Messages<typeof fr>
