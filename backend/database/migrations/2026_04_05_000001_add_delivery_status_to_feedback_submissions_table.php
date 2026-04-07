<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('feedback_submissions', function (Blueprint $table) {
            $table->string('delivery_status', 32)->default('pending')->after('message');
            $table->index('delivery_status');
        });
    }

    public function down(): void
    {
        Schema::table('feedback_submissions', function (Blueprint $table) {
            $table->dropIndex(['delivery_status']);
            $table->dropColumn('delivery_status');
        });
    }
};
