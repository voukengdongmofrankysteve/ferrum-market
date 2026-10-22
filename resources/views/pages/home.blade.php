@extends('layouts.app')

@section('content')
<section class="hero">
    <div class="wrap">
        <h1>Make Ferrum yours.</h1>
        <p class="lead">Themes, languages, snippets and tools for the Ferrum code editor. Install them from the Extensions view inside the editor, or write your own in an afternoon.</p>
        <form class="herosearch" action="{{ route('browse') }}" method="get">
            <input type="search" name="q" placeholder="Search themes, languages, tools..." aria-label="Search extensions" autofocus>
            <button class="btn" type="submit">Search</button>
        </form>
        <div class="chips">
            @foreach ($categories as $c)
                <a href="{{ route('browse', ['category' => $c]) }}">{{ $c }}</a>
            @endforeach
        </div>
        <p class="stats"><b>{{ number_format($stats['extensions']) }}</b> extensions · <b>{{ number_format($stats['installs']) }}</b> installs · <b>{{ number_format($stats['publishers']) }}</b> publishers</p>
    </div>
</section>

<div class="wrap">
    <section class="block">
        <div class="head"><h2>Most installed</h2><a href="{{ route('browse', ['sort' => 'installs']) }}">See all</a></div>
        <div class="grid">
            @forelse ($top as $e) @include('partials.card', ['e' => $e]) @empty
                <p class="empty">No extensions yet. <a href="{{ route('docs', 'getting-started') }}">Be the first to publish one.</a></p>
            @endforelse
        </div>
    </section>

    <section class="block">
        <div class="head"><h2>Recently added</h2><a href="{{ route('browse', ['sort' => 'new']) }}">See all</a></div>
        <div class="grid">
            @foreach ($new as $e) @include('partials.card', ['e' => $e]) @endforeach
        </div>
    </section>

    <section class="block cta">
        <div>
            <h2>Build an extension</h2>
            <p>An extension is a folder with a <code>ferrum.json</code> file. Add a theme, a command or a language, package it with one command, and publish it here for everyone.</p>
        </div>
        <div class="actions">
            <a class="btn" href="{{ route('docs', 'getting-started') }}">Read the guide</a>
            <a class="btn ghost" href="{{ route('docs') }}">Documentation</a>
        </div>
    </section>
</div>
@endsection
