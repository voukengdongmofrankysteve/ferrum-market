@php($url = route('extension', [$e->publisher->slug, $e->name]))
<a class="card" href="{{ $url }}">
    @if ($e->has_icon)
        <img class="icon" src="{{ url('/api/v1/extensions/'.$e->full_id.'/icon') }}" alt="" width="52" height="52" loading="lazy">
    @else
        <span class="icon blank" aria-hidden="true">{{ mb_strtoupper(mb_substr($e->display_name, 0, 1)) }}</span>
    @endif
    <span class="body">
        <strong>{{ $e->display_name }}</strong>
        <em>{{ $e->description }}</em>
        <span class="meta">
            <span>{{ $e->publisher->name }}@if ($e->publisher->verified) <i class="tick" title="Verified publisher">✔</i>@endif</span>
            <span title="Installs">⬇ {{ number_format($e->installs) }}</span>
            @if ($e->rating)<span title="{{ $e->rating_count }} ratings">★ {{ number_format($e->rating, 1) }}</span>@endif
            <span class="tag">{{ $e->category }}</span>
        </span>
    </span>
</a>
