@extends('layouts.app', ['title' => $meta['title'].' - Docs', 'description' => $meta['summary']])

@section('content')
@php
    $groups = [];
    foreach ($pages as $s => $p) { $groups[$p['group']][$s] = $p; }
    $keys = array_keys($pages);
    $i = array_search($slug, $keys, true);
    $prev = $i > 0 ? $keys[$i - 1] : null;
    $next = $i < count($keys) - 1 ? $keys[$i + 1] : null;
@endphp
<div class="wrap docs">
    <nav class="docnav" aria-label="Documentation">
        <button class="navtoggle" type="button" aria-expanded="false">Menu</button>
        <div class="navbody">
        @foreach ($groups as $g => $items)
            <h4>{{ $g }}</h4>
            @foreach ($items as $s => $p)<a href="{{ route('docs', $s) }}" @class(['on' => $s === $slug])>{{ $p['title'] }}</a>@endforeach
        @endforeach
        </div>
    </nav>
    <article class="md doc">
        <p class="crumb">Docs / {{ $meta['group'] }}</p>
        {!! $html !!}
        <div class="pn">
            @if ($prev)<a href="{{ route('docs', $prev) }}">&larr; {{ $pages[$prev]['title'] }}</a>@else <span></span>@endif
            @if ($next)<a href="{{ route('docs', $next) }}">{{ $pages[$next]['title'] }} &rarr;</a>@endif
        </div>
    </article>
    <aside class="toc">
        @if (count($toc))<h4>On this page</h4>@foreach ($toc as $t)<a class="l{{ $t['level'] }}" href="#{{ $t['id'] }}">{{ $t['text'] }}</a>@endforeach @endif
    </aside>
</div>
@endsection
