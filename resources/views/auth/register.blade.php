@extends('layouts.app', ['title' => 'Create an account'])

@section('content')
<div class="wrap narrow">
    <h1>Create an account</h1>
    <form class="form" method="post" action="{{ route('register') }}">
        @csrf
        <label>Your name <input type="text" name="name" value="{{ old('name') }}" required maxlength="80" autofocus autocomplete="name"></label>
        <label>Email <input type="email" name="email" value="{{ old('email') }}" required autocomplete="email"></label>
        <label>Password <input type="password" name="password" required minlength="8" autocomplete="new-password"></label>
        <label>Repeat the password <input type="password" name="password_confirmation" required minlength="8" autocomplete="new-password"></label>
        <button class="btn" type="submit">Create account</button>
    </form>
    <p class="hint">Already registered? <a href="{{ route('login') }}">Sign in</a>. After signing up, create a publisher on your account page to publish extensions.</p>
</div>
@endsection
