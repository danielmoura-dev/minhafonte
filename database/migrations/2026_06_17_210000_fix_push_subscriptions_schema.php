<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Recreate push_subscriptions with the correct schema.
     *
     * An older migration created the table with columns public_key/auth_token,
     * while the app uses p256dh/auth/user_agent. The original create migration
     * has an `if (Schema::hasTable()) return;` guard, so on environments that
     * already had the old table it never got the right columns and every
     * subscribe INSERT failed silently. This fixes those environments.
     */
    public function up(): void
    {
        // Already correct — keep existing data, do nothing.
        if (Schema::hasTable('push_subscriptions') && Schema::hasColumn('push_subscriptions', 'p256dh')) {
            return;
        }

        // Old/broken schema (or no table) — recreate correctly.
        // No usable rows exist with the wrong schema, so dropping is safe.
        Schema::dropIfExists('push_subscriptions');

        Schema::create('push_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seller_id')->constrained()->cascadeOnDelete();
            $table->text('endpoint');
            $table->string('p256dh', 512);
            $table->string('auth', 512);
            $table->string('user_agent')->nullable();
            $table->timestamps();

            $table->unique('endpoint', 'push_subscriptions_endpoint_unique');
        });
    }

    public function down(): void
    {
        // One-way schema fix; nothing to reverse.
    }
};
