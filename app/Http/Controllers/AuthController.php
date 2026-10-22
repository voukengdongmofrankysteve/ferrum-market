<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function registerForm()
    {
        return view('auth.register');
    }

    public function register(Request $r): RedirectResponse
    {
        $data = $r->validate([
            'name' => 'required|string|max:80',
            'email' => 'required|email:rfc|max:190|unique:users,email',
            'password' => 'required|string|min:8|max:200|confirmed',
        ]);
        $user = new User(['name' => $data['name'], 'email' => strtolower($data['email']), 'password' => $data['password']]);
        // The address named in ADMIN_EMAIL becomes the administrator when it signs up.
        $user->is_admin = $user->email === strtolower((string) config('market.admin_email'));
        $user->save();
        Auth::login($user);
        $r->session()->regenerate();

        return redirect()->route('account')->with('ok', 'Welcome to the Ferrum Marketplace.');
    }

    public function loginForm()
    {
        return view('auth.login');
    }

    public function login(Request $r): RedirectResponse
    {
        $data = $r->validate(['email' => 'required|email', 'password' => 'required|string']);
        if (! Auth::attempt(['email' => strtolower($data['email']), 'password' => $data['password']], $r->boolean('remember'))) {
            return back()->withInput($r->only('email'))->with('err', 'The email or the password is wrong.');
        }
        $r->session()->regenerate();

        return redirect()->intended(route('account'));
    }

    public function logout(Request $r): RedirectResponse
    {
        Auth::logout();
        $r->session()->invalidate();
        $r->session()->regenerateToken();

        return redirect('/')->with('ok', 'You are signed out.');
    }
}
