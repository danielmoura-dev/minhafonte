<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\User;
use Illuminate\Console\Command;

/**
 * Cria o usuário-dono de cada empresa já cadastrada.
 *
 * Antes do multiusuário, quem logava era a própria empresa. Este comando
 * espelha cada empresa num usuário `is_owner`, copiando e-mail e o MESMO
 * hash de senha — assim todo mundo continua entrando com as credenciais de
 * sempre depois que o guard passar a autenticar usuários.
 *
 * É idempotente (updateOrCreate por e-mail): rodar de novo não duplica.
 */
class BackfillOwnerUsers extends Command
{
    protected $signature = 'users:backfill-owners {--dry-run : Apenas relata o que seria feito}';

    protected $description = 'Cria o usuário-dono de cada empresa existente';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        if ($dryRun) {
            $this->warn('DRY-RUN: nada será gravado.');
        }

        $companies = Company::orderBy('id')->get();

        if ($companies->isEmpty()) {
            $this->info('Nenhuma empresa cadastrada — nada a fazer.');

            return self::SUCCESS;
        }

        $created = $updated = $skipped = 0;
        $problems = [];

        foreach ($companies as $company) {
            $email = mb_strtolower(trim((string) $company->email));

            if ($email === '') {
                $problems[] = "Empresa #{$company->id} ({$company->fantasy_name}) está sem e-mail.";
                $skipped++;
                continue;
            }

            // E-mail já usado por um usuário de OUTRA empresa: não dá para
            // criar (o índice é único) e sobrescrever seria pior.
            $conflict = User::withTrashed()
                ->where('email', $email)
                ->where('company_id', '!=', $company->id)
                ->first();

            if ($conflict) {
                $problems[] = "E-mail {$email} (empresa #{$company->id}) já pertence ao usuário #{$conflict->id} da empresa #{$conflict->company_id}.";
                $skipped++;
                continue;
            }

            $existing = User::withTrashed()->where('email', $email)->first();

            if ($dryRun) {
                $existing ? $updated++ : $created++;
                continue;
            }

            $user = User::withTrashed()->firstOrNew(['email' => $email]);

            $user->forceFill([
                'company_id'        => $company->id,
                'name'              => $company->fantasy_name ?: $company->company_name,
                'password'          => $company->password,          // hash copiado como está
                'is_owner'          => true,
                'is_active'         => true,
                'permissions'       => null,                        // dono ignora permissões
                'email_verified_at' => $company->email_verified_at,
                'remember_token'    => $company->remember_token,
                'deleted_at'        => null,
            ])->save();

            $user->wasRecentlyCreated ? $created++ : $updated++;
        }

        $this->newLine();
        $this->line("Empresas analisadas: {$companies->count()}");
        $this->line("Donos criados:       {$created}");
        $this->line("Donos atualizados:   {$updated}");
        $this->line("Ignorados:           {$skipped}");

        if ($problems) {
            $this->newLine();
            $this->error('Pendências que precisam de revisão manual:');
            foreach ($problems as $problem) {
                $this->line("  - {$problem}");
            }
        }

        return self::SUCCESS;
    }
}
