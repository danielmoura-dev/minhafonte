<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Alguns itens têm valor unitário fracionário de verdade (ex.: R$ 0,067 por
 * tampa, num boleto de matéria-prima comprada a granel) — decimal(10,2)
 * arredondava isso para 0,07 silenciosamente. Mantém a mesma capacidade da
 * parte inteira (8 dígitos) e ganha a terceira casa decimal.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_movements', function (Blueprint $table) {
            $table->decimal('unit_price', 11, 3)->nullable()->change();
        });

        Schema::table('raw_material_movements', function (Blueprint $table) {
            $table->decimal('unit_price', 11, 3)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('product_movements', function (Blueprint $table) {
            $table->decimal('unit_price', 10, 2)->nullable()->change();
        });

        Schema::table('raw_material_movements', function (Blueprint $table) {
            $table->decimal('unit_price', 10, 2)->nullable()->change();
        });
    }
};
