@extends('layouts.app', ['title' => $e->display_name, 'description' => $e->description])

@section('content')
@php
    $perms = $latest ? $latest->permissionList() : [];
    $c = $manifest['contributes'] ?? [];
    $permText = [
        'workspace.read' => 'Read files in the open folder',
        'workspace.write' => 'Create and change files in the open folder',
        'terminal' => 'Run commands in the terminal',
        'network' => 'Connect to the internet',
        'clipboard' => 'Read and write the clipboard',
    ];
@endphp
<div class="wrap ext">
    <header class="exthead">
        @if ($e->has_icon)
            <img class="icon big" src="{{ url('/api/v1/extensions/'.$e->full_id.'/icon') }}" alt="" width="96" height="96">
        @else
            <span class="icon big blank" aria-hidden="true">{{ mb_strtoupper(mb_substr($e->display_name, 0, 1)) }}</span>
        @endif
        <div class="info">
            <h1>{{ $e->display_name }}</h1>
            <p class="by"><a href="{{ route('publisher', $e->publisher->slug) }}">{{ $e->publisher->name }}</a>@if ($e->publisher->verified) <i class="tick" title="Verified publisher">✔</i>@endif
                · <span>⬇ {{ number_format($e->installs) }} installs</span>
                @if ($e->rating) · <span>★ {{ number_format($e->rating, 1) }} ({{ $e->rating_count }})</span> @endif
                · <span class="tag">{{ $e->category }}</span></p>
            <p class="desc">{{ $e->description }}</p>
            <div class="installbar">
                <code class="copy" data-copy="{{ $e->full_id }}" title="Click to copy">{{ $e->full_id }}</code>
                @if ($latest)<a class="btn" href="{{ url('/api/v1/extensions/'.$e->full_id.'/download') }}" download="{{ $e->full_id }}-{{ $latest->version }}.fext">Download .fext</a>@endif
            </div>
            <p class="hint">In Ferrum open <b>Extensions</b> in the sidebar, search for <b>{{ $e->display_name }}</b> and press <b>Install</b>. Or use <i>Extensions: Install from File</i> with the downloaded file.</p>
        </div>
    </header>

    <div class="tabs" role="tablist">
        @foreach (['overview' => 'Overview', 'contributions' => 'Contributions', 'versions' => 'Versions ('.$versions->count().')', 'reviews' => 'Reviews ('.$e->rating_count.')'] as $k => $label)
            <a role="tab" href="{{ route('extension', [$e->publisher->slug, $e->name, 'tab' => $k]) }}" @class(['on' => $tab === $k])>{{ $label }}</a>
        @endforeach
    </div>

    <div class="extcols">
        <article class="md">
            @if ($tab === 'overview')
                @if (trim($readme) !== '') {!! $readme !!} @else <p class="empty">This extension has no README.</p> @endif
                @if (trim($changelog) !== '') <h2>Changelog</h2> {!! $changelog !!} @endif
            @elseif ($tab === 'contributions')
                <h2>What it adds</h2>
                @if (! $c && empty($manifest['main'])) <p class="empty">Nothing is declared.</p> @endif
                @if (! empty($c['themes']))<h3>Color themes ({{ count($c['themes']) }})</h3><ul>@foreach ($c['themes'] as $t)<li>{{ $t['label'] ?? $t['path'] }}</li>@endforeach</ul>@endif
                @if (! empty($c['iconThemes']))<h3>File icon themes ({{ count($c['iconThemes']) }})</h3><ul>@foreach ($c['iconThemes'] as $t)<li>{{ $t['label'] ?? $t['path'] }}</li>@endforeach</ul>@endif
                @if (! empty($c['languages']))<h3>Languages ({{ count($c['languages']) }})</h3><ul>@foreach ($c['languages'] as $l)<li>{{ $l['name'] ?? $l['id'] }} <small>{{ implode(', ', $l['extensions'] ?? []) }}</small></li>@endforeach</ul>@endif
                @if (! empty($c['snippets']))<h3>Snippets ({{ count($c['snippets']) }} files)</h3>@endif
                @if (! empty($c['commands']))<h3>Commands ({{ count($c['commands']) }})</h3><table><thead><tr><th>Command</th><th>Id</th></tr></thead><tbody>@foreach ($c['commands'] as $cmd)<tr><td>{{ ($cmd['category'] ?? '') ? $cmd['category'].': ' : '' }}{{ $cmd['title'] ?? '' }}</td><td><code>{{ $cmd['command'] ?? '' }}</code></td></tr>@endforeach</tbody></table>@endif
                @if (! empty($c['keybindings']))<h3>Keybindings</h3><table><thead><tr><th>Keys</th><th>Command</th></tr></thead><tbody>@foreach ($c['keybindings'] as $k)<tr><td><kbd>{{ $k['key'] ?? '' }}</kbd></td><td><code>{{ $k['command'] ?? '' }}</code></td></tr>@endforeach</tbody></table>@endif
                @if (! empty($c['configuration']))<h3>Settings</h3><table><thead><tr><th>Setting</th><th>Default</th><th>What it does</th></tr></thead><tbody>@foreach (($c['configuration']['properties'] ?? []) as $name => $p)<tr><td><code>{{ $name }}</code></td><td><code>{{ is_scalar($p['default'] ?? null) ? var_export($p['default'], true) : json_encode($p['default'] ?? null) }}</code></td><td>{{ $p['description'] ?? '' }}</td></tr>@endforeach</tbody></table>@endif
                @if (! empty($manifest['main']))<h3>Code</h3><p>Runs JavaScript from <code>{{ $manifest['main'] }}</code>@if (! empty($manifest['activationEvents'])) when: {{ implode(', ', $manifest['activationEvents']) }}@endif.</p>@endif
            @elseif ($tab === 'versions')
                <h2>Versions</h2>
                <table><thead><tr><th>Version</th><th>Published</th><th>Size</th><th>Permissions</th></tr></thead><tbody>
                @foreach ($versions as $v)
                    <tr><td>{{ $v->version }}</td><td>{{ $v->created_at->diffForHumans() }}</td><td>{{ number_format($v->size / 1024, 1) }} KB</td><td>{{ $v->permissions === '' ? 'none' : str_replace(',', ', ', $v->permissions) }}</td></tr>
                @endforeach
                </tbody></table>
            @else
                <h2>Reviews</h2>
                @auth
                    <form class="reviewform" method="post" action="{{ route('review', $e) }}">
                        @csrf
                        <label>Your rating
                            <select name="stars" required>@foreach ([5,4,3,2,1] as $s)<option value="{{ $s }}" @selected(($mine->stars ?? 5) === $s)>{{ str_repeat('★', $s) }}{{ str_repeat('☆', 5 - $s) }}</option>@endforeach</select>
                        </label>
                        <textarea name="body" rows="3" maxlength="1000" placeholder="Say what you liked or what to improve (optional)">{{ old('body', $mine->body ?? '') }}</textarea>
                        <button class="btn small" type="submit">{{ $mine ? 'Update my review' : 'Post review' }}</button>
                    </form>
                @else
                    <p><a href="{{ route('login') }}">Sign in</a> to rate this extension.</p>
                @endauth
                @forelse ($reviews as $r)
                    <div class="review"><b>{{ $r->user->name }}</b> <span class="stars">{{ str_repeat('★', $r->stars) }}{{ str_repeat('☆', 5 - $r->stars) }}</span> <small>{{ $r->updated_at->diffForHumans() }}</small>@if ($r->body)<p>{{ $r->body }}</p>@endif</div>
                @empty
                    <p class="empty">No reviews yet.</p>
                @endforelse
            @endif
        </article>

        <aside class="details">
            <h3>Details</h3>
            <dl>
                <dt>Identifier</dt><dd><code>{{ $e->full_id }}</code></dd>
                <dt>Version</dt><dd>{{ $latest?->version ?? 'none' }}</dd>
                <dt>Published</dt><dd>{{ $e->created_at->format('j M Y') }}</dd>
                <dt>Last updated</dt><dd>{{ $e->updated_at->diffForHumans() }}</dd>
                <dt>Works with</dt><dd>Ferrum {{ $manifest['engines']['ferrum'] ?? '' }}</dd>
                <dt>Size</dt><dd>{{ $latest ? number_format($latest->size / 1024, 1).' KB' : '' }}</dd>
                @if ($e->repo_url)<dt>Source</dt><dd><a href="{{ $e->repo_url }}" rel="noopener nofollow" target="_blank">{{ \Illuminate\Support\Str::limit(preg_replace('#^https://#', '', $e->repo_url), 34) }}</a></dd>@endif
            </dl>
            <h3>Permissions</h3>
            @if ($perms)<ul class="perms">@foreach ($perms as $p)<li>{{ $permText[$p] ?? $p }}</li>@endforeach</ul>
            @else<p class="ok">Asks for no special permissions.</p>@endif
        </aside>
    </div>
</div>
@endsection
