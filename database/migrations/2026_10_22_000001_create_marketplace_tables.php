<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $t) {
            $t->boolean('is_admin')->default(false);
        });

        Schema::create('publishers', function (Blueprint $t) {
            $t->id();
            $t->string('slug', 40)->unique();
            $t->string('name', 80);
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->boolean('verified')->default(false);
            $t->string('website')->nullable();
            $t->timestamps();
        });

        Schema::create('extensions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('publisher_id')->constrained()->cascadeOnDelete();
            $t->string('name', 50);
            $t->string('display_name', 80);
            $t->string('description', 300);
            $t->string('category', 40)->index();
            $t->string('repo_url')->nullable();
            $t->unsignedInteger('installs')->default(0)->index();
            $t->unsignedInteger('rating_sum')->default(0);
            $t->unsignedInteger('rating_count')->default(0);
            $t->boolean('unpublished')->default(false)->index();
            $t->boolean('has_icon')->default(false);
            $t->timestamps();
            $t->unique(['publisher_id', 'name']);
        });

        Schema::create('extension_versions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('extension_id')->constrained()->cascadeOnDelete();
            $t->string('version', 40);
            $t->json('manifest');
            $t->mediumText('readme');
            $t->mediumText('changelog');
            $t->unsignedInteger('size');
            $t->string('permissions')->default('');
            $t->timestamps();
            $t->unique(['extension_id', 'version']);
        });

        Schema::create('reviews', function (Blueprint $t) {
            $t->id();
            $t->foreignId('extension_id')->constrained()->cascadeOnDelete();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->unsignedTinyInteger('stars');
            $t->text('body');
            $t->timestamps();
            $t->unique(['extension_id', 'user_id']);
        });

        Schema::create('api_tokens', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('token_hash', 64)->unique();
            $t->string('label', 80);
            $t->timestamp('last_used_at')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('api_tokens');
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('extension_versions');
        Schema::dropIfExists('extensions');
        Schema::dropIfExists('publishers');
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn('is_admin'));
    }
};
