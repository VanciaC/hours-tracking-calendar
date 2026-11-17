<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('refresh_tokens', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // All the tokens of one session, so a stolen token can revoke the whole session at once.
            $table->uuid('family_id')->index();
            // SHA-256 of the token in the cookie: the token itself is never stored.
            $table->char('token_hash', 64)->unique();
            $table->timestamp('expires_at');
            // Set when the token is exchanged for a new one (rotation).
            $table->timestamp('used_at')->nullable();
            // Set at logout, or when a stolen token is detected.
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('refresh_tokens');
    }
};
