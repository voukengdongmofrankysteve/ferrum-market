@extends('layouts.app', ['title' => 'Your account'])

@section('content')
<div class="wrap account">
    <h1>Your account</h1>
    <p class="by">{{ $user->name }} · {{ $user->email }} @if ($user->is_admin)· <a href="{{ route('admin') }}">Administration</a>@endif</p>
    <p class="actions"><a class="btn" href="{{ route('publish') }}">Publish an extension</a> <a class="btn ghost" href="{{ route('manage') }}">Your extensions</a>
        <form class="inline" method="post" action="{{ route('logout') }}">@csrf <button class="btn ghost" type="submit">Sign out</button></form></p>

    <section class="panel">
        <h2>Publishers</h2>
        <p>A publisher is the name your extensions are published under, like <code>vyloxi.hello</code>. You can have up to 5.</p>
        @if ($publishers->isNotEmpty())
            <ul class="plain">@foreach ($publishers as $p)<li><a href="{{ route('publisher', $p->slug) }}"><b>{{ $p->name }}</b></a> <code>{{ $p->slug }}</code> @if ($p->verified)<i class="tick">✔ verified</i>@endif</li>@endforeach</ul>
        @endif
        <form class="form inline-form" method="post" action="{{ route('publishers.store') }}">
            @csrf
            <label>Publisher id <input name="slug" value="{{ old('slug') }}" pattern="[a-z0-9][a-z0-9-]{1,38}[a-z0-9]" placeholder="my-name" required></label>
            <label>Display name <input name="name" value="{{ old('name') }}" maxlength="80" placeholder="My Name"></label>
            <button class="btn small" type="submit">Create publisher</button>
        </form>
    </section>

    <section class="panel">
        <h2>Access tokens</h2>
        <p>The <code>ferrum-ext</code> tool and the editor use a token to publish for you. A token is shown once; keep it secret.</p>
        @if ($newToken)
            <div class="flash ok">Your new token (copy it now, it will not be shown again):<br><code class="copy" data-copy="{{ $newToken }}">{{ $newToken }}</code></div>
        @endif
        @if ($tokens->isNotEmpty())
            <table><thead><tr><th>Label</th><th>Created</th><th>Last used</th><th></th></tr></thead><tbody>
            @foreach ($tokens as $t)
                <tr><td>{{ $t->label }}</td><td>{{ $t->created_at->diffForHumans() }}</td><td>{{ $t->last_used_at?->diffForHumans() ?? 'never' }}</td>
                    <td><form method="post" action="{{ route('tokens.destroy', $t) }}">@csrf @method('DELETE')<button class="btn small ghost" type="submit">Revoke</button></form></td></tr>
            @endforeach
            </tbody></table>
        @endif
        <form class="form inline-form" method="post" action="{{ route('tokens.store') }}">
            @csrf
            <label>Label <input name="label" maxlength="80" placeholder="My laptop" required></label>
            <button class="btn small" type="submit">Create token</button>
        </form>
    </section>

    <section class="panel">
        <h2>Password</h2>
        <form class="form inline-form" method="post" action="{{ route('password') }}">
            @csrf
            <label>Current <input type="password" name="current" required autocomplete="current-password"></label>
            <label>New <input type="password" name="new" required minlength="8" autocomplete="new-password"></label>
            <button class="btn small" type="submit">Change password</button>
        </form>
    </section>
</div>
@endsection
