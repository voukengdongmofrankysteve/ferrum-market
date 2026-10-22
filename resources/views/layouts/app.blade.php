<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ isset($title) ? $title.' - ' : '' }}Ferrum Marketplace</title>
    <meta name="description" content="{{ $description ?? 'Extensions for the Ferrum code editor: themes, languages, snippets and tools.' }}">
    <meta name="theme-color" content="#1c1a19">
    <link rel="icon" type="image/svg+xml" href="{{ asset('img/mark.svg') }}">
    <link rel="stylesheet" href="{{ asset('css/market.css') }}?v={{ filemtime(public_path('css/market.css')) }}">
    @stack('head')
</head>
<body>
<header class="top">
    <div class="wrap bar">
        <a class="brand" href="{{ route('home') }}"><img src="{{ asset('img/mark.svg') }}" alt="" width="26" height="26"><span>Ferrum <b>Marketplace</b></span></a>
        <form class="search" action="{{ route('browse') }}" method="get" role="search">
            <input type="search" name="q" value="{{ request('q') }}" placeholder="Search extensions" aria-label="Search extensions">
        </form>
        <nav>
            <a href="{{ route('browse') }}" @class(['on' => request()->routeIs('browse', 'extension')])>Extensions</a>
            <a href="{{ route('docs') }}" @class(['on' => request()->routeIs('docs')])>Docs</a>
            @auth
                <a href="{{ route('publish') }}" @class(['on' => request()->routeIs('publish')])>Publish</a>
                <a href="{{ route('account') }}" @class(['on' => request()->routeIs('account', 'manage')])>{{ \Illuminate\Support\Str::limit(auth()->user()->name, 14) }}</a>
            @else
                <a href="{{ route('login') }}">Sign in</a>
                <a class="btn small" href="{{ route('register') }}">Create account</a>
            @endauth
        </nav>
    </div>
</header>

<main>
    <div class="wrap">
        @foreach (['ok' => 'ok', 'err' => 'err', 'info' => 'info'] as $key => $cls)
            @if (session($key))
                <div class="flash {{ $cls }}" role="status">{{ session($key) }}</div>
            @endif
        @endforeach
        @if ($errors->any())
            <div class="flash err" role="alert">{{ $errors->first() }}</div>
        @endif
    </div>
    @yield('content')
</main>

<footer>
    <div class="wrap">
        <span>Ferrum Marketplace, by Vyloxi</span>
        <span><a href="{{ route('docs') }}">Documentation</a> · <a href="{{ route('docs', 'publishing') }}">Publish</a> · <a href="{{ route('docs', 'api-rest') }}">API</a> · <a href="{{ url('/sitemap.xml') }}">Sitemap</a></span>
    </div>
</footer>
<script src="{{ asset('js/market.js') }}?v={{ filemtime(public_path('js/market.js')) }}" defer></script>
</body>
</html>
