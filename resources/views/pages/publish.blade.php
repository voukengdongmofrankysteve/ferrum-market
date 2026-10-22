@extends('layouts.app', ['title' => 'Publish an extension'])

@section('content')
<div class="wrap narrow">
    <h1>Publish an extension</h1>
    @if ($publishers->isEmpty())
        <div class="flash info">You need a publisher first. <a href="{{ route('account') }}">Create one on your account page.</a></div>
    @endif
    <ol class="steps">
        <li>Package your extension: <code>ferrum-ext package</code> makes a <code>.fext</code> file. <a href="{{ route('docs', 'cli') }}">How</a></li>
        <li>The <code>publisher</code> in your <code>ferrum.json</code> must be one of yours: @forelse ($publishers as $p)<code>{{ $p->slug }}</code> @empty none yet @endforelse</li>
        <li>Upload the file here, or run <code>ferrum-ext publish</code> with a token.</li>
    </ol>
    <form class="form" method="post" action="{{ route('publish') }}" enctype="multipart/form-data">
        @csrf
        <label>Package (.fext) <input type="file" name="bundle" accept=".fext,application/json" required></label>
        <button class="btn" type="submit">Upload and publish</button>
    </form>
    <p class="hint">Each upload is a new version: its number must be higher than the last one. The README.md in the package becomes the extension page. Read the <a href="{{ route('docs', 'publishing') }}">publishing rules</a>.</p>
</div>
@endsection
