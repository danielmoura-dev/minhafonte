<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ResetUserPasswordRequest;
use App\Http\Requests\Settings\StoreUserRequest;
use App\Http\Requests\Settings\UpdateUserRequest;
use App\Models\User;
use App\Services\AuditService;
use App\Support\Permissions;
use App\Support\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Usuários da empresa.
 *
 * O acesso é uma permissão como as outras ('users'), mas com duas travas: o
 * dono da conta nunca pode ser alterado, e ninguém edita a si mesmo.
 *
 * O usuário nasce sem senha: quem define é ele mesmo, no primeiro acesso.
 */
class UserController extends Controller
{
    /** Dias que o funcionário tem para fazer o primeiro acesso. */
    private const FIRST_ACCESS_DAYS = 7;

    public function index(): Response
    {
        $this->authorize('viewAny', User::class);

        $users = User::fromCompany(Tenant::id())
            ->orderByDesc('is_owner')
            ->orderBy('name')
            ->get([
                'id', 'name', 'email', 'is_owner', 'is_active', 'permissions',
                'password', 'first_access_at', 'first_access_expires_at', 'created_at',
            ])
            ->map(fn (User $user) => [
                'id'          => $user->id,
                'name'        => $user->name,
                'email'       => $user->email,
                'is_owner'    => $user->is_owner,
                'is_active'   => $user->is_active,
                'permissions' => (object) ($user->permissions ?? []),
                'status'      => $this->status($user),
            ]);

        $modules = Permissions::modules();

        // Quem não é dono nem vê na tela o que não pode conceder — melhor do
        // que deixar marcar e o servidor descartar em silêncio.
        if (! Tenant::user()?->is_owner) {
            foreach (Permissions::ownerOnlyToGrant() as $module) {
                unset($modules[$module]);
            }
        }

        return Inertia::render('Settings/Users', [
            'users' => $users,
            // Catálogo vem do servidor para o front nunca duplicar a lista.
            'modules' => $modules,
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $this->authorize('create', User::class);

        $data = $request->validated();

        $user = User::create([
            'company_id'  => Tenant::id(),
            'name'        => $data['name'],
            'email'       => $data['email'],
            'password'    => null,                                            // definida no 1º acesso
            'permissions' => $this->grantable($data['permissions'] ?? []),
            'is_owner'    => false,
            'is_active'   => true,
            // Criado por quem já responde pela conta: não precisa confirmar e-mail.
            'email_verified_at'       => now(),
            'first_access_expires_at' => now()->addDays(self::FIRST_ACCESS_DAYS),
        ]);

        AuditService::log(
            event:       'user.created',
            auditable:   $user,
            newValues:   ['name' => $user->name, 'email' => $user->email],
            description: "Usuário '{$user->name}' cadastrado.",
        );

        return back()->with('success', "Usuário criado! {$user->name} já pode fazer o primeiro acesso com esse e-mail.");
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        $data = $request->validated();
        $old  = ['name' => $user->name, 'email' => $user->email, 'permissions' => $user->permissions];

        $user->update([
            'name'        => $data['name'],
            'email'       => $data['email'],
            'permissions' => $this->grantable($data['permissions'] ?? [], $user),
        ]);

        AuditService::log(
            event:       'user.updated',
            auditable:   $user,
            oldValues:   $old,
            newValues:   ['name' => $user->name, 'email' => $user->email, 'permissions' => $user->permissions],
            description: "Usuário '{$user->name}' atualizado.",
        );

        return back()->with('success', 'Usuário atualizado com sucesso!');
    }

    public function toggleStatus(User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        $user->update(['is_active' => ! $user->is_active]);

        if (! $user->is_active) {
            $this->killSessions($user);
        }

        AuditService::log(
            event:       $user->is_active ? 'user.activated' : 'user.deactivated',
            auditable:   $user,
            description: "Usuário '{$user->name}' " . ($user->is_active ? 'reativado' : 'desativado') . '.',
        );

        return back()->with('success', $user->is_active
            ? "{$user->name} voltou a ter acesso."
            : "{$user->name} não consegue mais entrar.");
    }

    /**
     * Reenvia o primeiro acesso (padrão) ou define a senha na mão.
     */
    public function resetPassword(ResetUserPasswordRequest $request, User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        $manual = $request->input('mode') === 'manual';

        $user->forceFill($manual
            ? [
                'password'                => $request->input('password'),   // o cast 'hashed' aplica o hash
                'first_access_at'         => now(),
                'first_access_expires_at' => null,
            ]
            : [
                'password'                => null,
                'first_access_at'         => null,
                'first_access_expires_at' => now()->addDays(self::FIRST_ACCESS_DAYS),
            ])->save();

        $this->killSessions($user);

        AuditService::log(
            event:       'user.password_reset',
            auditable:   $user,
            description: "Senha de '{$user->name}' redefinida (" . ($manual ? 'definida pelo administrador' : 'novo primeiro acesso') . ').',
        );

        return back()->with('success', $manual
            ? "Senha de {$user->name} redefinida."
            : "{$user->name} deve entrar com o e-mail e criar uma nova senha.");
    }

    public function destroy(User $user): RedirectResponse
    {
        $this->authorize('delete', $user);

        $name = $user->name;

        // O e-mail é único e o registro fica (soft delete), então libera o
        // endereço — senão recadastrar a mesma pessoa falharia.
        $user->forceFill(['email' => "{$user->id}+excluido@fontepro.local"])->save();
        $user->delete();

        $this->killSessions($user);

        AuditService::log(
            event:       'user.deleted',
            auditable:   $user,
            description: "Usuário '{$name}' excluído.",
        );

        return back()->with('success', "{$name} foi removido.");
    }

    /**
     * Permissões que podem ser gravadas de fato.
     *
     * Além de descartar módulo/ação inexistente, impede que quem não é dono
     * conceda o próprio módulo de Usuários — senão a permissão se espalharia
     * sozinha e o dono perderia o controle de quem dá acesso a quem.
     *
     * @param  User|null  $target  usuário sendo editado (preserva o que já tinha)
     */
    private function grantable(mixed $requested, ?User $target = null): array
    {
        $clean = Permissions::sanitize($requested);

        if (Tenant::user()?->is_owner) {
            return $clean;
        }

        foreach (Permissions::ownerOnlyToGrant() as $module) {
            // Mantém o que o dono já havia concedido; só não deixa conceder agora.
            $existing = ($target?->permissions ?? [])[$module] ?? null;

            if ($existing) {
                $clean[$module] = $existing;
            } else {
                unset($clean[$module]);
            }
        }

        return $clean;
    }

    /**
     * Derruba as sessões abertas do usuário (desativação, reset de senha ou
     * exclusão precisam valer na hora, não só no próximo login).
     */
    private function killSessions(User $user): void
    {
        $user->forceFill(['remember_token' => Str::random(60)])->save();

        if (config('session.driver') === 'database') {
            DB::table(config('session.table', 'sessions'))
                ->where('user_id', $user->id)
                ->delete();
        }
    }

    private function status(User $user): string
    {
        if (! $user->is_active) {
            return 'inactive';
        }

        if ($user->isPendingFirstAccess()) {
            return $user->firstAccessExpired() ? 'expired' : 'pending';
        }

        return 'active';
    }
}
