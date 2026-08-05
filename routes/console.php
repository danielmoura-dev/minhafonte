<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Notificações automáticas do bot (resumo diário de vendas etc.).
// Requer o cron do Laravel na VPS: * * * * * php artisan schedule:run
Schedule::command('bot:notifications')->everyMinute();
