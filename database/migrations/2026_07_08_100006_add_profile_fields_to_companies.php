<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            if (! Schema::hasColumn('companies', 'logo')) {
                $table->string('logo')->nullable()->after('fantasy_name');
            }
            if (! Schema::hasColumn('companies', 'phone')) {
                $table->string('phone', 20)->nullable()->after('logo');
            }
            if (! Schema::hasColumn('companies', 'address')) {
                $table->string('address')->nullable()->after('phone');
            }
            if (! Schema::hasColumn('companies', 'city')) {
                $table->string('city', 100)->nullable()->after('address');
            }
            if (! Schema::hasColumn('companies', 'state')) {
                $table->string('state', 2)->nullable()->after('city');
            }
        });
    }

    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['logo', 'phone', 'address', 'city', 'state']);
        });
    }
};
