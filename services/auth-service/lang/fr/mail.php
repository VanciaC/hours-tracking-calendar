<?php

return [
    'verify' => [
        'subject' => 'Confirmez votre adresse e-mail',
        'greeting' => 'Bonjour :name,',
        'intro' => 'Merci pour votre inscription. Cliquez sur le bouton ci-dessous pour confirmer votre adresse e-mail et activer votre compte.',
        'action' => 'Confirmer mon adresse',
        'expiry' => 'Ce lien est valable :hours heures.',
        'ignore' => "Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement cet e-mail.",
    ],
    'reset' => [
        'subject' => 'Réinitialisez votre mot de passe',
        'greeting' => 'Bonjour :name,',
        'intro' => 'Vous avez demandé à changer le mot de passe de votre compte. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.',
        'action' => 'Choisir un nouveau mot de passe',
        'expiry' => "Ce lien est valable :minutes minutes et ne peut servir qu'une seule fois.",
        'ignore' => "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail. Votre mot de passe actuel reste valable.",
    ],
    'salutation' => 'À bientôt !',
];
