<?php

namespace App\Http\Controllers;

use App\Models\Extension;
use App\Models\Publisher;
use App\Models\Review;
use App\Support\Bundle;
use App\Support\Catalog;
use App\Support\Publishing;
use App\Support\Version;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use InvalidArgumentException;

class PageController extends Controller
{
    public function home()
    {
        return view('pages.home', [
            'top' => Catalog::search('', '', 'installs', 8),
            'new' => Catalog::search('', '', 'new', 8),
            'stats' => Catalog::stats(),
            'categories' => Bundle::CATEGORIES,
        ]);
    }

    public function browse(Request $r)
    {
        $q = (string) $r->query('q', '');
        $cat = (string) $r->query('category', '');
        $sort = (string) $r->query('sort', 'installs');
        $items = Catalog::search($q, $cat, $sort, 20, (int) $r->query('page', 1))->withQueryString();

        return view('pages.browse', ['items' => $items, 'q' => $q, 'cat' => $cat, 'sort' => $sort, 'categories' => Bundle::CATEGORIES, 'sorts' => Catalog::SORTS]);
    }

    public function show(string $publisher, string $name, Request $r)
    {
        $e = Extension::visible()->with('publisher')->whereHas('publisher', fn ($p) => $p->where('slug', $publisher))->where('name', $name)->firstOrFail();
        $latest = $e->latest();
        $reviews = Review::with('user')->where('extension_id', $e->id)->latest()->limit(50)->get();
        $mine = auth()->check() ? Review::where('extension_id', $e->id)->where('user_id', auth()->id())->first() : null;

        return view('pages.extension', [
            'e' => $e,
            'latest' => $latest,
            'manifest' => $latest?->manifest ?? [],
            'versions' => $e->sortedVersions(),
            'reviews' => $reviews,
            'mine' => $mine,
            'tab' => in_array($r->query('tab'), ['overview', 'contributions', 'versions', 'reviews'], true) ? $r->query('tab') : 'overview',
            'readme' => Str::markdown($latest?->readme ?? '', ['html_input' => 'escape', 'allow_unsafe_links' => false]),
            'changelog' => Str::markdown($latest?->changelog ?? '', ['html_input' => 'escape', 'allow_unsafe_links' => false]),
        ]);
    }

    public function review(Request $r, Extension $extension): RedirectResponse
    {
        $data = $r->validate(['stars' => 'required|integer|min:1|max:5', 'body' => 'nullable|string|max:1000']);
        try {
            Publishing::review($extension, $r->user(), (int) $data['stars'], (string) ($data['body'] ?? ''));
        } catch (InvalidArgumentException $x) {
            return back()->with('err', $x->getMessage());
        }

        return redirect()->route('extension', [$extension->publisher->slug, $extension->name, 'tab' => 'reviews'])->with('ok', 'Thank you, your review was saved.');
    }

    public function publisher(string $slug)
    {
        $p = Publisher::where('slug', $slug)->firstOrFail();
        $items = Extension::visible()->with('publisher')->where('publisher_id', $p->id)->orderByDesc('installs')->get();

        return view('pages.publisher', ['p' => $p, 'items' => $items]);
    }

    public function docs(?string $slug = null)
    {
        $pages = config('docs.pages');
        $slug ??= array_key_first($pages);
        abort_unless(isset($pages[$slug]), 404);
        $file = resource_path('docs/'.$slug.'.md');
        $html = Str::markdown(File::get($file), ['html_input' => 'escape', 'allow_unsafe_links' => false]);
        // Headings get an id so the page outline can link to them.
        $toc = [];
        $html = preg_replace_callback('#<h([23])>(.*?)</h\1>#s', function ($m) use (&$toc) {
            $text = trim(strip_tags($m[2]));
            $id = Str::slug($text);
            $toc[] = ['level' => (int) $m[1], 'id' => $id, 'text' => $text];

            return '<h'.$m[1].' id="'.$id.'">'.$m[2].'</h'.$m[1].'>';
        }, $html);

        return view('docs.page', ['pages' => $pages, 'slug' => $slug, 'html' => $html, 'toc' => $toc, 'meta' => $pages[$slug]]);
    }

    public function sitemap()
    {
        $urls = [url('/'), route('browse'), route('docs')];
        foreach (array_keys(config('docs.pages')) as $s) {
            $urls[] = route('docs', $s);
        }
        foreach (Extension::visible()->with('publisher')->latest()->limit(1000)->get() as $e) {
            $urls[] = route('extension', [$e->publisher->slug, $e->name]);
        }
        $xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'.implode('', array_map(fn ($u) => '<url><loc>'.e($u).'</loc></url>', $urls)).'</urlset>';

        return response($xml, 200, ['Content-Type' => 'application/xml']);
    }

    public function robots()
    {
        return response("User-agent: *\nAllow: /\nDisallow: /account\nDisallow: /admin\nSitemap: ".url('/sitemap.xml')."\n", 200, ['Content-Type' => 'text/plain']);
    }
}
