<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('seller_id')->constrained('sellers')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();

            $table->date('sale_date');
            $table->decimal('unit_price', 10, 2);
            $table->integer('quantity');
            $table->decimal('total', 10, 2);

            // Comissão (apenas para comissionados)
            $table->decimal('commission_percentage', 5, 2)->nullable();
            $table->decimal('commission_total', 10, 2)->nullable();

            // Status
            $table->boolean('payment_received')->default(false);
            $table->boolean('commission_paid')->default(false);

            $table->timestamp('payment_received_at')->nullable();
            $table->timestamp('commission_paid_at')->nullable();

            $table->text('notes')->nullable();

            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};