<?php

namespace App\Http\Controllers;

use App\Models\AiSetting;
use App\Models\AiUsage;
use App\Models\User;
use App\Support\AiGateway;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** The administrator's page for the built-in AI plan: provider, models, limits, spending and people. */
class AdminAiController extends Controller
{
    private function admin(Request $r): void
    {
        abort_unless($r->user()?->is_admin, 403);
    }

    public function show(Request $r)
    {
        $this->admin($r);
        $month = now()->startOfMonth()->toDateString();
        $today = now()->toDateString();
        $q = trim((string) $r->query('q', ''));

        $top = AiUsage::query()->where('day', '>=', $month)
            ->select('user_id', DB::raw('SUM(requests) as req'), DB::raw('SUM(input_tokens + output_tokens) as tokens'), DB::raw('SUM(cost_micro) as cost'))
            ->groupBy('user_id')->orderByDesc('cost')->limit(15)->with('user')->get();

        $people = $q === '' ? collect() : User::where('email', 'like', '%'.$q.'%')->orWhere('name', 'like', '%'.$q.'%')->limit(20)->get();

        return view('pages.admin-ai', [
            'enabled' => AiGateway::enabled(),
            'url' => AiGateway::upstreamUrl(),
            'hasKey' => (bool) AiGateway::upstreamKey(),
            'modelsJson' => json_encode(AiGateway::models(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
            'free' => (int) AiSetting::read('free_daily_tokens', config('ai.free_daily_tokens')),
            'pro' => (int) AiSetting::read('pro_daily_tokens', config('ai.pro_daily_tokens')),
            'cap' => (float) AiSetting::read('monthly_cap_usd', config('ai.monthly_cap_usd')),
            'perMinute' => AiGateway::perMinute(),
            'monthCost' => AiUsage::monthCostMicro() / 1_000_000,
            'todayTokens' => (int) AiUsage::where('day', $today)->sum(DB::raw('input_tokens + output_tokens')),
            'todayPeople' => (int) AiUsage::where('day', $today)->distinct('user_id')->count('user_id'),
            'byModel' => AiUsage::where('day', '>=', $month)->select('model', DB::raw('SUM(requests) as req'), DB::raw('SUM(input_tokens) as tin'), DB::raw('SUM(output_tokens) as tout'), DB::raw('SUM(cost_micro) as cost'))->groupBy('model')->get(),
            'top' => $top,
            'people' => $people,
            'q' => $q,
        ]);
    }

    public function save(Request $r): RedirectResponse
    {
        $this->admin($r);
        $d = $r->validate([
            'upstream_url' => 'required|url:https,http|max:200',
            'upstream_key' => 'nullable|string|max:300',
            'models' => 'required|string|max:20000',
            'free_daily_tokens' => 'required|integer|min:0|max:100000000',
            'pro_daily_tokens' => 'required|integer|min:0|max:1000000000',
            'monthly_cap_usd' => 'required|numeric|min:0|max:1000000',
            'per_minute' => 'required|integer|min:1|max:600',
        ]);
        $models = json_decode($d['models'], true);
        if (! is_array($models) || $models === []) {
            return back()->withInput()->with('err', 'The models must be a JSON list with at least one model.');
        }
        foreach ($models as $m) {
            if (! is_array($m) || empty($m['id']) || empty($m['upstream']) || ! preg_match('/^[a-z0-9][a-z0-9._-]{0,40}$/', (string) $m['id'])) {
                return back()->withInput()->with('err', 'Each model needs an "id" (letters, digits, dots, dashes) and an "upstream" model name.');
            }
        }

        AiSetting::put('enabled', $r->boolean('enabled'));
        AiSetting::put('upstream_url', rtrim($d['upstream_url'], '/'));
        if ($r->boolean('remove_key')) {
            AiSetting::forget('upstream_key');
        } elseif (! empty($d['upstream_key'])) {
            AiSetting::putSecret('upstream_key', trim($d['upstream_key']));
        }
        AiSetting::put('models', $models);
        AiSetting::put('free_daily_tokens', (int) $d['free_daily_tokens']);
        AiSetting::put('pro_daily_tokens', (int) $d['pro_daily_tokens']);
        AiSetting::put('monthly_cap_usd', (float) $d['monthly_cap_usd']);
        AiSetting::put('per_minute', (int) $d['per_minute']);

        return back()->with('ok', 'Saved.');
    }

    public function person(Request $r, User $user): RedirectResponse
    {
        $this->admin($r);
        $d = $r->validate(['ai_plan' => 'required|in:free,pro,blocked', 'ai_daily_tokens' => 'nullable|integer|min:0|max:1000000000']);
        $user->forceFill(['ai_plan' => $d['ai_plan'], 'ai_daily_tokens' => $d['ai_daily_tokens'] ?? null])->save();

        return back()->with('ok', 'Updated '.$user->email.'.');
    }
}
