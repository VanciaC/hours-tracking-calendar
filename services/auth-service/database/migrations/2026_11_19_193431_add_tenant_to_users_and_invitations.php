<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Nullable first, so existing rows can be given a company before the column becomes required.
        foreach (['users', 'invitations'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                // A company cannot be deleted while it still has accounts: it is suspended instead.
                $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->restrictOnDelete();
            });
        }

        // Accounts created before companies existed join a "demo" company.
        if (DB::table('users')->exists() || DB::table('invitations')->exists()) {
            $demoId = DB::table('tenants')->insertGetId([
                'slug' => 'demo',
                'name' => 'Demo',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('users')->update(['tenant_id' => $demoId]);
            DB::table('invitations')->update(['tenant_id' => $demoId]);
        }

        // Every account and invitation belongs to a company, and an email is unique within its company only.
        foreach (['users', 'invitations'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->unsignedBigInteger('tenant_id')->nullable(false)->change();
                $table->dropUnique(['email']);
                $table->unique(['tenant_id', 'email']);
            });
        }
    }

    public function down(): void
    {
        foreach (['users', 'invitations'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropUnique(['tenant_id', 'email']);
                $table->unique(['email']);
                $table->dropConstrainedForeignId('tenant_id');
            });
        }
    }
};
