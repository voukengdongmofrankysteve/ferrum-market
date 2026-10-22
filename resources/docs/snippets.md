# Snippets

A snippet is a short template. The person types a **prefix**, presses Tab, and the template is inserted with places to jump between. A snippet extension needs no code.

## Declare them

```json
"contributes": {
  "snippets": [
    { "language": "Rust", "path": "snippets/rust.json" },
    { "language": "*", "path": "snippets/any.json" }
  ]
}
```

`language` is the language name as the editor shows it in the status bar (`Rust`, `JavaScript`, `TypeScript`, `Python`, `HTML / XML`, `CSS`...), the `name` of a language that an extension adds, or `*` for every language.

## The file

The file uses the same format as VS Code snippets:

```json
{
  "Print a value": {
    "prefix": "pv",
    "body": ["println!(\"{}: {:?}\", \"$1\", $1);"],
    "description": "Print a variable with its name"
  },
  "Test function": {
    "prefix": "tfn",
    "body": [
      "#[test]",
      "fn ${1:name}() {",
      "\t$0",
      "}"
    ],
    "description": "A unit test"
  }
}
```

| Key | Description |
| --- | --- |
| `prefix` | What the person types before Tab. A string, or an array of strings. |
| `body` | The text, as an array of lines (or one string). `\t` becomes the file's indent. |
| `description` | Shown in the **Snippets: Insert Snippet** list. |

### Tab stops

| Syntax | Meaning |
| --- | --- |
| `$1`, `$2`, ... | Places the cursor jumps to with Tab, in order. |
| `${1:default}` | A tab stop with text already in it, selected so typing replaces it. |
| `$0` | Where the cursor ends up at the end. |
| `$1` used twice | The same text is inserted in both places at first. |
| `\$` | A literal dollar sign. |

Variables such as `$TM_FILENAME` are not supported.

## Rules of thumb

- Keep prefixes short but not common words, so they do not fire by accident.
- If your prefix is also a built-in or user snippet prefix, the user's own snippet wins, then yours, then the built-in ones.
- One file per language keeps the package tidy.
