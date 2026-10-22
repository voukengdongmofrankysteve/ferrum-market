<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApiToken;
use App\Models\Extension;
use App\Models\User;
use App\Support\Bundle;
use App\Support\Catalog;
use App\Support\Publishing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\Response;

/** The JSON API the Ferrum editor talks to. */
class ApiController extends Controller
{
    private function user(Request $r): ?User
    {
        $t = $r->bearerToken();

        return $t ? ApiToken::userFor($t) : null;
    }

    private function needUser(Request $r): User
    {
        return $this->user($r) ?? abort(response()->json(['error' => 'Sign in first. Create a token on your account page.'], 401));
    }

    private function find(string $publisher, string $name): Extension
    {
        return Extension::visible()->with('publisher')->whereHas('publisher', fn ($p) => $p->where('slug', $publisher))->where('name', $name)->first()
            ?? abort(response()->json(['error' => 'Not found.'], 404));
    }

    public function index(Request $r): JsonResponse
    {
        $p = Catalog::search((string) $r->query('q', ''), (string) $r->query('category', ''), (string) $r->query('sort', 'installs'), (int) $r->query('per', 20), (int) $r->query('page', 1));

        return response()->json(['total' => $p->total(), 'items' => $p->getCollection()->map(fn ($e) => Catalog::row($e))->values()]);
    }

    public function show(string $publisher, string $name): JsonResponse
    {
        $e = $this->find($publisher, $name);
        $latest = $e->latest();
        $out = Catalog::row($e);
        $out['version'] = $latest?->version;
        $out['manifest'] = $latest?->manifest;
        $out['readme'] = $latest?->readme ?? '';
        $out['changelog'] = $latest?->changelog ?? '';
        $out['versions'] = $e->sortedVersions()->map(fn ($v) => ['version' => $v->version, 'size' => $v->size, 'permissions' => $v->permissionList(), 'created' => $v->created_at?->toIso8601String()])->values();
        $out['reviews'] = $e->reviews()->with('user')->latest()->limit(50)->get()->map(fn ($r) => ['stars' => $r->stars, 'body' => $r->body, 'name' => $r->user->name, 'created' => $r->created_at?->toIso8601String()])->values();

        return response()->json($out);
    }

    public function icon(string $publisher, string $name)
    {
        $e = $this->find($publisher, $name);
        abort_unless($e->has_icon && Storage::disk('local')->exists('icons/'.$e->id.'.png'), 404);

        return response(Storage::disk('local')->get('icons/'.$e->id.'.png'), 200, ['Content-Type' => 'image/png', 'Cache-Control' => 'public, max-age=3600']);
    }

    public function download(Request $r, string $publisher, string $name): Response
    {
        $e = $this->find($publisher, $name);
        $want = (string) $r->query('version', '');
        $v = $e->sortedVersions()->first(fn ($row) => $want === '' || $row->version === $want);
        if (! $v || ! Storage::disk('local')->exists($v->bundlePath())) {
            return response()->json(['error' => 'That version does not exist.'], 404);
        }
        // One install is counted per address and extension per day.
        $key = 'dl:'.sha1($r->ip().':'.$e->id);
        if (Cache::add($key, 1, now()->addDay())) {
            $e->increment('installs');
        }

        return response(Storage::disk('local')->get($v->bundlePath()), 200, ['Content-Type' => 'application/json; charset=utf-8', 'X-Ferrum-Version' => $v->version]);
    }

    public function register(Request $r): JsonResponse
    {
        $d = validator($r->all(), ['name' => 'required|string|max:80', 'email' => 'required|email:rfc|max:190|unique:users,email', 'password' => 'required|string|min:8|max:200'])->validate();
        $u = new User(['name' => $d['name'], 'email' => strtolower($d['email']), 'password' => $d['password']]);
        $u->is_admin = $u->email === strtolower((string) config('market.admin_email'));
        $u->save();

        return response()->json(['token' => ApiToken::issue($u, 'Ferrum editor'), 'user' => $this->out($u)], 201);
    }

    public function login(Request $r): JsonResponse
    {
        $u = User::where('email', strtolower((string) $r->input('email')))->first();
        if (! $u || ! Hash::check((string) $r->input('password'), $u->password)) {
            return response()->json(['error' => 'The email or the password is wrong.'], 401);
        }

        return response()->json(['token' => ApiToken::issue($u, 'Ferrum editor'), 'user' => $this->out($u)]);
    }

    public function me(Request $r): JsonResponse
    {
        $u = $this->needUser($r);

        return response()->json(['user' => $this->out($u), 'publishers' => $u->publishers()->get(['slug', 'name', 'verified'])]);
    }

    public function createPublisher(Request $r): JsonResponse
    {
        $u = $this->needUser($r);
        try {
            Publishing::createPublisher($u, (string) $r->input('slug'), (string) $r->input('name'));
        } catch (InvalidArgumentException $x) {
            return response()->json(['error' => $x->getMessage()], 422);
        }

        return response()->json(['ok' => true], 201);
    }

    public function publish(Request $r): JsonResponse
    {
        $u = $this->needUser($r);
        $raw = (string) $r->getContent();
        if (strlen($raw) > 3_000_000) {
            return response()->json(['ok' => false, 'message' => 'The package is too large.'], 413);
        }
        try {
            $out = Publishing::publishRaw($u, $raw);
        } catch (InvalidArgumentException $x) {
            return response()->json(['ok' => false, 'message' => $x->getMessage()], 422);
        }
        $e = $out['extension']->load('publisher');

        return response()->json(['ok' => true, 'id' => $e->full_id, 'message' => $e->display_name.' '.$out['version'].' is published.'], 201);
    }

    public function review(Request $r, string $publisher, string $name): JsonResponse
    {
        $u = $this->needUser($r);
        try {
            Publishing::review($this->find($publisher, $name), $u, (int) $r->input('stars'), (string) $r->input('body', ''));
        } catch (InvalidArgumentException $x) {
            return response()->json(['error' => $x->getMessage()], 422);
        }

        return response()->json(['ok' => true]);
    }

    public function categories(): JsonResponse
    {
        return response()->json(Bundle::CATEGORIES);
    }

    private function out(User $u): array
    {
        return ['id' => $u->id, 'name' => $u->name, 'email' => $u->email];
    }
}
