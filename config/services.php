<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'vapid' => [
        'subject'     => env('VAPID_SUBJECT', 'mailto:contato@fontepro.com.br'),
        'public_key'  => env('VAPID_PUBLIC_KEY'),
        'private_key' => env('VAPID_PRIVATE_KEY'),
    ],

    'evolution' => [
        'url'           => env('EVOLUTION_API_URL', 'http://localhost:8080'),
        'api_key'       => env('EVOLUTION_API_KEY'),
        'webhook_token' => env('EVOLUTION_WEBHOOK_TOKEN'),
        // Base da URL do webhook vista PELO CONTAINER da Evolution.
        // Local (Laragon): http://fontepro.test (https auto-assinado falharia).
        // Produção: pode omitir — usa APP_URL.
        'webhook_base'  => env('EVOLUTION_WEBHOOK_BASE'),
        // Segundos mostrando "gravando áudio..."/"digitando..." antes de cada
        // envio nas notificações automáticas (efeito mais humano/natural).
        'presence_delay' => env('EVOLUTION_PRESENCE_DELAY', 5),
    ],

    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
        'model'   => env('GEMINI_MODEL', 'gemini-flash-latest'),
    ],

];
