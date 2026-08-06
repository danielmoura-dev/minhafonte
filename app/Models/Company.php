<?php

namespace App\Models;

use App\Casts\Uppercase;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

/**
 * A empresa (o "tenant"): dona de todos os dados do sistema.
 *
 * Quem faz login são os usuários dela (`App\Models\User`) — a própria empresa
 * já não autentica. As colunas `password`/`remember_token` continuam aqui
 * apenas como histórico do modelo antigo; o login do dono usa o usuário.
 */
class Company extends Model
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'company_name',
        'fantasy_name',
        'cnpj',
        'email',
        'password',
        'logo',
        'phone',
        'address',
        'city',
        'state',
        'admin_password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'admin_password',
    ];

    protected $appends = ['logo_url'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'admin_password'    => 'hashed',
            'company_name'      => Uppercase::class,
            'fantasy_name'      => Uppercase::class,
            'address'           => Uppercase::class,
            'city'              => Uppercase::class,
        ];
    }

    public function getLogoUrlAttribute(): ?string
    {
        return $this->logo ? Storage::url($this->logo) : null;
    }

    /**
     * Verifica a senha de administrador (libera edição de vendas com pagamento).
     * Enquanto não for definida uma senha própria, o padrão é "adm".
     */
    public function checkAdminPassword(string $input): bool
    {
        if (empty($this->admin_password)) {
            return $input === 'adm';
        }

        return Hash::check($input, $this->admin_password);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * O usuário-dono: criado junto com a empresa, ignora permissões e é o
     * único que gerencia os demais.
     */
    public function owner(): HasMany
    {
        return $this->users()->where('is_owner', true);
    }

    public function sellers(): HasMany
    {
        return $this->hasMany(Seller::class);
    }
}
