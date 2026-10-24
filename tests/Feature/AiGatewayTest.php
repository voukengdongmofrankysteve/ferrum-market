<?php

namespace Tests\Feature;

use App\Models\AiSetting;
use App\Models\AiUsage;
use App\Models\ApiToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AiGatewayTest extends TestCase
{
    use RefreshDatabase;

    private function person(array $over = []): array
    {
        $u = User::factory()->create($over);

        return [$u, ApiToken::issue($u, 'test')];
    }

    private function ready(): void
    {
        AiSetting::putSecret('upstream_key', 'sk-provider-secret');
    }

    private function body(array $over = []): array
    {
        return array_merge(['model' => 'ferrum-fast', 'messages' => [['role' => 'user', 'content' => 'hello']]], $over);
    }

    private function upstream(array $usage = ['prompt_tokens' => 10, 'completion_tokens' => 20]): array
    {
        return ['id' => 'x', 'model' => 'deepseek/deepseek-chat', 'choices' => [['message' => ['role' => 'assistant', 'content' => 'Hi there'], 'finish_reason' => 'stop']], 'usage' => $usage];
    }

    public function test_the_models_need_a_sign_in_and_follow_the_plan(): void
    {
        $this->getJson('/api/v1/ai/models')->assertStatus(401);

        [, $free] = $this->person();
        $r = $this->withToken($free)->getJson('/api/v1/ai/models')->assertOk();
        $this->assertSame(['ferrum-fast'], array_column($r->json('models'), 'id'));
        $this->assertSame('free', $r->json('status.plan'));
        $this->assertSame(60000, $r->json('status.remaining_today'));

        [, $pro] = $this->person(['ai_plan' => 'pro']);
        $ids = array_column($this->withToken($pro)->getJson('/api/v1/ai/models')->json('models'), 'id');
        $this->assertContains('ferrum-smart', $ids);
    }

    public function test_nothing_is_sent_before_the_provider_key_is_set(): void
    {
        Http::fake();
        [, $t] = $this->person();
        $this->withToken($t)->postJson('/api/v1/ai/chat/completions', $this->body())->assertStatus(503)->assertJsonPath('code', 'not_configured');
        Http::assertNothingSent();
    }

    public function test_a_reply_comes_back_under_the_ferrum_model_name_and_is_counted(): void
    {
        $this->ready();
        Http::fake(['*' => Http::response($this->upstream(), 200)]);
        [$u, $t] = $this->person();

        $r = $this->withToken($t)->postJson('/api/v1/ai/chat/completions', $this->body(['tools' => [['type' => 'function', 'function' => ['name' => 'x', 'parameters' => ['type' => 'object']]]], 'secret_field' => 'drop me']))->assertOk();
        $this->assertSame('ferrum-fast', $r->json('model'));
        $this->assertSame('Hi there', $r->json('choices.0.message.content'));
        $this->assertStringNotContainsString('sk-provider-secret', $r->getContent());

        Http::assertSent(function (HttpRequest $q) {
            $d = $q->data();

            return str_ends_with($q->url(), '/chat/completions')
                && $q->hasHeader('Authorization', 'Bearer sk-provider-secret')
                && $d['model'] === 'deepseek/deepseek-chat'
                && isset($d['tools']) && ! array_key_exists('secret_field', $d);
        });

        $row = AiUsage::where('user_id', $u->id)->first();
        $this->assertSame(1, $row->requests);
        $this->assertSame(10, (int) $row->input_tokens);
        $this->assertSame(20, (int) $row->output_tokens);
        // 10 tokens in at $0.30 and 20 out at $1.20 per million.
        $this->assertSame(27, (int) $row->cost_micro);
    }

    public function test_the_providers_own_cost_is_used_when_it_reports_one(): void
    {
        $this->ready();
        Http::fake(['*' => Http::response($this->upstream(['prompt_tokens' => 5, 'completion_tokens' => 5, 'cost' => 0.0123]), 200)]);
        [$u, $t] = $this->person();
        $this->withToken($t)->postJson('/api/v1/ai/chat/completions', $this->body())->assertOk();
        $this->assertSame(12300, (int) AiUsage::where('user_id', $u->id)->value('cost_micro'));
    }

    public function test_a_model_outside_the_plan_is_refused(): void
    {
        $this->ready();
        Http::fake();
        [, $t] = $this->person();
        $this->withToken($t)->postJson('/api/v1/ai/chat/completions', $this->body(['model' => 'ferrum-smart']))->assertStatus(403)->assertJsonPath('code', 'model');
        $this->withToken($t)->postJson('/api/v1/ai/chat/completions', $this->body(['model' => 'gpt-4o']))->assertStatus(403);
        Http::assertNothingSent();
    }

    public function test_the_daily_allowance_stops_a_person_and_resets_with_the_day(): void
    {
        $this->ready();
        Http::fake(['*' => Http::response($this->upstream(), 200)]);
        [$u, $t] = $this->person(['ai_daily_tokens' => 100]);
        AiUsage::record($u->id, 'ferrum-fast', 60, 40, 10);

        $this->withToken($t)->postJson('/api/v1/ai/chat/completions', $this->body())->assertStatus(429)->assertJsonPath('code', 'daily_limit');
        Http::assertNothingSent();

        $this->travel(1)->day();
        $this->withToken($t)->postJson('/api/v1/ai/chat/completions', $this->body())->assertOk();
    }

    public function test_the_monthly_cap_pauses_everyone(): void
    {
        $this->ready();
        Http::fake();
        AiSetting::put('monthly_cap_usd', 1);
        [$other] = $this->person();
        AiUsage::record($other->id, 'ferrum-fast', 1, 1, 1_000_000);
        [, $t] = $this->person();

        $this->withToken($t)->postJson('/api/v1/ai/chat/completions', $this->body())->assertStatus(503)->assertJsonPath('code', 'monthly_cap');
        $this->assertTrue($this->withToken($t)->getJson('/api/v1/ai/models')->json('status.paused'));
        Http::assertNothingSent();
    }

    public function test_a_blocked_account_and_a_switched_off_plan_are_refused(): void
    {
        $this->ready();
        Http::fake();
        [, $blocked] = $this->person(['ai_plan' => 'blocked']);
        $this->withToken($blocked)->postJson('/api/v1/ai/chat/completions', $this->body())->assertStatus(403)->assertJsonPath('code', 'blocked');

        AiSetting::put('enabled', false);
        [, $t] = $this->person();
        $this->withToken($t)->postJson('/api/v1/ai/chat/completions', $this->body())->assertStatus(503)->assertJsonPath('code', 'disabled');
    }

    public function test_bad_requests_and_oversized_conversations_never_reach_the_provider(): void
    {
        $this->ready();
        Http::fake();
        [, $t] = $this->person();
        $this->withToken($t)->postJson('/api/v1/ai/chat/completions', ['model' => 'ferrum-fast'])->assertStatus(422);
        AiSetting::put('max_input_chars', 1000);
        $this->withToken($t)->postJson('/api/v1/ai/chat/completions', $this->body(['messages' => [['role' => 'user', 'content' => str_repeat('a', 5000)]]]))->assertStatus(413);
        Http::assertNothingSent();
    }

    public function test_provider_failures_are_reported_without_details(): void
    {
        $this->ready();
        [, $t] = $this->person();
        Http::fake(['*' => Http::response(['error' => ['message' => 'invalid api key sk-provider-secret']], 401)]);
        $r = $this->withToken($t)->postJson('/api/v1/ai/chat/completions', $this->body())->assertStatus(503);
        $this->assertStringNotContainsString('sk-provider', $r->getContent());

        $this->assertSame(0, AiUsage::count());
    }

    public function test_a_provider_crash_is_a_bad_gateway_and_costs_nothing(): void
    {
        $this->ready();
        [, $t] = $this->person();
        Http::fake(['*' => Http::response('boom', 500)]);
        $this->withToken($t)->postJson('/api/v1/ai/chat/completions', $this->body())->assertStatus(502);
        $this->assertSame(0, AiUsage::count());
    }

    public function test_a_streamed_answer_is_passed_on_and_counted(): void
    {
        $this->ready();
        $sse = "data: ".json_encode(['choices' => [['delta' => ['content' => 'Hel']]]])."\n\n"
            ."data: ".json_encode(['choices' => [['delta' => ['content' => 'lo']]]])."\n\n"
            ."data: ".json_encode(['choices' => [], 'usage' => ['prompt_tokens' => 7, 'completion_tokens' => 3]])."\n\n"
            ."data: [DONE]\n\n";
        Http::fake(['*' => Http::response($sse, 200, ['Content-Type' => 'text/event-stream'])]);
        [$u, $t] = $this->person();

        $r = $this->withToken($t)->postJson('/api/v1/ai/chat/completions', $this->body(['stream' => true]));
        $r->assertOk();
        $text = $r->streamedContent();
        $this->assertStringContainsString('"content":"Hel"', $text);
        $this->assertStringContainsString('[DONE]', $text);

        Http::assertSent(fn (HttpRequest $q) => ($q->data()['stream'] ?? false) === true && ($q->data()['stream_options']['include_usage'] ?? false) === true);
        $row = AiUsage::where('user_id', $u->id)->first();
        $this->assertSame([7, 3], [(int) $row->input_tokens, (int) $row->output_tokens]);
    }

    public function test_only_the_administrator_reaches_the_settings_and_the_key_is_stored_encrypted(): void
    {
        $normal = User::factory()->create();
        $this->actingAs($normal)->get('/admin/ai')->assertStatus(403);
        $this->actingAs($normal)->post('/admin/ai', [])->assertStatus(403);

        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $this->actingAs($admin)->get('/admin/ai')->assertOk()->assertSee('Built-in AI');

        $models = json_encode([['id' => 'ferrum-fast', 'label' => 'Fast', 'upstream' => 'deepseek-chat', 'in' => 0.3, 'out' => 1.2, 'plans' => ['free', 'pro']]]);
        $form = ['enabled' => 1, 'upstream_url' => 'https://api.deepseek.com/v1', 'upstream_key' => 'sk-new-key', 'models' => $models, 'free_daily_tokens' => 1000, 'pro_daily_tokens' => 5000, 'monthly_cap_usd' => 5, 'per_minute' => 10];
        $this->actingAs($admin)->post('/admin/ai', $form)->assertRedirect();

        $this->assertSame('sk-new-key', AiSetting::readSecret('upstream_key'));
        $this->assertStringNotContainsString('sk-new-key', (string) AiSetting::find('upstream_key')->value);
        $this->assertSame(1000, AiSetting::read('free_daily_tokens'));
        $this->actingAs($admin)->get('/admin/ai')->assertDontSee('sk-new-key');

        // An empty key field keeps the saved one; a broken model list is refused.
        $this->actingAs($admin)->post('/admin/ai', array_merge($form, ['upstream_key' => '']))->assertRedirect();
        $this->assertSame('sk-new-key', AiSetting::readSecret('upstream_key'));
        $this->actingAs($admin)->post('/admin/ai', array_merge($form, ['models' => '[{"id":"BAD ID","upstream":"x"}]']))->assertSessionHas('err');
    }

    public function test_the_administrator_can_change_one_persons_plan(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['is_admin' => true])->save();
        $p = User::factory()->create();
        $this->actingAs($admin)->post('/admin/ai/people/'.$p->id, ['ai_plan' => 'pro', 'ai_daily_tokens' => 7777])->assertRedirect();
        $p->refresh();
        $this->assertSame('pro', $p->ai_plan);
        $this->assertSame(7777, (int) $p->ai_daily_tokens);
    }
}
