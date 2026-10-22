# Extension manifest

Every extension has a `ferrum.json` file at its root. This page lists every field. The marketplace refuses a package whose manifest breaks these rules, and says which rule.

## Example

```json
{
  "name": "toml-plus",
  "publisher": "acme",
  "version": "1.4.2",
  "displayName": "TOML Plus",
  "description": "Better TOML: colors, snippets and a formatter command.",
  "engines": { "ferrum": "^0.1.0" },
  "categories": ["Languages"],
  "icon": "icon.png",
  "repository": "https://github.com/acme/toml-plus",
  "license": "MIT",
  "main": "extension.js",
  "activationEvents": ["onLanguage:toml-plus"],
  "permissions": ["workspace.read"],
  "contributes": { "commands": [], "languages": [] }
}
```

## Fields

| Field | Required | Description |
| --- | --- | --- |
| `name` | yes | The extension's id inside its publisher: 2 to 49 characters, lower case letters, digits and dashes. |
| `publisher` | yes | The id of a publisher you own: 3 to 40 characters, lower case letters, digits and dashes. `publisher.name` is the full identifier. |
| `version` | yes | A version like `1.2.3`, or with a prerelease like `1.2.3-beta.1`. Each published version must be higher than the previous one. |
| `displayName` | yes | The name people see. 80 characters at most. |
| `description` | yes | One or two sentences for the listing. 280 characters at most. |
| `engines.ferrum` | yes | The Ferrum versions it works with, such as `^0.1.0` (that version or any newer 0.x), `>=0.2.0` or `0.1.0`. |
| `categories` | no | The first one is used for filtering: Themes, Languages, Snippets, Formatters, Linters, Git, AI, Tools, Productivity, Other. Default: Other. |
| `icon` | no | Path to a PNG in the package, 200 KB at most. 128x128 or 256x256 looks best. |
| `repository` | no | An `https://` address of the source code. Shown as a link. |
| `license` | no | A license name such as `MIT`. Shown on the page. |
| `main` | no | The JavaScript file to run. Without it the extension has no code. |
| `activationEvents` | no | When to start `main`. See [Activation events](/docs/activation-events). Default with `main`: `onStartup`. |
| `permissions` | no | What the code may do. See [Permissions](/docs/permissions). Default: none. |
| `contributes` | no | What the extension adds. See [Contribution points](/docs/contribution-points). |

## Version ranges

`engines.ferrum` accepts:

- `^0.1.0`: version 0.1.0 or newer, below 1.0.0
- `~0.1.0`: 0.1.0 or newer, below 0.2.0
- `>=0.1.0`: 0.1.0 or newer
- `0.1.0`: exactly that version

Ferrum refuses to install an extension that does not match its own version, and tells the person why.

## Naming advice

- Pick a clear `displayName` and put the main keyword in it ("Rust Snippets", not "RS Pack").
- Start the `description` with what the extension does.
- Choose command ids that start with your extension's name (`toml-plus.format`) so they never clash with another extension's.
