<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bot_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('type');                       // daily_sales_summary (extensível)
            $table->boolean('enabled')->default(false);
            $table->string('send_time', 5)->default('19:00'); // HH:MM no fuso da aplicação
            $table->json('days');                          // dias da semana ISO: 1=seg ... 7=dom
            $table->string('audio_file')->nullable();      // arquivo em audios/ enviado antes do texto
            $table->timestamp('last_sent_at')->nullable(); // deduplicação (1x por dia)
            $table->timestamps();

            $table->unique(['company_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bot_notifications');
    }
};
