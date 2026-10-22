<?php

namespace Tests\Feature;

use App\Models\ApiToken;
use App\Models\Extension;
use App\Models\Publisher;
use App\Models\User;
use App\Support\Bundle;
use App\Support\Version;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MarketplaceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Bundles and icons are stored by database id: never write them into the real storage folder.
        Storage::fake('local');
    }

    private function bundle(array $manifest = [], array $files = []): array
    {
        $m = array_merge([
            'name' => 'hello', 'publisher' => 'acme', 'version' => '1.0.0', 'displayName' => 'Hello', 'description' => 'Says hello.',
            'engines' => ['ferrum' => '^0.1.0'], 'categories' => ['Tools'], 'main' => 'extension.js', 'permissions' => ['workspace.read'],
            'contributes' => ['commands' => [['command' => 'hello.say', 'title' => 'Say Hello']]],
        ], $manifest);
        $f = array_merge([
            'extension.js' => ['encoding' => 'utf8', 'content' => 'exports.activate = () => {};'],
            'README.md' => ['encoding' => 'utf8', 'content' => "# Hello\n\n<script>alert(1)</script>\n\n[bad](javascript:alert(1))"],
        ], $files);

        return ['format' => 1, 'manifest' => $m, 'files' => $f];
    }

    private function user(): array
    {
        $u = User::factory()->create(['password' => 'secret-pass-1']);
        Publisher::create(['slug' => 'acme', 'name' => 'Acme', 'user_id' => $u->id]);

        return [$u, ApiToken::issue($u, 'test')];
    }

    private function publish(string $token, array $bundle)
    {
        return $this->call('POST', '/api/v1/publish', [], [], [], ['HTTP_AUTHORIZATION' => 'Bearer '.$token, 'CONTENT_TYPE' => 'application/json'], json_encode($bundle));
    }

    public function test_pages_render(): void
    {
        $this->get('/')->assertOk()->assertSee('Make Ferrum yours');
        $this->get('/extensions')->assertOk();
        $this->get('/docs')->assertOk()->assertSee('Extensions overview');
        foreach (array_keys(config('docs.pages')) as $slug) {
            $this->get('/docs/'.$slug)->assertOk();
        }
        $this->get('/register')->assertOk();
        $this->get('/login')->assertOk();
        $this->get('/sitemap.xml')->assertOk();
        $this->get('/nothing-here')->assertNotFound();
    }

    public function test_publish_download_search_and_page(): void
    {
        [, $token] = $this->user();
        $this->publish($token, $this->bundle())->assertCreated()->assertJson(['ok' => true, 'id' => 'acme.hello']);

        $this->getJson('/api/v1/extensions?q=hel')->assertOk()->assertJsonPath('total', 1)->assertJsonPath('items.0.id', 'acme.hello');
        $this->getJson('/api/v1/extensions?q=zzz')->assertJsonPath('total', 0);
        $this->getJson('/api/v1/extensions/acme.hello')->assertOk()->assertJsonPath('version', '1.0.0');

        $r = $this->get('/api/v1/extensions/acme.hello/download')->assertOk();
        $this->assertSame(1, json_decode($r->getContent(), true)['format']);
        $this->assertSame(1, Extension::first()->installs);
        // The same address downloading again the same day is not counted twice.
        $this->get('/api/v1/extensions/acme.hello/download')->assertOk();
        $this->assertSame(1, Extension::first()->fresh()->installs);

        // The page shows the README with the script and the unsafe link neutralised.
        $page = $this->get('/extensions/acme.hello')->assertOk();
        $page->assertSee('Hello')->assertDontSee('<script>alert(1)</script>', false)->assertDontSee('href="javascript:', false);
        $this->get('/extensions/acme.hello?tab=contributions')->assertOk()->assertSee('Say Hello');
    }

    public function test_versions_must_increase_and_ownership_is_checked(): void
    {
        [, $token] = $this->user();
        $this->publish($token, $this->bundle())->assertCreated();
        $this->publish($token, $this->bundle())->assertStatus(422)->assertJsonPath('ok', false);
        $this->publish($token, $this->bundle(['version' => '0.9.0']))->assertStatus(422);
        $this->publish($token, $this->bundle(['version' => '1.0.1']))->assertCreated();
        $this->getJson('/api/v1/extensions/acme.hello')->assertJsonPath('version', '1.0.1')->assertJsonCount(2, 'versions');

        $other = User::factory()->create();
        $otherToken = ApiToken::issue($other, 'x');
        $this->publish($otherToken, $this->bundle(['version' => '2.0.0']))->assertStatus(422)->assertSee('do not own');
        $this->publish('fxt_bogus', $this->bundle())->assertUnauthorized();
        $this->call('POST', '/api/v1/publish', [], [], [], ['CONTENT_TYPE' => 'application/json'], '{}')->assertUnauthorized();
    }

    public function test_bad_packages_are_refused_with_a_reason(): void
    {
        [, $token] = $this->user();
        $cases = [
            'name' => [['name' => 'Bad Name'], [], 'manifest.name'],
            'version' => [['version' => '1'], [], 'manifest.version'],
            'permission' => [['permissions' => ['root']], [], 'Unknown permission'],
            'contribution' => [['contributes' => ['menus' => []]], [], 'Unknown contribution point'],
            'activation' => [['activationEvents' => ['onMagic']], [], 'Unknown activation event'],
            'main' => [['main' => 'nope.js'], [], 'manifest.main'],
            'path' => [[], ['../evil.js' => ['encoding' => 'utf8', 'content' => 'x']], 'Unsafe file path'],
            'base64' => [[], ['a.bin' => ['encoding' => 'base64', 'content' => '***']], 'not valid base64'],
            'theme' => [['contributes' => ['themes' => [['label' => 'x', 'path' => 'missing.json']]]], [], 'not in the package'],
            'icon' => [['icon' => 'icon.png'], ['icon.png' => ['encoding' => 'utf8', 'content' => 'not a png']], 'manifest.icon'],
            'repo' => [['repository' => 'http://insecure'], [], 'https'],
        ];
        foreach ($cases as $label => [$m, $f, $needle]) {
            $this->publish($token, $this->bundle($m, $f))->assertStatus(422)->assertSee($needle, false);
        }
        $this->publish($token, ['format' => 2])->assertStatus(422);
        $this->assertSame(0, Extension::count());
    }

    public function test_size_limit(): void
    {
        [, $token] = $this->user();
        $big = ['big.txt' => ['encoding' => 'utf8', 'content' => str_repeat('a', Bundle::MAX_BYTES + 10)]];
        $this->publish($token, $this->bundle([], $big))->assertStatus(422)->assertSee('larger than');
    }

    public function test_reviews_update_the_average(): void
    {
        [, $token] = $this->user();
        $this->publish($token, $this->bundle())->assertCreated();
        $a = User::factory()->create();
        $b = User::factory()->create();
        $ta = ApiToken::issue($a, 'a');
        $tb = ApiToken::issue($b, 'b');
        $url = '/api/v1/extensions/acme.hello/reviews';
        $this->postJson($url, ['stars' => 5, 'body' => 'great'], ['Authorization' => 'Bearer '.$ta])->assertOk();
        $this->postJson($url, ['stars' => 2], ['Authorization' => 'Bearer '.$tb])->assertOk();
        $this->assertEqualsWithDelta(3.5, Extension::first()->rating, 0.001);
        // A second review by the same person replaces the first.
        $this->postJson($url, ['stars' => 1], ['Authorization' => 'Bearer '.$ta])->assertOk();
        $e = Extension::first();
        $this->assertSame(2, $e->rating_count);
        $this->assertEqualsWithDelta(1.5, $e->rating, 0.001);
        $this->postJson($url, ['stars' => 9], ['Authorization' => 'Bearer '.$ta])->assertStatus(422);
        $this->postJson($url, ['stars' => 3])->assertUnauthorized();
    }

    public function test_accounts_on_the_website_and_the_api(): void
    {
        $this->post('/register', ['name' => 'Ada', 'email' => 'ada@example.com', 'password' => 'long-enough-1', 'password_confirmation' => 'long-enough-1'])->assertRedirect('/account');
        $this->assertAuthenticated();
        $this->post('/logout')->assertRedirect('/');
        $this->post('/login', ['email' => 'ada@example.com', 'password' => 'wrong'])->assertSessionHas('err');
        $this->post('/login', ['email' => 'ada@example.com', 'password' => 'long-enough-1'])->assertRedirect('/account');
        $this->get('/account')->assertOk()->assertSee('Your account');

        $this->post('/account/publishers', ['slug' => 'ada-tools', 'name' => 'Ada Tools'])->assertSessionHas('ok');
        $this->post('/account/publishers', ['slug' => 'ferrum'])->assertSessionHas('err');
        $this->post('/account/publishers', ['slug' => 'ada-tools'])->assertSessionHas('err');

        $r = $this->postJson('/api/v1/auth/register', ['name' => 'Bob', 'email' => 'bob@example.com', 'password' => 'long-enough-1'])->assertCreated();
        $this->assertStringStartsWith('fxt_', $r->json('token'));
        $this->postJson('/api/v1/auth/register', ['name' => 'Bob', 'email' => 'bob@example.com', 'password' => 'long-enough-1'])->assertStatus(422);
        $this->postJson('/api/v1/auth/login', ['email' => 'bob@example.com', 'password' => 'nope'])->assertUnauthorized();
        $t = $this->postJson('/api/v1/auth/login', ['email' => 'bob@example.com', 'password' => 'long-enough-1'])->assertOk()->json('token');
        $this->getJson('/api/v1/me', ['Authorization' => 'Bearer '.$t])->assertOk()->assertJsonPath('user.email', 'bob@example.com');
    }

    public function test_pages_that_need_an_account_redirect_to_login(): void
    {
        $this->get('/publish')->assertRedirect('/login');
        $this->get('/account')->assertRedirect('/login');
        $this->get('/admin')->assertRedirect('/login');
        $user = User::factory()->create();
        $this->actingAs($user)->get('/admin')->assertForbidden();
    }

    public function test_hiding_an_extension_removes_it_from_the_catalogue(): void
    {
        [$u, $token] = $this->user();
        $this->publish($token, $this->bundle())->assertCreated();
        $e = Extension::first();
        $this->actingAs($u)->post('/manage/'.$e->id.'/toggle')->assertRedirect();
        $this->getJson('/api/v1/extensions')->assertJsonPath('total', 0);
        $this->get('/extensions/acme.hello')->assertNotFound();
        // Someone else cannot hide it.
        $this->actingAs(User::factory()->create())->post('/manage/'.$e->id.'/toggle')->assertForbidden();
    }

    public function test_version_compare(): void
    {
        $this->assertSame(1, Version::compare('1.10.0', '1.9.9'));
        $this->assertSame(-1, Version::compare('1.0.0-beta.1', '1.0.0'));
        $this->assertSame(1, Version::compare('1.0.0-beta.2', '1.0.0-beta.1'));
        $this->assertSame(0, Version::compare('2.0.0', '2.0.0'));
        $this->assertTrue(Version::valid('1.2.3-rc.1'));
        $this->assertFalse(Version::valid('1.2'));
    }
}
