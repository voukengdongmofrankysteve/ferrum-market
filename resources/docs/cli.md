# The ferrum-ext tool

`ferrum-ext` is a small command-line tool that creates, checks, packages and publishes extensions. It is one JavaScript file with no dependencies. You need [Node.js](https://nodejs.org) 18 or newer.

## Get it

[Download ferrum-ext.mjs](/downloads/ferrum-ext.mjs). Put it in a folder on your path, or run it as `node ferrum-ext.mjs`. On Linux and macOS you can `chmod +x` it and rename it `ferrum-ext`. The examples write `ferrum-ext`.

```bash
ferrum-ext --help
```

## Commands

### init

```bash
ferrum-ext init my-extension
```

Creates a folder with a starter `ferrum.json`, `extension.js`, `README.md` and `CHANGELOG.md`. Add `--theme`, `--language` or `--snippets` to start from a theme, a language or a snippets pack instead of code.

### check

```bash
ferrum-ext check
```

Reads `ferrum.json` in the current folder and runs the checks the marketplace runs: required fields, name, version and permission rules, that every file the manifest points to exists, that the icon is a PNG, and the size limits. It prints every problem it finds.

### package

```bash
ferrum-ext package
ferrum-ext package --out dist/
```

Runs the checks and writes `publisher.name-version.fext` (in the current folder or `--out`). It prints the files that went in. Files and folders that start with a dot, `node_modules`, `*.fext` and anything matched by `.ferrumignore` are left out.

`.ferrumignore` is a list of patterns, one per line:

```
tests/
*.map
docs/draft.md
```

### publish

```bash
ferrum-ext publish --token fxt_xxxxxxxx
```

Packages the extension and uploads it to the marketplace. The token comes from your [account page](/account); you can also put it in the `FERRUM_TOKEN` environment variable so it never appears in your shell history:

```bash
export FERRUM_TOKEN=fxt_xxxxxxxx
ferrum-ext publish
```

Add `--package file.fext` to publish a file you already built, and `--server https://...` to use another marketplace address (the default is this site).

### login

```bash
ferrum-ext login
```

Asks for the email and password of your marketplace account and creates a token for you, which it saves in `~/.ferrum-ext.json` (readable by you only).

### version

```bash
ferrum-ext version patch   # 1.0.0 -> 1.0.1
ferrum-ext version minor   # 1.0.1 -> 1.1.0
ferrum-ext version major   # 1.1.0 -> 2.0.0
```

Changes `version` in `ferrum.json`.

## Exit codes

`0` on success, `1` when a check fails or the server refuses the package, `2` when the command is wrong. Use it in scripts and in CI.

## A release in CI

```yaml
# .github/workflows/release.yml
on: { push: { tags: ['v*'] } }
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: curl -fsSLO https://ferrum.vyloxi.com/downloads/ferrum-ext.mjs
      - run: node ferrum-ext.mjs publish
        env: { FERRUM_TOKEN: '${{ secrets.FERRUM_TOKEN }}' }
```
