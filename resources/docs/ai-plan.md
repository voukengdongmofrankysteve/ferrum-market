# Ferrum AI (the built-in plan)

Ferrum AI lets you chat with the editor's AI and its agent **without bringing your own key**. You sign in with your Ferrum account, the same one you use for the marketplace, and a daily allowance is included.

## Use it

1. In Ferrum, open the AI chat and press the gear (**AI settings**).
2. At the top, under **Ferrum AI**, sign in or create an account.
3. Pick a model and press **Use Ferrum AI**.

The bar shows how many tokens you have left today. It resets at midnight UTC. A token is roughly three quarters of a word; a long agent task can use many thousands.

| Plan | Models | Allowance |
| --- | --- | --- |
| Free | Ferrum Fast | set by the administrator, about 60,000 tokens a day |
| Pro | Ferrum Fast and Ferrum Smart | about 1,500,000 tokens a day |

When you reach the allowance, or the plan is paused for the month, the chat tells you so. Your own key in the AI settings keeps working at any time, so you are never blocked.

## What is sent where

Your messages go from the editor to `ferrum.vyloxi.com`, which forwards them to the AI provider and streams the answer back. The provider key is kept on the server and never reaches your computer. Ferrum counts tokens per account to enforce the allowance; it does not keep your conversations.

## For the person who runs the server

Open **Administration**, then **Built-in AI**. The page is only for the administrator account (`ADMIN_EMAIL`).

- **Provider address**: any OpenAI compatible endpoint. OpenRouter (`https://openrouter.ai/api/v1`) gives one key for many models; DeepSeek (`https://api.deepseek.com/v1`) is very cheap for code.
- **Provider key**: paste it once. It is stored encrypted with the application key and is never shown again. Do not put it in `deploy.env` or in the repository.
- **Models**: a JSON list. `id` is the name people see, `upstream` is the provider's model name, `in` and `out` are dollars per million tokens (used only when the provider does not report the real cost; OpenRouter does), `plans` says who may use it, `max_output` caps one answer.
- **Monthly cap**: when the month's cost reaches it, the plan pauses for everybody until the 1st. Set the same limit on the provider's side too, as a second safety.
- **Daily tokens** for each plan, and **requests per minute** per account.
- **People**: search an account to move it to Pro, block it, or give it its own daily allowance.

New accounts are limited to a few per address per day, because the free allowance is a reason to make many.

## The API

`GET /api/v1/ai/models` lists the models for the signed-in account and the allowance. `POST /api/v1/ai/chat/completions` is OpenAI compatible (messages, tools, streaming). Send the account token as `Authorization: Bearer fxt_...`. Any tool that speaks the OpenAI API can use it with the base URL `https://ferrum.vyloxi.com/api/v1/ai`.
