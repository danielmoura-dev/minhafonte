<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();

            $table->unsignedInteger('order_number');  // sequencial por empresa
            $table->date('issue_date');

            // Endereço de entrega (gravado apenas nesta venda)
            $table->string('delivery_street')->nullable();
            $table->string('delivery_number', 20)->nullable();
            $table->string('delivery_complement', 100)->nullable();
            $table->string('delivery_neighborhood', 100)->nullable();
            $table->string('delivery_city', 100)->nullable();
            $table->string('delivery_state', 2)->nullable();
            $table->string('delivery_zip_code', 9)->nullable();

            $table->unsignedInteger('items_count')->default(0);
            $table->decimal('total', 12, 2)->default(0);

            $table->string('stock_action')->default('none'); // none, deduct, produce
            $table->string('payment_status')->default('pending'); // pending, partial, paid
            $table->decimal('paid_total', 12, 2)->default(0);

            $table->string('actor_name')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['company_id', 'order_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
