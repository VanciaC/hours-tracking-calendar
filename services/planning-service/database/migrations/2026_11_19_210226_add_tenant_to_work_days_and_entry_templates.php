<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['work_days', 'entry_templates'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                // Company of the row, from the access token. No foreign key: companies live in auth-service.
                $table->unsignedBigInteger('tenant_id')->nullable()->after('id');
            });

            // Rows recorded before companies existed: the first company, "demo" after `make fresh`.
            DB::table($tableName)->update(['tenant_id' => 1]);

            Schema::table($tableName, function (Blueprint $table) {
                $table->unsignedBigInteger('tenant_id')->nullable(false)->change();
            });
        }

        Schema::table('work_days', function (Blueprint $table) {
            // The team schedule reads one company over a period.
            $table->index(['tenant_id', 'date']);
        });

        Schema::table('entry_templates', function (Blueprint $table) {
            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::table('work_days', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'date']);
            $table->dropColumn('tenant_id');
        });

        Schema::table('entry_templates', function (Blueprint $table) {
            $table->dropIndex(['tenant_id']);
            $table->dropColumn('tenant_id');
        });
    }
};
