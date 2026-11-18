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
      weekHours: 'Heures de la semaine',
      dayHours: 'Heures du jour',
    },
    views: { label: 'Affichage', day: 'Jour', month: 'Mois', week: 'Semaine' },
    weekView: {
      previous: 'Semaine précédente',
      next: 'Semaine suivante',
      undated: '{{duration}}, sans horaire',
      dayLink: 'Saisir les heures du {{date}}',
      total: 'Total',
      totalHint: 'Total net de la journée, pauses non payées déduites',
      weekTotal: 'Total de la semaine',
      break: 'pause {{duration}} déduite',
      minutes: '{{minutes}} min',
      add: 'Saisir des heures',
    },
    dayView: { previous: 'Jour précédent', next: 'Jour suivant', note: 'Note' },
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
    viewCalendar: 'Voir dans le calendrier',
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
    forgotPassword: 'Mot de passe oublié ?',
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
  forgotPassword: {
    title: 'Mot de passe oublié',
    intro:
      "Saisissez l'adresse e-mail de votre compte. Nous vous enverrons un lien pour choisir un nouveau mot de passe.",
    submit: 'Envoyer le lien',
    sending: 'Envoi…',
    sentTitle: 'Vérifiez votre boîte de réception',
    sentText:
      "Si un compte existe pour {{email}}, un e-mail avec un lien vient d'être envoyé. Ce lien est valable 1 heure.",
    backToLogin: 'Retour à la connexion',
  },
  resetPassword: {
    title: 'Nouveau mot de passe',
    intro: 'Choisissez le nouveau mot de passe de votre compte.',
    password: 'Nouveau mot de passe',
    confirmation: 'Confirmez le mot de passe',
    hint: 'Au moins {{min}} caractères.',
    submit: 'Enregistrer',
    submitting: 'Enregistrement…',
    tooShort: 'Le mot de passe doit contenir au moins {{min}} caractères.',
    mismatch: 'Les deux mots de passe ne sont pas identiques.',
    doneTitle: 'Mot de passe modifié',
    doneText:
      'Votre mot de passe a bien été changé. Par sécurité, toutes vos sessions ont été fermées. Reconnectez-vous avec votre nouveau mot de passe.',
    toLogin: 'Se connecter',
    invalidTitle: 'Lien invalide ou expiré',
    invalidText:
      "Ce lien n'est plus valable. Il a peut-être déjà servi, ou il date de plus d'une heure. Demandez-en un nouveau.",
    requestNew: 'Demander un nouveau lien',
  },
  admin: {
    comingSoon: 'Cette page arrive à la prochaine étape.',
    users: {
      title: 'Utilisateurs',
      search: 'Rechercher par nom ou e-mail',
      total: 'Résultats : {{count}}',
      empty: 'Aucun utilisateur pour le moment.',
      noMatch: 'Aucun utilisateur ne correspond à « {{search}} ».',
      columns: { name: 'Nom', email: 'E-mail', registered: 'Inscription', status: 'Statut' },
      verified: 'Vérifié',
      pending: 'En attente de validation',
      pagination: 'Pages',
      page: 'Page {{page}} sur {{lastPage}}',
      previous: 'Page précédente',
      next: 'Page suivante',
    },
    user: {
      back: 'Retour aux utilisateurs',
      readOnly: 'Lecture seule',
      notFound: "Cet utilisateur n'existe pas ou n'est pas accessible.",
    },
    planning: {
      title: "Planning d'équipe",
      previousDay: 'Jour précédent',
      nextDay: 'Jour suivant',
      today: "Aujourd'hui",
      present: 'Présents',
      undated: '{{duration}} déclarées, sans horaire',
      filter: {
        button: 'Personnes',
        count: '{{shown}}/{{total}}',
        search: 'Rechercher une personne',
        showAll: 'Tout afficher',
        hideAll: 'Tout masquer',
        noMatch: 'Aucune personne trouvée.',
      },
      empty: "Personne n'a saisi d'heures ce jour-là.",
      previousWeek: 'Semaine précédente',
      nextWeek: 'Semaine suivante',
      emptyWeek: "Personne n'a saisi d'heures cette semaine.",
      openDay: 'Voir le planning du {{date}}',
      views: { label: 'Affichage', day: 'Jour', week: 'Semaine', month: 'Mois' },
      previousMonth: 'Mois précédent',
      nextMonth: 'Mois suivant',
      emptyMonth: "Personne n'a saisi d'heures ce mois-ci.",
      monthDayLabel: '{{date}}, présents : {{names}}',
      openUser: 'Voir la fiche de {{name}}',
    },
  },
  privacy: {
    title: 'Confidentialité et données personnelles',
    updated: 'Dernière mise à jour le {{date}}',
    intro:
      "Cette page explique quelles données l'application collecte, pourquoi, qui peut les voir et combien de temps elles sont conservées.",
    back: 'Retour',
    link: 'Confidentialité',
    contact: 'Contact',
    signupNotice:
      "L'administrateur de l'application peut consulter vos heures, vos taux horaires et votre salaire estimé, et vos horaires apparaissent dans le planning d'équipe.",
    signupLink: 'En savoir plus sur vos données',
    controller: {
      title: 'Qui est responsable de vos données',
      text: "{{name}} édite et administre cette application, et est responsable du traitement de vos données. Pour toute question ou demande, écrivez à l'adresse ci-dessous.",
    },
    data: {
      title: 'Les données collectées',
      account:
        "Votre compte : nom, adresse e-mail, langue et mot de passe. Le mot de passe est stocké sous une forme hachée que personne ne peut relire, pas même l'administrateur.",
      hours: 'Vos heures : dates, créneaux, pauses, durées et notes que vous saisissez.',
      rates: "Vos taux horaires et leurs dates d'effet, qui servent à estimer votre salaire.",
      technical:
        'Des données techniques nécessaires à la sécurité : vos sessions de connexion et les liens envoyés par e-mail, eux aussi stockés sous forme hachée.',
    },
    purposes: {
      title: 'Pourquoi',
      text: "Uniquement pour faire fonctionner l'application : vous permettre de saisir vos heures, calculer vos totaux et votre salaire estimé, et permettre à l'administrateur de suivre les heures de l'équipe. Vos données ne servent jamais à de la publicité.",
    },
    legalBasis: {
      title: 'Sur quelle base',
      text: 'Ce traitement est nécessaire au fonctionnement du service que vous utilisez (article 6.1.b du RGPD).',
    },
    recipients: {
      title: 'Qui peut voir vos données',
      you: 'Vous, pour toutes vos données.',
      admins:
        "Les administrateurs de l'application, en lecture seule : vos heures, vos taux horaires et votre salaire estimé. Vos horaires apparaissent aussi dans le planning d'équipe. Un administrateur ne peut jamais modifier ni supprimer vos données.",
      providers:
        "Les prestataires techniques, uniquement pour faire fonctionner le service : l'hébergeur OVHcloud, dont les serveurs sont situés en France, et un prestataire d'envoi d'e-mails pour les messages de validation et de nouveau mot de passe.",
      noSale: 'Vos données ne sont ni vendues, ni louées, ni cédées à qui que ce soit.',
    },
    retention: {
      title: 'Combien de temps',
      account: 'Votre compte, vos heures et vos taux sont conservés tant que votre compte existe.',
      request: 'Si vous demandez la suppression de votre compte, toutes vos données sont effacées sous 30 jours.',
      unverified:
        "Un compte dont l'adresse e-mail n'a jamais été validée est supprimé automatiquement au bout de 7 jours.",
      inactive:
        'Un compte sans aucune connexion pendant 3 ans est supprimé, après un e-mail de prévenance envoyé un mois avant.',
      backups:
        'Les sauvegardes de la base sont conservées 30 jours. Une donnée effacée disparaît donc aussi des sauvegardes au bout de 30 jours.',
      links:
        "Les liens envoyés par e-mail expirent au bout de 24 heures (validation de l'adresse) ou d'une heure (nouveau mot de passe).",
    },
    storage: {
      title: 'Cookies et stockage dans le navigateur',
      text: "L'application n'utilise aucun cookie publicitaire ni de mesure d'audience. Elle utilise seulement un cookie de session, indispensable pour rester connecté, et enregistre dans votre navigateur votre thème, votre langue et la dernière vue du calendrier. Ces éléments étant strictement nécessaires, aucun consentement n'est demandé.",
    },
    rights: {
      title: 'Vos droits',
      text: "Vous pouvez à tout moment accéder à vos données, les faire corriger, en demander la suppression, en limiter l'utilisation ou en obtenir une copie dans un format réutilisable. Écrivez pour cela à l'adresse de contact ci-dessus. Une réponse vous sera apportée dans un délai d'un mois.",
      complaint:
        'Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL.',
    },
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
