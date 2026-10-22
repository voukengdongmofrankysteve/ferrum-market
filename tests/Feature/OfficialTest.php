<?php

namespace Tests\Feature;

use App\Models\Extension;
use App\Models\Publisher;
use App\Support\Official;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class OfficialTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Bundles and icons are stored by database id: never write them into the real storage folder.
        Storage::fake('local');
    }

    private function files(): array
    {
        return glob(resource_path('official').'/*.fext') ?: [];
    }

    public function test_every_official_package_publishes(): void
    {
        $files = $this->files();
        $this->assertGreaterThan(100, count($files));

        $r = Official::sync(null, true);
        $this->assertSame(['published' => count($files), 'skipped' => 0, 'failed' => 0], $r);
        $this->assertSame(count($files), Extension::count());
        $this->assertTrue((bool) Publisher::where('slug', 'vyloxi')->first()->verified);

        // A second run has nothing new: each version is skipped, not duplicated.
        $again = Official::sync(null, true);
        $this->assertSame(0, $again['published']);
        $this->assertSame(count($files), $again['skipped']);
        $this->assertSame(count($files), Extension::count());
    }

    public function test_catalog_search_and_download_work_for_official_packages(): void
    {
        Official::sync(null, true);

        $this->getJson('/api/v1/extensions?q=kotlin')->assertOk()->assertJsonFragment(['id' => 'vyloxi.kotlin']);
        $this->getJson('/api/v1/extensions?category=Themes&per=50')->assertOk()->assertJsonFragment(['id' => 'vyloxi.dracula-soft']);
        $this->getJson('/api/v1/extensions/vyloxi.text-tools')->assertOk()->assertJsonFragment(['permissions' => []]);
        $this->getJson('/api/v1/extensions/vyloxi.npm-scripts')->assertOk()->assertJsonFragment(['permissions' => ['workspace.read', 'terminal']]);

        $raw = $this->get('/api/v1/extensions/vyloxi.python-snippets/download')->assertOk()->getContent();
        $bundle = json_decode($raw, true);
        $this->assertSame(1, $bundle['format']);
        $this->assertSame('python-snippets', $bundle['manifest']['name']);
        $this->get('/api/v1/extensions/vyloxi.kotlin/icon')->assertOk()->assertHeader('content-type', 'image/png');
        $this->get('/extensions/vyloxi.rust-snippets')->assertOk()->assertSee('Rust Snippets');
    }

    public function test_it_does_nothing_without_packages(): void
    {
        $dir = sys_get_temp_dir().'/ferrum-empty-'.uniqid();
        mkdir($dir);
        $this->assertSame(['published' => 0, 'skipped' => 0, 'failed' => 0], Official::sync($dir, true));
        rmdir($dir);
        $this->assertSame(0, Extension::count());
    }

    public function test_a_broken_package_is_reported_not_fatal(): void
    {
        $dir = sys_get_temp_dir().'/ferrum-bad-'.uniqid();
        mkdir($dir);
        file_put_contents($dir.'/bad.fext', '{"format":1,"manifest":{},"files":{}}');
        foreach (array_slice($this->files(), 0, 2) as $f) {
            copy($f, $dir.'/'.basename($f));
        }
        $r = Official::sync($dir, true);
        $this->assertSame(2, $r['published']);
        $this->assertSame(1, $r['failed']);
        array_map('unlink', glob($dir.'/*'));
        rmdir($dir);
    }
}
