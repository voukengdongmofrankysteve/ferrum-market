<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $t) {
            // free, pro or blocked; ai_daily_tokens overrides the plan's daily allowance for one person.
            $t->string('ai_plan', 12)->default('free');
            $t->unsignedInteger('ai_daily_tokens')->nullable();
        });

        // One row per person, day and model: what the built-in AI cost and how much it was used.
        Schema::create('ai_usages', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->date('day')->index();
            $t->string('model', 60);
            $t->unsignedInteger('requests')->default(0);
            $t->unsignedBigInteger('input_tokens')->default(0);
            $t->unsignedBigInteger('output_tokens')->default(0);
            // Cost in millionths of a US dollar, so sums stay exact integers.
            $t->unsignedBigInteger('cost_micro')->default(0);
            $t->timestamps();
            $t->unique(['user_id', 'day', 'model']);
        });

        // Settings the administrator edits on the AI page (the provider key is stored encrypted).
        Schema::create('ai_settings', function (Blueprint $t) {
            $t->string('key', 40)->primary();
            $t->longText('value')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_settings');
        Schema::dropIfExists('ai_usages');
        Schema::table('users', function (Blueprint $t) {
            $t->dropColumn(['ai_plan', 'ai_daily_tokens']);
        });
    }
};
