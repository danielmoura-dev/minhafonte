<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('push_subscriptions')) return;

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
        Schema::dropIfExists('push_subscriptions');
    }
};
