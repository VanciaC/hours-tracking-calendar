<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entry_templates', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->index();
            $table->string('label', 100)->nullable();
            $table->string('mode', 16); // duration | slots
            $table->unsignedInteger('duration_minutes')->nullable();
            $table->json('slots')->nullable();
            // Un seul défaut par utilisateur (RG-04), vérifié côté application.
            $table->boolean('is_default')->default(false);
            $table->unsignedInteger('usage_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entry_templates');
    }
};
