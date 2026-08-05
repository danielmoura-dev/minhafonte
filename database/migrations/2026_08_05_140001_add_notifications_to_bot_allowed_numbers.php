<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bot_allowed_numbers', function (Blueprint $table) {
            if (! Schema::hasColumn('bot_allowed_numbers', 'notifications_enabled')) {
                // Quem tem o toggle ligado recebe as notificações automáticas do bot
                $table->boolean('notifications_enabled')->default(true)->after('name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('bot_allowed_numbers', function (Blueprint $table) {
            $table->dropColumn('notifications_enabled');
        });
    }
};
