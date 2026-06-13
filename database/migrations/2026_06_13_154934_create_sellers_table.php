<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sellers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();

            // Tipo de pessoa
            $table->enum('person_type', ['individual', 'legal_entity'])->default('individual');

            // Dados comuns
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone', 20);
            $table->string('city');
            $table->string('state', 2);
            $table->string('photo')->nullable();

            // Pessoa Física
            $table->string('cpf', 14)->nullable();
            $table->date('birth_date')->nullable();

            // Pessoa Jurídica
            $table->string('cnpj', 18)->nullable();
            $table->string('company_name')->nullable();
            $table->date('responsible_birth_date')->nullable();

            // Tipo de vendedor
            $table->enum('seller_type', ['commissioned', 'reseller'])->default('reseller');

            // Comissão padrão (apenas para comissionados)
            $table->decimal('default_commission', 5, 2)->nullable();

            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sellers');
    }
};