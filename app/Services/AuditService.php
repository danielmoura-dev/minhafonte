<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AuditService
{
    public static function log(
        string  $event,
        ?Model  $auditable = null,
        array   $oldValues = [],
        array   $newValues = [],
        ?string $description = null,
        ?Model  $actor = null,
    ): void {
        try {
            $request = app(Request::class);

            $actorResolved = $actor
                ?? auth('web')->user()
                ?? auth('seller')->user();

            AuditLog::create([
                'auditable_type' => $auditable ? get_class($auditable) : null,
                'auditable_id'   => $auditable?->getKey(),
                'actor_type'     => $actorResolved ? get_class($actorResolved) : null,
                'actor_id'       => $actorResolved?->getKey(),
                'event'          => $event,
                'old_values'     => $oldValues ?: null,
                'new_values'     => $newValues ?: null,
                'ip_address'     => $request->ip(),
                'user_agent'     => $request->userAgent(),
                'description'    => $description,
            ]);
        } catch (\Throwable) {
            // Nunca deixar auditoria quebrar a aplicação
        }
    }
}