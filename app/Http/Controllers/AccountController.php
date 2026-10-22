<?php

namespace App\Http\Controllers;

use App\Models\ApiToken;
use App\Models\Extension;
use App\Models\Publisher;
use App\Support\Publishing;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use InvalidArgumentException;

class AccountController extends Controller
{
    public function show(Request $r)
    {
        return view('pages.account', [
            'user' => $r->user(),
            'publishers' => $r->user()->publishers()->get(),
            'tokens' => $r->user()->tokens()->latest()->get(),
            'newToken' => session('new_token'),
        ]);
    }

    public function createPublisher(Request $r): RedirectResponse
    {
        $data = $r->validate(['slug' => 'required|string|max:40', 'name' => 'nullable|string|max:80']);
        try {
            Publishing::createPublisher($r->user(), $data['slug'], (string) ($data['name'] ?? ''));
        } catch (InvalidArgumentException $x) {
            return back()->with('err', $x->getMessage())->withInput();
        }

        return back()->with('ok', 'Publisher created.');
    }

    public function createToken(Request $r): RedirectResponse
    {
        $data = $r->validate(['label' => 'required|string|max:80']);

        return back()->with('new_token', ApiToken::issue($r->user(), $data['label']));
    }

    public function revokeToken(Request $r, ApiToken $token): RedirectResponse
    {
        abort_unless($token->user_id === $r->user()->id, 403);
        $token->delete();

        return back()->with('ok', 'Token revoked.');
    }

    public function password(Request $r): RedirectResponse
    {
        $data = $r->validate(['current' => 'required|string', 'new' => 'required|string|min:8|max:200']);
        if (! Hash::check($data['current'], $r->user()->password)) {
            return back()->with('err', 'The current password is wrong.');
        }
        $r->user()->update(['password' => $data['new']]);

        return back()->with('ok', 'Password changed.');
    }

    public function publishForm(Request $r)
    {
        return view('pages.publish', ['publishers' => $r->user()->publishers()->get()]);
    }

    public function publish(Request $r)
    {
        $r->validate(['bundle' => 'required|file|max:3000']);
        try {
            $out = Publishing::publishRaw($r->user(), (string) file_get_contents($r->file('bundle')->getRealPath()));
        } catch (InvalidArgumentException $x) {
            return back()->with('err', $x->getMessage());
        }
        $e = $out['extension']->load('publisher');

        return redirect()->route('extension', [$e->publisher->slug, $e->name])->with('ok', $e->display_name.' '.$out['version'].' is published.');
    }

    public function manage(Request $r)
    {
        $items = Extension::with('publisher')->whereHas('publisher', fn ($p) => $p->where('user_id', $r->user()->id))->latest('updated_at')->get();

        return view('pages.manage', ['items' => $items]);
    }

    public function toggleHidden(Request $r, Extension $extension): RedirectResponse
    {
        abort_unless($extension->publisher->user_id === $r->user()->id || $r->user()->is_admin, 403);
        $extension->update(['unpublished' => ! $extension->unpublished]);

        return back()->with('ok', $extension->unpublished ? 'The extension is hidden from the marketplace.' : 'The extension is visible again.');
    }

    public function admin(Request $r)
    {
        abort_unless($r->user()->is_admin, 403);

        return view('pages.admin', [
            'publishers' => Publisher::with('user')->latest()->limit(200)->get(),
            'extensions' => Extension::with('publisher')->latest()->limit(200)->get(),
        ]);
    }

    public function adminVerify(Request $r, Publisher $publisher): RedirectResponse
    {
        abort_unless($r->user()->is_admin, 403);
        $publisher->update(['verified' => ! $publisher->verified]);

        return back();
    }
}
