<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sellers', function (Blueprint $table) {
            $table->string('password')->nullable()->after('email');
            $table->string('remember_token', 100)->nullable()->after('password');
            $table->timestamp('first_access_at')->nullable()->after('remember_token');
        });
    }

    public function down(): void
    {
        Schema::table('sellers', function (Blueprint $table) {
            $table->dropColumn(['password', 'remember_token', 'first_access_at']);
        });
    }
};