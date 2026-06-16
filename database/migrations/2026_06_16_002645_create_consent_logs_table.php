<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('consent_logs', function (Blueprint $table) {
            $table->id();
            $table->string('consentable_type');
            $table->unsignedBigInteger('consentable_id');
            $table->string('type', 50)->default('terms_and_privacy');
            $table->string('version', 20)->default('1.0');
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamp('accepted_at');
            $table->timestamps();

            $table->index(['consentable_type', 'consentable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consent_logs');
    }
};