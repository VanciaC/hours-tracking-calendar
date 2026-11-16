<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shifts', function (Blueprint $table) {
            // Explicit name: the break is deducted from worked time only when it is unpaid.
            $table->renameColumn('break_minutes', 'unpaid_break_minutes');
        });
    }

    public function down(): void
    {
        Schema::table('shifts', function (Blueprint $table) {
            $table->renameColumn('unpaid_break_minutes', 'break_minutes');
        });
    }
};
