# Languages and highlighting

A language extension tells Ferrum which files belong to a language and how to color them. It needs no code.

## 1. Declare the language

```json
"contributes": {
  "languages": [
    {
      "id": "ini-plus",
      "name": "INI Plus",
      "extensions": [".ini", ".cfg"],
      "filenames": ["setup.cfg"],
      "lineComment": ";",
      "grammar": "grammars/ini.json"
    }
  ]
}
```

Once installed, opening `settings.ini` shows "INI Plus" in the status bar, colors the file with your grammar, and **Toggle Line Comment** uses `;`.

## 2. Write a grammar

A grammar is a JSON file with a list of **rules**. Ferrum reads each line from left to right. At every position it finds the earliest place where one of your rules matches and colors that text; where two rules match at the same place, the one listed first wins. Text no rule matches stays plain.

```json
{
  "ignoreCase": false,
  "rules": [
    { "match": "^\\s*[;#].*$", "token": "comment" },
    { "match": "^\\s*\\[[^\\]]+\\]", "token": "type" },
    { "match": "^\\s*[\\w.-]+(?=\\s*=)", "token": "property" },
    { "match": "\"(?:[^\"\\\\]|\\\\.)*\"", "token": "string" },
    { "match": "\\b(?:true|false|yes|no)\\b", "token": "constant" },
    { "match": "\\b\\d+(?:\\.\\d+)?\\b", "token": "number" }
  ]
}
```

### Single-line rules

```json
{ "match": "<regular expression>", "token": "<token name>" }
```

`match` is a JavaScript regular expression, written as a JSON string (so backslashes are doubled). It is matched against one line at a time. Lookahead (`(?=...)`) and lookbehind (`(?<=...)`) work.

### Multi-line rules

For things that run across lines, such as block comments or triple-quoted strings:

```json
{ "begin": "/\\*", "end": "\\*/", "token": "comment" }
```

Everything from `begin` to `end` is colored, across as many lines as it takes. A `begin` without an `end` runs to the end of the file.

### Token names

| Token | Use it for |
| --- | --- |
| `comment` | comments |
| `string` | strings |
| `number` | numbers |
| `keyword` | keywords, operators |
| `type` | types, classes, section headers |
| `function` | function and method names |
| `constant` | `true`, `null`, named constants |
| `macro` | macros, preprocessor lines |
| `property` | keys, fields, attributes of objects |
| `tag` | markup tags |
| `attribute` | markup attributes |

The theme decides the actual colors, so your language looks right in every theme.

### Options

| Key | Description |
| --- | --- |
| `ignoreCase` | `true` to match without regard to case. |
| `rules` | The list of rules, at most 200. |

Regular expressions that can run for a very long time on a line (for example nested quantifiers) are cut off: Ferrum limits the time spent on each line and leaves the rest plain.

## 3. Add snippets and a theme (optional)

A good language pack also contributes [snippets](/docs/snippets) for the language, using its `name`.

## Activation

To run code only for your language, use `onLanguage:ini-plus`. The language id is the `id` you declared.

## Testing a grammar

1. **Extensions: Install from Folder**, pick your folder.
2. Open a file of your language. Check comments, strings, numbers and edge cases (a string with an escaped quote, a comment at the end of a line).
3. After editing the grammar, run **Extensions: Reload Extensions**; open files are recolored.

## Limits

Grammars are simple and fast on purpose. They have no nesting of languages inside languages (for example CSS inside HTML) and no state apart from `begin`/`end`. For built-in languages, Ferrum's own highlighter and any language server colors still apply.
