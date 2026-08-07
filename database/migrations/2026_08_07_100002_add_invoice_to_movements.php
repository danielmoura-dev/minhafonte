<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Nota fiscal anexada a uma movimentação de compra — mesma ideia do
 * comprovante de pagamento em order_payments.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_movements', function (Blueprint $table) {
            if (! Schema::hasColumn('product_movements', 'invoice_path')) {
                $table->string('invoice_path')->nullable()->after('unit_price');
            }
        });

        Schema::table('raw_material_movements', function (Blueprint $table) {
            if (! Schema::hasColumn('raw_material_movements', 'invoice_path')) {
                $table->string('invoice_path')->nullable()->after('unit_price');
            }
        });
    }

    public function down(): void
    {
        Schema::table('product_movements', function (Blueprint $table) {
            $table->dropColumn('invoice_path');
        });

        Schema::table('raw_material_movements', function (Blueprint $table) {
            $table->dropColumn('invoice_path');
        });
    }
};
