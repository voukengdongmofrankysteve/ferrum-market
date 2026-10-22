# Publishing

## Accounts and publishers

1. **Create an account** on the [Register page](/register) with your name, email and a password of at least 8 characters.
2. On your [account page](/account), **create a publisher**. A publisher is the name your extensions live under. Its id (3 to 40 characters: lower case letters, digits, dashes) becomes the first half of every extension identifier, so `acme` and an extension named `hello` give `acme.hello`. An account can have up to 5 publishers. Ids such as `ferrum`, `vyloxi`, `official` and `admin` are reserved.
3. Optionally create a **token** on the same page for the `ferrum-ext` tool and for the editor.

You do not need an account to **install** extensions, only to publish and to review.

## Publish a package

Package your extension (`ferrum-ext package`), then either:

- upload the `.fext` file on the [Publish page](/publish), or
- run `ferrum-ext publish --token fxt_...`, or
- send the file to the [API](/docs/api-rest) yourself.

The marketplace checks the package. If something is wrong it tells you exactly what, and nothing is published.

## Versions

- Every upload is a **new version**. Its number must be **higher** than the latest published one (`1.0.1` after `1.0.0`, `1.1.0-beta.1` before `1.1.0`).
- A version can never be replaced or deleted once published. Fix a mistake by publishing a higher number.
- The marketplace page shows the README and CHANGELOG of the **latest** version. Older versions stay downloadable.
- People who installed the extension are told in the Extensions view that an update exists, and can update with one click.

## What the page shows

Everything on your page comes from the package:

| Page part | Comes from |
| --- | --- |
| Name, description, category | `displayName`, `description`, `categories[0]` |
| Icon | `icon` (PNG) |
| Overview | `README.md` (Markdown; HTML in it is shown as text; images must use `https://` addresses) |
| Changelog | `CHANGELOG.md` |
| Contributions | `contributes` |
| Permissions | `permissions` |
| Source link | `repository` |

## Rules

An extension may be hidden or removed by the administrators if it:

- does something other than what its description says, or hides what it does
- steals data, runs code downloaded at run time, or collects personal data without saying so
- copies another extension's name or icon to mislead people, or pretends to be from a company it is not
- contains malware, adult content, or content that infringes someone's rights
- breaks the law

The names `ferrum`, `vyloxi` and variants are reserved. You are responsible for the licenses of everything in your package, including themes and icons you did not create.

## Limits

| What | Limit |
| --- | --- |
| Package size once unpacked | 1.5 MB |
| Files in a package | 200 |
| Icon | PNG, 200 KB |
| Description | 280 characters |
| Uploads | 40 per hour per account |

## Managing your extensions

On [Your extensions](/manage) you can **hide** an extension from the marketplace and show it again. Hiding does not uninstall it for people who already have it. To remove an extension permanently, contact the administrators.

## Reviews

Signed-in users can leave one rating (1 to 5 stars) and an optional comment per extension, and can change it later. Reviews are shown on the extension's page. Reply to feedback by publishing a better version.

## Verified publishers

A publisher can get a verified badge from the administrators after they confirm who is behind it. Verified does **not** mean the code was reviewed. See [Permissions and security](/docs/permissions).
