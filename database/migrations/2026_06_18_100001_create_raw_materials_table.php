<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('raw_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('code')->nullable();
            $table->string('name');
            $table->string('unit'); // unidade, quilo, grama, litro, metro
            $table->decimal('current_price', 10, 2);
            $table->decimal('min_quantity', 12, 3)->default(0);
            $table->decimal('current_stock', 12, 3)->default(0);
            $table->string('photo')->nullable();
            $table->boolean('active')->default(true);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('raw_materials');
    }
};
