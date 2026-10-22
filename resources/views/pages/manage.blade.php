@extends('layouts.app', ['title' => 'Your extensions'])

@section('content')
<div class="wrap">
    <h1>Your extensions</h1>
    @forelse ($items as $e)
        <div class="manage">
            @include('partials.card', ['e' => $e])
            <div class="side">
                <span>{{ $e->unpublished ? 'Hidden' : 'Public' }} · {{ $e->latest()?->version }}</span>
                <form method="post" action="{{ route('manage.toggle', $e) }}">@csrf<button class="btn small ghost" type="submit">{{ $e->unpublished ? 'Show again' : 'Hide' }}</button></form>
            </div>
        </div>
    @empty
        <p class="empty">You have not published anything yet. <a href="{{ route('publish') }}">Publish your first extension.</a></p>
    @endforelse
</div>
@endsection
