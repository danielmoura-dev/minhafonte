<?php

namespace App\Console\Commands;

use App\Models\BankAccount;
use App\Models\Company;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderPayment;
use App\Models\Product;
use App\Models\RawMaterial;
use App\Models\Seller;
use App\Models\Supplier;
use Illuminate\Console\Command;

/**
 * Converte para MAIÚSCULO os dados de texto já existentes.
 * Idempotente: reatribuir cada campo dispara o cast Uppercase; só grava se mudou.
 */
class UppercaseExistingData extends Command
{
    protected $signature = 'data:uppercase';

    protected $description = 'Converte dados de texto já cadastrados para maiúsculo';

    /**
     * Model => campos que recebem o cast Uppercase.
     */
    private array $map = [
        Customer::class     => ['name', 'street', 'complement', 'neighborhood', 'city', 'notes'],
        Product::class      => ['code', 'name', 'description'],
        RawMaterial::class  => ['code', 'name'],
        Supplier::class     => ['name', 'fantasy_name', 'city', 'notes'],
        BankAccount::class  => ['name', 'bank', 'agency', 'account', 'account_type'],
        Company::class      => ['company_name', 'fantasy_name', 'address', 'city'],
        Order::class        => ['delivery_street', 'delivery_complement', 'delivery_neighborhood', 'delivery_city', 'notes'],
        OrderItem::class    => ['product_name', 'product_code'],
        OrderPayment::class => ['notes'],
        Seller::class       => ['name', 'company_name', 'city'],
    ];

    public function handle(): int
    {
        foreach ($this->map as $modelClass => $fields) {
            $updated = 0;

            $modelClass::query()->chunkById(200, function ($rows) use ($fields, &$updated) {
                foreach ($rows as $row) {
                    foreach ($fields as $field) {
                        // Reatribui: o cast Uppercase transforma no set; fica "dirty" só se mudou.
                        $row->{$field} = $row->{$field};
                    }

                    if ($row->isDirty()) {
                        $row->saveQuietly();
                        $updated++;
                    }
                }
            });

            $this->line(sprintf('%-14s %d atualizado(s)', class_basename($modelClass), $updated));
        }

        $this->info('Concluído.');

        return self::SUCCESS;
    }
}
