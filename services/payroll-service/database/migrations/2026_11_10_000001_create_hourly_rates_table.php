<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hourly_rates', function (Blueprint $table) {
            $table->id();
            // Pas de clé étrangère : users vit dans la base d'auth-service.
            $table->unsignedBigInteger('user_id');
            $table->unsignedInteger('amount_cents');
            $table->date('effective_from');
            $table->timestamps();

            $table->unique(['user_id', 'effective_from']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hourly_rates');
    }
};
