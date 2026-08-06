<?php

namespace App\Providers;

use App\Models\BankAccount;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\RawMaterial;
use App\Models\Sale;
use App\Models\Seller;
use App\Models\Supplier;
use App\Models\User;
use App\Policies\BankAccountPolicy;
use App\Policies\CustomerPolicy;
use App\Policies\OrderPolicy;
use App\Policies\ProductPolicy;
use App\Policies\RawMaterialPolicy;
use App\Policies\SalePolicy;
use App\Policies\SellerPolicy;
use App\Policies\SupplierPolicy;
use App\Policies\UserPolicy;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        Gate::policy(Seller::class, SellerPolicy::class);
        Gate::policy(Product::class, ProductPolicy::class);
        Gate::policy(Sale::class, SalePolicy::class);
        Gate::policy(Customer::class, CustomerPolicy::class);
        Gate::policy(Order::class, OrderPolicy::class);
        Gate::policy(BankAccount::class, BankAccountPolicy::class);
        Gate::policy(Supplier::class, SupplierPolicy::class);
        Gate::policy(RawMaterial::class, RawMaterialPolicy::class);
        Gate::policy(User::class, UserPolicy::class);

        $this->configureEmails();
    }

    private function configureEmails(): void
    {
        VerifyEmail::toMailUsing(function (object $notifiable, string $url): MailMessage {
            return (new MailMessage)
                ->subject('Confirme seu e-mail — Fonte Pro')
                ->view('emails.verify-email', [
                    'url'  => $url,
                    'name' => $notifiable->name,
                ]);
        });

        ResetPassword::toMailUsing(function (object $notifiable, string $token): MailMessage {
            $url = url(route('password.reset', [
                'token' => $token,
                'email' => $notifiable->getEmailForPasswordReset(),
            ], false));

            $expireMinutes = config('auth.passwords.'.config('auth.defaults.passwords').'.expire');

            return (new MailMessage)
                ->subject('Redefinição de senha — Fonte Pro')
                ->view('emails.reset-password', [
                    'url'           => $url,
                    'name'          => $notifiable->name,
                    'expireMinutes' => $expireMinutes,
                ]);
        });
    }
}