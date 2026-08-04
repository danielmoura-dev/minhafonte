<?php

namespace App\Models;

use App\Casts\Uppercase;
use App\Notifications\Auth\CompanyEmailVerificationNotification;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class Company extends Authenticatable implements MustVerifyEmail
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

    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new CompanyEmailVerificationNotification());
    }

    public function sellers(): HasMany
    {
        return $this->hasMany(Seller::class);
    }
}
