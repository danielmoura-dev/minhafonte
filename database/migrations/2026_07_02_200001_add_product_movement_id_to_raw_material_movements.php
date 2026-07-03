<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('raw_material_movements', function (Blueprint $table) {
            if (! Schema::hasColumn('raw_material_movements', 'product_movement_id')) {
                $table->foreignId('product_movement_id')
                      ->nullable()
                      ->after('supplier_id')
                      ->constrained('product_movements')
                      ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('raw_material_movements', function (Blueprint $table) {
            if (Schema::hasColumn('raw_material_movements', 'product_movement_id')) {
                $table->dropForeign(['product_movement_id']);
                $table->dropColumn('product_movement_id');
            }
        });
    }
};
