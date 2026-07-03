<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'controls_stock')) {
                $table->boolean('controls_stock')->default(true)->after('default_price');
            }
            if (! Schema::hasColumn('products', 'min_quantity')) {
                $table->decimal('min_quantity', 12, 3)->default(0)->after('controls_stock');
            }
            if (! Schema::hasColumn('products', 'current_stock')) {
                $table->decimal('current_stock', 12, 3)->default(0)->after('min_quantity');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['controls_stock', 'min_quantity', 'current_stock']);
        });
    }
};
