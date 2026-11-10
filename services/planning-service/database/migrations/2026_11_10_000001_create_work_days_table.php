<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('work_days', function (Blueprint $table) {
            $table->id();
            // Pas de clé étrangère : users vit dans la base d'auth-service.
            $table->unsignedBigInteger('user_id');
            $table->date('date');
            $table->string('mode', 16); // duration | slots
            $table->unsignedInteger('duration_minutes');
            $table->string('note', 500)->nullable();
            $table->timestamps();

            // Une seule saisie par utilisateur et par date (RG-03).
            $table->unique(['user_id', 'date']);
        });

        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('work_day_id')->constrained()->cascadeOnDelete();
            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedSmallInteger('break_minutes')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shifts');
        Schema::dropIfExists('work_days');
    }
};
