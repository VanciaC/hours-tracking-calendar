<?php

return [

    /*
     * Who may create an account (US-03, US-33):
     *   open   anyone, from the sign-up page
     *   invite only people invited by an admin, from the emailed link (default)
     *   closed nobody, accounts are only created on the server
     * Unknown values fall back to invite.
     */
    'mode' => env('REGISTRATION_MODE', 'invite'),

    /*
     * Lifetime of the link sent to verify the email address (US-22).
     */
    'verification_ttl_hours' => (int) env('EMAIL_VERIFICATION_TTL_HOURS', 24),

    /*
     * Accounts whose email was never verified are deleted after this many days
     * (privacy page, retention). Run daily by model:prune.
     */
    'unverified_retention_days' => (int) env('UNVERIFIED_RETENTION_DAYS', 7),

    /*
     * Lifetime of the link sent to choose a new password (US-24).
     */
    'password_reset_ttl_minutes' => (int) env('PASSWORD_RESET_TTL_MINUTES', 60),

    /*
     * Lifetime of the link sent with an invitation (US-33).
     */
    'invitation_ttl_days' => (int) env('INVITATION_TTL_DAYS', 7),

    /*
     * Expired invitations stay listed this many days, so admins can resend them,
     * then model:prune deletes them (privacy page, retention).
     */
    'expired_invitation_retention_days' => (int) env('EXPIRED_INVITATION_RETENTION_DAYS', 30),

    /*
     * Base URL of the front end: the links sent by email open a page there.
     */
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),

];
