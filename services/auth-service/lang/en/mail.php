<?php

return [
    'verify' => [
        'subject' => 'Confirm your email address',
        'greeting' => 'Hello :name,',
        'intro' => 'Thanks for signing up. Click the button below to confirm your email address and activate your account.',
        'action' => 'Confirm my address',
        'expiry' => 'This link is valid for :hours hours.',
        'ignore' => 'If you did not sign up, you can simply ignore this email.',
    ],
    'reset' => [
        'subject' => 'Reset your password',
        'greeting' => 'Hello :name,',
        'intro' => 'You asked to change the password of your account. Click the button below to choose a new one.',
        'action' => 'Choose a new password',
        'expiry' => 'This link is valid for :minutes minutes and can only be used once.',
        'ignore' => 'If you did not ask for this, ignore this email. Your current password still works.',
    ],
    'salutation' => 'See you soon!',
];
