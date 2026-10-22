@extends('layouts.app', ['title' => $p->name])

@section('content')
<div class="wrap">
    <header class="pubhead">
        <h1>{{ $p->name }} @if ($p->verified)<i class="tick" title="Verified publisher">✔</i>@endif</h1>
        <p>Publisher id <code>{{ $p->slug }}</code> · {{ $items->count() }} extension{{ $items->count() === 1 ? '' : 's' }}</p>
    </header>
    <div class="list">
        @forelse ($items as $e) @include('partials.card', ['e' => $e]) @empty <p class="empty">Nothing published yet.</p> @endforelse
    </div>
</div>
@endsection
