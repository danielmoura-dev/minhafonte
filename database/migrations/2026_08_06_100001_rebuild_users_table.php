<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Usuários da empresa (multiusuário + permissões por módulo).
 *
 * A tabela `users` que vem do esqueleto do Laravel nunca foi usada por este
 * projeto — quem autentica hoje é a própria Company. Aqui ela é refeita com
 * vínculo à empresa, permissões e senha opcional (nula = primeiro acesso
 * pendente). A migration original não é tocada porque também cria
 * `password_reset_tokens` e `sessions`, ambas em uso.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Trava de segurança: em produção não presumimos que a tabela está
        // vazia. Se houver qualquer linha, aborta em vez de destruir dados.
        if (Schema::hasTable('users') && DB::table('users')->exists()) {
            throw new RuntimeException(
                'A tabela users não está vazia. Revise os dados manualmente antes de rodar esta migration.'
            );
        }

        Schema::dropIfExists('users');

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('email')->unique();

            // Nula enquanto o usuário ainda não definiu a senha no 1º acesso.
            $table->string('password')->nullable();

            // {"orders":["view","create"],"products":["view"]} — ignorado quando is_owner.
            $table->json('permissions')->nullable();

            $table->boolean('is_owner')->default(false);
            $table->boolean('is_active')->default(true);

            $table->timestamp('first_access_at')->nullable();
            $table->timestamp('first_access_expires_at')->nullable();
            $table->timestamp('email_verified_at')->nullable();

            $table->rememberToken();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['company_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');

        // Recria o formato original do esqueleto, para que o rollback deixe o
        // banco exatamente como estava.
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });
    }
};
