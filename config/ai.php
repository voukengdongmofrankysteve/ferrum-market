<?php

// The built-in AI plan. Everything here is only a default: the administrator changes it on /admin/ai,
// and the provider key is never read from this repository (it is typed there and stored encrypted).
return [
    'enabled' => env('AI_ENABLED', true),

    // Any OpenAI compatible chat endpoint: OpenRouter, DeepSeek, Groq, Together, a server of your own.
    'upstream_url' => env('AI_UPSTREAM_URL', 'https://openrouter.ai/api/v1'),

    // What people call the models, what they cost per million tokens (US dollars, used when the provider
    // does not report a cost), and who may use them. "upstream" is the provider's own model id.
    'models' => [
        ['id' => 'ferrum-fast', 'label' => 'Ferrum Fast', 'note' => 'Quick and cheap, good for everyday coding.', 'upstream' => 'deepseek/deepseek-chat', 'in' => 0.30, 'out' => 1.20, 'max_output' => 8192, 'plans' => ['free', 'pro']],
        ['id' => 'ferrum-smart', 'label' => 'Ferrum Smart', 'note' => 'Stronger reasoning for hard problems.', 'upstream' => 'deepseek/deepseek-r1', 'in' => 0.55, 'out' => 2.20, 'max_output' => 8192, 'plans' => ['pro']],
    ],

    // Tokens (input plus output) each person may use per day.
    'free_daily_tokens' => 60000,
    'pro_daily_tokens' => 1500000,

    // The most the plan may cost in a calendar month, in US dollars. At the cap the plan pauses for everyone.
    'monthly_cap_usd' => 20,

    // Requests per minute and person, and the biggest request accepted.
    'per_minute' => 20,
    'max_input_chars' => 600000,
];
