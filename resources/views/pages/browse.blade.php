@extends('layouts.app', ['title' => 'Extensions'])

@section('content')
<div class="wrap browse">
    <aside>
        <h3>Categories</h3>
        <a href="{{ route('browse', ['q' => $q, 'sort' => $sort]) }}" @class(['on' => $cat === ''])>All</a>
        @foreach ($categories as $c)
            <a href="{{ route('browse', ['q' => $q, 'sort' => $sort, 'category' => $c]) }}" @class(['on' => $cat === $c])>{{ $c }}</a>
        @endforeach
    </aside>
    <section>
        <form class="filters" method="get" action="{{ route('browse') }}">
            <input type="search" name="q" value="{{ $q }}" placeholder="Search extensions" aria-label="Search">
            @if ($cat !== '')<input type="hidden" name="category" value="{{ $cat }}">@endif
            <select name="sort" aria-label="Sort by" onchange="this.form.submit()">
                @foreach ($sorts as $k => $label)<option value="{{ $k }}" @selected($sort === $k)>{{ $label }}</option>@endforeach
            </select>
            <button class="btn small" type="submit">Search</button>
        </form>
        <p class="count">{{ number_format($items->total()) }} extension{{ $items->total() === 1 ? '' : 's' }}@if ($q !== '') for "{{ $q }}"@endif @if ($cat !== '') in {{ $cat }}@endif</p>
        <div class="list">
            @forelse ($items as $e) @include('partials.card', ['e' => $e]) @empty
                <p class="empty">Nothing matches. Try another word or <a href="{{ route('browse') }}">clear the filters</a>.</p>
            @endforelse
        </div>
        {{ $items->links('partials.pager') }}
    </section>
</div>
@endsection
