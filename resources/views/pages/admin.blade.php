@extends('layouts.app', ['title' => 'Administration'])

@section('content')
<div class="wrap">
    <h1>Administration</h1>
    <p><a class="btn small" href="{{ route('admin.ai') }}">Built-in AI: settings, spending and people</a></p>
    <h2>Publishers</h2>
    <table><thead><tr><th>Id</th><th>Name</th><th>Owner</th><th>Verified</th><th></th></tr></thead><tbody>
    @foreach ($publishers as $p)
        <tr><td><a href="{{ route('publisher', $p->slug) }}">{{ $p->slug }}</a></td><td>{{ $p->name }}</td><td>{{ $p->user->email }}</td><td>{{ $p->verified ? 'yes' : 'no' }}</td>
            <td><form method="post" action="{{ route('admin.verify', $p) }}">@csrf<button class="btn small ghost" type="submit">{{ $p->verified ? 'Remove badge' : 'Verify' }}</button></form></td></tr>
    @endforeach
    </tbody></table>
    <h2>Extensions</h2>
    <table><thead><tr><th>Extension</th><th>Installs</th><th>State</th><th></th></tr></thead><tbody>
    @foreach ($extensions as $e)
        <tr><td>{{ $e->publisher->slug }}.{{ $e->name }}</td><td>{{ $e->installs }}</td><td>{{ $e->unpublished ? 'hidden' : 'public' }}</td>
            <td><form method="post" action="{{ route('manage.toggle', $e) }}">@csrf<button class="btn small ghost" type="submit">{{ $e->unpublished ? 'Show' : 'Hide' }}</button></form></td></tr>
    @endforeach
    </tbody></table>
</div>
@endsection
