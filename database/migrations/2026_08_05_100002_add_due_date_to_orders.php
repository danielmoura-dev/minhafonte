<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'due_date')) {
                // Data combinada para o cliente pagar (contas a receber)
                $table->date('due_date')->nullable()->after('issue_date');
                $table->index(['company_id', 'due_date']);
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['company_id', 'due_date']);
            $table->dropColumn('due_date');
        });
    }
};
