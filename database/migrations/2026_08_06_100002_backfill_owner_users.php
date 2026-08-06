<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Artisan;

/**
 * Cria o usuário-dono das empresas que já existiam antes do multiusuário.
 *
 * Só INSERE em `users` — nenhuma tabela de negócio é lida ou alterada além
 * de `companies`, que é apenas lida. O comando é idempotente, então rodar a
 * migration num banco já preenchido não duplica ninguém.
 */
return new class extends Migration
{
    public function up(): void
    {
        Artisan::call('users:backfill-owners');
    }

    public function down(): void
    {
        // Sem rollback automático: apagar usuários é destrutivo e o dono pode
        // já ter criado contas de verdade. Se precisar reverter, remova as
        // linhas manualmente após conferir o que existe em `users`.
    }
};
