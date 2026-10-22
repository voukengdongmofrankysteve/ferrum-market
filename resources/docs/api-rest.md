# Marketplace API

The editor and the `ferrum-ext` tool talk to the marketplace over a small HTTP API. You can use it too, for example to build a dashboard or a mirror. Everything is JSON. The base address is `https://ferrum.vyloxi.com/api/v1`.

Reading needs no sign-in. Writing needs a **token**: send it as `Authorization: Bearer fxt_...`. Create tokens on your [account page](/account).

Requests are rate limited (240 reads per minute per address, 10 sign-ins per minute, 40 uploads per hour per account). A limited request gets `429`.

## Errors

Failures return an HTTP status and a body such as `{ "error": "Not found." }`. Publishing returns `{ "ok": false, "message": "..." }` with status `422` when the package is refused.

## Extensions

### List and search

`GET /extensions`

| Query | Description |
| --- | --- |
| `q` | Words to look for in the name, description and publisher. |
| `category` | One of the categories. |
| `sort` | `installs` (default), `rating`, `new` or `name`. |
| `page`, `per` | Page number (from 1) and page size (1 to 50, default 20). |

```json
{
  "total": 1,
  "items": [{
    "id": "acme.hello",
    "publisher": "acme",
    "publisherName": "Acme",
    "verified": true,
    "name": "hello",
    "displayName": "Hello",
    "description": "Says hello.",
    "category": "Tools",
    "installs": 120,
    "rating": 4.5,
    "ratingCount": 8,
    "icon": "/api/v1/extensions/acme.hello/icon",
    "repository": "https://github.com/acme/hello",
    "updated": "2026-10-22T10:00:00+00:00"
  }]
}
```

### One extension

`GET /extensions/{publisher}.{name}` returns the same fields plus `version`, `manifest`, `readme`, `changelog`, `versions` (with `version`, `size`, `permissions`, `created`) and `reviews`.

### Download

`GET /extensions/{publisher}.{name}/download?version=1.0.0`

Returns the `.fext` package (JSON). Without `version` you get the latest. The header `X-Ferrum-Version` tells which. One download per address and extension per day counts as an install.

### Icon

`GET /extensions/{publisher}.{name}/icon` returns the PNG.

### Categories

`GET /categories` returns the list of category names.

## Accounts

### Register

`POST /auth/register` with `{ "name": "...", "email": "...", "password": "..." }` (password 8 characters or more). Returns `201` and `{ "token": "fxt_...", "user": { "id", "name", "email" } }`.

### Sign in

`POST /auth/login` with `{ "email": "...", "password": "..." }`. Returns `{ "token", "user" }`. Each call creates a new token; revoke tokens you no longer use on your account page.

### Who am I

`GET /me` (token) returns your `user` and your `publishers`.

## Publishing

### Create a publisher

`POST /publishers` (token) with `{ "slug": "acme", "name": "Acme" }`. Returns `201`.

### Publish a package

`POST /publish` (token). The body is the `.fext` file itself. Returns `201`:

```json
{ "ok": true, "id": "acme.hello", "message": "Hello 0.1.0 is published." }
```

```bash
curl -X POST https://ferrum.vyloxi.com/api/v1/publish \
  -H "Authorization: Bearer $FERRUM_TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @acme.hello-0.1.0.fext
```

### Review

`POST /extensions/{publisher}.{name}/reviews` (token) with `{ "stars": 5, "body": "Great." }`. One review per account and extension; sending again replaces it.

## CORS

The API allows requests from any origin, so a web page can read the catalogue. Tokens belong in your server or tool, never in a public web page.
