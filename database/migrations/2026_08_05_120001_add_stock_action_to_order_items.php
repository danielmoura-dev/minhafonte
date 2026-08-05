<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            if (! Schema::hasColumn('order_items', 'stock_action')) {
                // Cada item decide o próprio tratamento: none | deduct | produce
                $table->string('stock_action')->default('none')->after('subtotal');
            }
        });

        // Vendas antigas: o item herda a ação que estava na venda, para que
        // editar/excluir continue estornando e reprocessando corretamente.
        DB::statement('
            UPDATE order_items
               SET stock_action = COALESCE(
                   (SELECT o.stock_action FROM orders o WHERE o.id = order_items.order_id),
                   \'none\'
               )
        ');
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn('stock_action');
        });
    }
};
