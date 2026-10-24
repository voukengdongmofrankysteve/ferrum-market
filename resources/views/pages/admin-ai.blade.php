@extends('layouts.app', ['title' => 'Built-in AI'])

@section('content')
<div class="wrap">
    <h1>Built-in AI</h1>
    <p><a href="{{ route('admin') }}">Back to administration</a></p>

    <h2>This month</h2>
    <table><tbody>
        <tr><td>Spent so far</td><td><b>${{ number_format($monthCost, 2) }}</b> of the ${{ number_format($cap, 2) }} cap @if ($cap > 0)({{ round(100 * $monthCost / $cap) }}%)@endif</td></tr>
        <tr><td>Today</td><td>{{ number_format($todayTokens) }} tokens by {{ $todayPeople }} {{ $todayPeople === 1 ? 'person' : 'people' }}</td></tr>
        <tr><td>State</td><td>{{ !$enabled ? 'Switched off' : (!$hasKey ? 'Waiting for a provider key' : ($monthCost >= $cap ? 'Paused: the monthly cap is reached' : 'Running')) }}</td></tr>
    </tbody></table>

    @if ($byModel->count())
    <h2>By model</h2>
    <table><thead><tr><th>Model</th><th>Requests</th><th>Tokens in</th><th>Tokens out</th><th>Cost</th></tr></thead><tbody>
    @foreach ($byModel as $m)
        <tr><td>{{ $m->model }}</td><td>{{ number_format($m->req) }}</td><td>{{ number_format($m->tin) }}</td><td>{{ number_format($m->tout) }}</td><td>${{ number_format($m->cost / 1000000, 4) }}</td></tr>
    @endforeach
    </tbody></table>
    @endif

    @if ($top->count())
    <h2>Heaviest users this month</h2>
    <table><thead><tr><th>Person</th><th>Requests</th><th>Tokens</th><th>Cost</th></tr></thead><tbody>
    @foreach ($top as $t)
        <tr><td>{{ $t->user?->email }}</td><td>{{ number_format($t->req) }}</td><td>{{ number_format($t->tokens) }}</td><td>${{ number_format($t->cost / 1000000, 4) }}</td></tr>
    @endforeach
    </tbody></table>
    @endif

    <h2>Settings</h2>
    <form method="post" action="{{ route('admin.ai.save') }}" class="stack">
        @csrf
        <label><input type="checkbox" name="enabled" value="1" @checked(old('enabled', $enabled))> The built-in AI is on</label>
        <label>Provider address (OpenAI compatible)
            <input name="upstream_url" value="{{ old('upstream_url', $url) }}" required>
            <small>OpenRouter: https://openrouter.ai/api/v1 &middot; DeepSeek: https://api.deepseek.com/v1</small>
        </label>
        <label>Provider key {!! $hasKey ? '<small>(one is saved; leave empty to keep it)</small>' : '<small>(none yet)</small>' !!}
            <input type="password" name="upstream_key" autocomplete="off" placeholder="{{ $hasKey ? '••••••••••••' : 'sk-...' }}">
            <small>Stored encrypted on this server. It is never sent to the editor.</small>
        </label>
        @if ($hasKey)<label><input type="checkbox" name="remove_key" value="1"> Remove the saved key</label>@endif
        <label>Models (JSON)
            <textarea name="models" rows="14" spellcheck="false" required>{{ old('models', $modelsJson) }}</textarea>
            <small>"id" is what people see, "upstream" is the provider's model name, "in" and "out" are dollars per million tokens (used when the provider does not report a cost), "plans" lists who may use it.</small>
        </label>
        <div class="row">
            <label>Free tokens per day <input type="number" name="free_daily_tokens" min="0" value="{{ old('free_daily_tokens', $free) }}" required></label>
            <label>Pro tokens per day <input type="number" name="pro_daily_tokens" min="0" value="{{ old('pro_daily_tokens', $pro) }}" required></label>
            <label>Monthly cap, US dollars <input type="number" name="monthly_cap_usd" min="0" step="0.01" value="{{ old('monthly_cap_usd', $cap) }}" required></label>
            <label>Requests per minute <input type="number" name="per_minute" min="1" value="{{ old('per_minute', $perMinute) }}" required></label>
        </div>
        <button class="btn" type="submit">Save</button>
    </form>

    <h2>People</h2>
    <form method="get" action="{{ route('admin.ai') }}"><input type="search" name="q" value="{{ $q }}" placeholder="Find a person by email or name"> <button class="btn small ghost" type="submit">Search</button></form>
    @if ($people->count())
    <table><thead><tr><th>Person</th><th>Plan</th><th>Tokens per day (empty = plan default)</th><th></th></tr></thead><tbody>
    @foreach ($people as $p)
        <tr>
            <td>{{ $p->email }}</td>
            <td><select name="ai_plan" form="p{{ $p->id }}">@foreach (['free', 'pro', 'blocked'] as $pl)<option value="{{ $pl }}" @selected($p->ai_plan === $pl)>{{ $pl }}</option>@endforeach</select></td>
            <td><input type="number" name="ai_daily_tokens" min="0" value="{{ $p->ai_daily_tokens }}" form="p{{ $p->id }}"></td>
            <td><form id="p{{ $p->id }}" method="post" action="{{ route('admin.ai.person', $p) }}">@csrf<button class="btn small" type="submit">Save</button></form></td>
        </tr>
    @endforeach
    </tbody></table>
    @elseif ($q !== '')
        <p>Nobody matches.</p>
    @endif
</div>
@endsection
