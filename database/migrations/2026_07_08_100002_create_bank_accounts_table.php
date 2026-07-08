<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('name');                       // Nome da conta
            $table->string('bank')->nullable();           // Banco
            $table->string('agency', 20)->nullable();     // Agência
            $table->string('account', 30)->nullable();    // Conta
            $table->string('account_type', 30)->nullable(); // Tipo
            $table->boolean('is_active')->default(true);  // Status
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_accounts');
    }
};
