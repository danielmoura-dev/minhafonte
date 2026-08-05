<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_payments', function (Blueprint $table) {
            if (! Schema::hasColumn('order_payments', 'receipt_path')) {
                // Comprovante do pagamento (foto de cheque, Pix, depósito) — imagem ou PDF
                $table->string('receipt_path')->nullable()->after('notes');
            }
        });
    }

    public function down(): void
    {
        Schema::table('order_payments', function (Blueprint $table) {
            $table->dropColumn('receipt_path');
        });
    }
};
