<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bot_chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('phone', 30);
            $table->string('role', 10); // user, model
            $table->text('content');
            $table->timestamps();

            $table->index(['company_id', 'phone', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bot_chat_messages');
    }
};
