<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Unverified accounts and expired tokens (privacy page, retention). At night, when nobody is using the app.
Schedule::command('model:prune')->dailyAt('03:30');
