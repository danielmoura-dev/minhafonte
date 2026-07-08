<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_movements', function (Blueprint $table) {
            if (! Schema::hasColumn('product_movements', 'order_id')) {
                $table->foreignId('order_id')
                      ->nullable()
                      ->after('supplier_id')
                      ->constrained('orders')
                      ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('product_movements', function (Blueprint $table) {
            if (Schema::hasColumn('product_movements', 'order_id')) {
                $table->dropForeign(['order_id']);
                $table->dropColumn('order_id');
            }
        });
    }
};
