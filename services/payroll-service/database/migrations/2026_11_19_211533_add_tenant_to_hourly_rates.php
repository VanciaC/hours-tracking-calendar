<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hourly_rates', function (Blueprint $table) {
            // Company of the rate, from the access token. No foreign key: companies live in auth-service.
            $table->unsignedBigInteger('tenant_id')->nullable()->after('id');
        });

        // Rates recorded before companies existed: the first company, "demo" after `make fresh`.
        DB::table('hourly_rates')->update(['tenant_id' => 1]);

        Schema::table('hourly_rates', function (Blueprint $table) {
            $table->unsignedBigInteger('tenant_id')->nullable(false)->change();
            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::table('hourly_rates', function (Blueprint $table) {
            $table->dropIndex(['tenant_id']);
            $table->dropColumn('tenant_id');
        });
    }
};
