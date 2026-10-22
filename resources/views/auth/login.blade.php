@extends('layouts.app', ['title' => 'Sign in'])

@section('content')
<div class="wrap narrow">
    <h1>Sign in</h1>
    <form class="form" method="post" action="{{ route('login') }}">
        @csrf
        <label>Email <input type="email" name="email" value="{{ old('email') }}" required autofocus autocomplete="email"></label>
        <label>Password <input type="password" name="password" required autocomplete="current-password"></label>
        <label class="check"><input type="checkbox" name="remember" value="1"> Keep me signed in</label>
        <button class="btn" type="submit">Sign in</button>
    </form>
    <p class="hint">New here? <a href="{{ route('register') }}">Create an account</a>. You do not need an account to install extensions, only to publish or review.</p>
</div>
@endsection
