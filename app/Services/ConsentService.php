<?php

namespace App\Services;

use App\Models\ConsentLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class ConsentService
{
    public static function record(
        Model   $consentable,
        string  $type = 'terms_and_privacy',
        string  $version = '1.0',
    ): void {
        $request = app(Request::class);

        ConsentLog::create([
            'consentable_type' => get_class($consentable),
            'consentable_id'   => $consentable->getKey(),
            'type'             => $type,
            'version'          => $version,
            'ip_address'       => $request->ip(),
            'user_agent'       => $request->userAgent(),
            'accepted_at'      => now(),
        ]);
    }
}