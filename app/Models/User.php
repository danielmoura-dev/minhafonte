<?php

namespace App\Models;

use App\Casts\Uppercase;
use App\Support\Permissions;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * Usuário da área administrativa. Toda conta pertence a uma empresa.
 *
 * O dono (`is_owner`) é o cadastro criado junto com a empresa: ignora
 * permissões e é o único que gerencia os demais usuários. Os outros são
 * criados pelo dono e só enxergam os módulos liberados em `permissions`.
 */
class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'company_id', 'name', 'email', 'password', 'permissions',
        'is_owner', 'is_active', 'first_access_at', 'first_access_expires_at',
        'email_verified_at',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at'       => 'datetime',
            'first_access_at'         => 'datetime',
            'first_access_expires_at' => 'datetime',
            'password'                => 'hashed',
            'permissions'             => 'array',
            'is_owner'                => 'boolean',
            'is_active'               => 'boolean',
            'name'                    => Uppercase::class,
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function scopeFromCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    /**
     * Pode executar `$action` no módulo `$module`?
     *
     * É a única fonte de verdade da autorização: o middleware das rotas, as
     * policies e a sidebar passam todos por aqui.
     */
    public function hasPermission(string $module, string $action = Permissions::VIEW): bool
    {
        if (! $this->is_active) {
            return false;
        }

        if ($this->is_owner) {
            return true;
        }

        $actions = ($this->permissions ?? [])[$module] ?? [];

        return is_array($actions) && in_array($action, $actions, true);
    }

    /**
     * Tem alguma ação liberada no módulo? (usado para decidir se o item
     * aparece na sidebar)
     */
    public function hasModule(string $module): bool
    {
        if (! $this->is_active) {
            return false;
        }

        if ($this->is_owner) {
            return true;
        }

        return ! empty(($this->permissions ?? [])[$module] ?? []);
    }

    /**
     * Ainda não definiu a senha (foi criado pelo dono e não fez o 1º acesso).
     */
    public function isPendingFirstAccess(): bool
    {
        return $this->password === null;
    }

    /**
     * A janela para reivindicar o primeiro acesso expirou.
     */
    public function firstAccessExpired(): bool
    {
        return $this->first_access_expires_at !== null
            && $this->first_access_expires_at->isPast();
    }

    /**
     * Primeira tela que o usuário tem permissão de abrir. Sem isso, quem não
     * tem acesso ao dashboard cairia num 403 logo depois de entrar.
     */
    public function homeRoute(): string
    {
        $candidates = [
            'dashboard'        => 'dashboard',
            'orders'           => 'orders.index',
            'receivables'      => 'receivables.index',
            'customers'        => 'customers.index',
            'products'         => 'products.index',
            'raw_materials'    => 'raw-materials.index',
            'commission_sales' => 'sales.index',
            'sellers'          => 'sellers.index',
            'suppliers'        => 'suppliers.index',
            'bank_accounts'    => 'bank-accounts.index',
            'company_settings' => 'company.settings.edit',
            'bot'              => 'bot.edit',
        ];

        foreach ($candidates as $module => $route) {
            if ($this->hasPermission($module, Permissions::VIEW)) {
                return route($route);
            }
        }

        return route('sem-acesso');
    }

    /**
     * Mantém `companies.email_verified_at` em sincronia quando quem verifica
     * é o dono, para que o cadastro da empresa não fique defasado.
     */
    public function markEmailAsVerified(): bool
    {
        $verified = parent::markEmailAsVerified();

        if ($verified && $this->is_owner) {
            $this->company?->forceFill(['email_verified_at' => $this->email_verified_at])->save();
        }

        return $verified;
    }

    /**
     * Não faz sentido mandar link de redefinição para quem ainda não tem
     * senha (deve usar o primeiro acesso) ou está desativado.
     */
    public function sendPasswordResetNotification($token): void
    {
        if ($this->isPendingFirstAccess() || ! $this->is_active) {
            return;
        }

        parent::sendPasswordResetNotification($token);
    }
}
