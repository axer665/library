<?php

use App\Models\Archive;
use App\Models\Book;
use App\Models\Location;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('locations', function (Blueprint $table) {
            $table->unsignedInteger('sort_order')->default(0)->after('name');
        });

        Schema::table('archives', function (Blueprint $table) {
            $table->unsignedInteger('sort_order')->default(0)->after('name');
        });

        Schema::table('books', function (Blueprint $table) {
            $table->unsignedInteger('sort_order')->default(0)->after('archive_id');
        });

        $this->backfillLocations();
        $this->backfillArchives();
        $this->backfillBooks();
    }

    private function backfillLocations(): void
    {
        $groups = Location::query()->orderBy('user_id')->orderBy('id')->get()->groupBy('user_id');
        foreach ($groups as $locs) {
            foreach ($locs->values() as $index => $loc) {
                $loc->updateQuietly(['sort_order' => $index]);
            }
        }
    }

    private function backfillArchives(): void
    {
        $groups = Archive::query()->orderBy('location_id')->orderBy('id')->get()->groupBy('location_id');
        foreach ($groups as $archs) {
            foreach ($archs->values() as $index => $arch) {
                $arch->updateQuietly(['sort_order' => $index]);
            }
        }
    }

    private function backfillBooks(): void
    {
        $groups = Book::query()->orderBy('archive_id')->orderBy('id')->get()->groupBy('archive_id');
        foreach ($groups as $books) {
            foreach ($books->values() as $index => $book) {
                $book->updateQuietly(['sort_order' => $index]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('locations', function (Blueprint $table) {
            $table->dropColumn('sort_order');
        });
        Schema::table('archives', function (Blueprint $table) {
            $table->dropColumn('sort_order');
        });
        Schema::table('books', function (Blueprint $table) {
            $table->dropColumn('sort_order');
        });
    }
};
