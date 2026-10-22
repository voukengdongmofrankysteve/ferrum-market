// Runs every generated grammar through the editor's own tokenizer on a code sample.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';
import { buildGrammar } from '../lib/grammar.mjs';
import { LANGS1 } from '../languages1.mjs';
import { LANGS2 } from '../languages2.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const tmp = join(here, '.tmp');
mkdirSync(tmp, { recursive: true });
const outfile = join(tmp, 'grammar-runtime.mjs');
const esbuild = join(here, '..', '..', 'rustcode', 'node_modules', '.bin', process.platform === 'win32' ? 'esbuild.cmd' : 'esbuild');
execFileSync(esbuild, [join(here, '..', '..', 'rustcode', 'src', 'ext', 'grammar.ts'), '--bundle', '--format=esm', '--outfile=' + outfile, '--log-level=error'], { shell: true });
const { compileGrammar, tokenize } = await import(pathToFileURL(outfile).href);

const KIND = ['', 'comment', 'string', 'number', 'keyword', 'type', 'function', 'constant', 'macro', 'property', 'tag', 'attribute'];
const all = Object.fromEntries([...LANGS1, ...LANGS2].map((l) => [l.id, l]));

function colors(id, code) {
  const g = compileGrammar(buildGrammar(all[id]));
  assert.deepEqual(g.errors, [], id + ' grammar errors');
  const lines = code.split('\n');
  const toks = tokenize(g, lines, 1000);
  const out = [];
  toks.forEach((row, i) => row.forEach((t) => out.push([KIND[t.k], lines[i].slice(t.s, t.e)])));
  return out;
}
const has = (list, kind, text) => assert.ok(list.some(([k, t]) => k === kind && t === text), `expected ${kind} "${text}" in ${JSON.stringify(list.slice(0, 12))}`);

test('every grammar compiles with no errors and tokenizes something', () => {
  for (const l of Object.values(all)) {
    const g = compileGrammar(buildGrammar(l));
    assert.deepEqual(g.errors, [], l.id);
    assert.ok(g.rules.length > 0, l.id);
  }
});

test('kotlin', () => {
  const c = colors('kotlin', 'fun main() {\n  val x: Int = 0x1F // note\n  println("hi \\"there\\"")\n}\n/* a\nb */');
  has(c, 'keyword', 'fun'); has(c, 'keyword', 'val'); has(c, 'type', 'Int'); has(c, 'number', '0x1F'); has(c, 'comment', '// note'); has(c, 'string', '"hi \\"there\\""'); has(c, 'function', 'println');
  assert.ok(c.some(([k, t]) => k === 'comment' && t === '/* a') && c.some(([k, t]) => k === 'comment' && t === 'b */'));
});

test('php', () => {
  const c = colors('php', '<?php\nfunction add(int $a, int $b): int { return $a + $b; } // sum\n$name = "Ada";\necho strlen($name);');
  has(c, 'macro', '<?php'); has(c, 'keyword', 'function'); has(c, 'type', 'int'); has(c, 'property', '$a'); has(c, 'comment', '// sum'); has(c, 'string', '"Ada"'); has(c, 'function', 'strlen');
});

test('ruby', () => {
  const c = colors('ruby', 'class Foo < Base\n  attr_accessor :name\n  def hi(x) = puts "hi #{x}" # c\nend\n@count = 3');
  has(c, 'keyword', 'class'); has(c, 'keyword', 'def'); has(c, 'constant', ':name'); has(c, 'comment', '# c'); has(c, 'property', '@count'); has(c, 'function', 'attr_accessor');
});

test('yaml', () => {
  const c = colors('yaml-plus', 'name: CI # note\non:\n  push:\n    branches: [main]\nenabled: true\n- item: "x"');
  has(c, 'property', 'name'); has(c, 'comment', '# note'); has(c, 'constant', 'true'); has(c, 'string', '"x"');
});

test('dockerfile', () => {
  const c = colors('dockerfile', 'FROM node:22 AS build\nRUN echo "$HOME" # x\nCOPY --from=build /a /b');
  has(c, 'keyword', 'FROM'); has(c, 'keyword', 'RUN'); has(c, 'keyword', 'COPY'); has(c, 'attribute', '--from');
});

test('terraform', () => {
  const c = colors('terraform', 'resource "aws_instance" "web" {\n  count = var.n # c\n  tags = { Name = "x" }\n}');
  has(c, 'keyword', 'resource'); has(c, 'string', '"aws_instance"'); has(c, 'property', 'var.n'); has(c, 'comment', '# c');
});

test('sql dialects ignore case', () => {
  const c = colors('sql-plus', "select id, count(*) from users where name = 'ada' -- hi\nGROUP BY id;");
  has(c, 'keyword', 'select'); has(c, 'keyword', 'from'); has(c, 'keyword', 'GROUP'); has(c, 'string', "'ada'"); has(c, 'comment', '-- hi'); has(c, 'function', 'count');
});

test('diff', () => {
  const c = colors('diff', 'diff --git a/x b/x\n--- a/x\n+++ b/x\n@@ -1,2 +1,2 @@\n-old\n+new');
  has(c, 'type', 'diff --git a/x b/x'); has(c, 'macro', '@@ -1,2 +1,2 @@'); has(c, 'string', '+new'); has(c, 'keyword', '-old');
});

test('log files', () => {
  const c = colors('log', '2026-01-02 03:04:05 ERROR [db] failed at src/app.js:12:3 from 10.0.0.1\nINFO ok https://x.dev/a');
  has(c, 'number', '2026-01-02 03:04:05'); has(c, 'macro', 'ERROR'); has(c, 'type', '[db]'); has(c, 'constant', '10.0.0.1'); has(c, 'string', 'INFO'); has(c, 'string', 'https://x.dev/a');
});

test('blade', () => {
  const c = colors('blade', "@extends('layouts.app')\n{{-- note --}}\n<div class=\"a\">{{ $user->name }}</div>");
  has(c, 'keyword', '@extends'); has(c, 'comment', '{{-- note --}}'); has(c, 'tag', '<div'); has(c, 'property', '$user'); has(c, 'macro', '{{');
});

test('vue and svelte', () => {
  const v = colors('vue', '<template>\n  <button @click="go" :disabled="x">{{ y }}</button>\n</template>');
  has(v, 'tag', '<template'); has(v, 'macro', '@click'); has(v, 'macro', ':disabled'); has(v, 'keyword', '{{');
  const s = colors('svelte', '{#if ok}\n<p on:click={go}>hi</p>\n{/if}');
  has(s, 'keyword', '{#if'); has(s, 'macro', 'on:click');
});

test('powershell and batch', () => {
  const p = colors('powershell', 'Get-ChildItem -Path $env:TEMP | Where-Object { $_ -like "*.log" } # c');
  has(p, 'function', 'Get-ChildItem'); has(p, 'attribute', ' -Path'); has(p, 'comment', '# c'); has(p, 'string', '"*.log"');
  const b = colors('batch', '@echo off\nREM hi\nset X=%PATH%\n:loop\ngoto loop');
  has(b, 'comment', 'REM hi'); has(b, 'property', '%PATH%'); has(b, 'keyword', 'goto');
});

test('latex', () => {
  const c = colors('latex', '\\documentclass{article} % c\n\\begin{document}\n$x^2$ \\textbf{hi}\n\\end{document}');
  has(c, 'function', '\\documentclass'); has(c, 'comment', '% c'); has(c, 'keyword', '\\begin{document}'); has(c, 'string', '$x^2$');
});

test('dotenv, gitfiles and http', () => {
  const e = colors('dotenv', 'APP_KEY=abc123 # c\nexport DEBUG=true');
  has(e, 'property', 'APP_KEY'); has(e, 'comment', '# c');
  const g = colors('gitfiles', '# c\n!keep.txt\n*.log\nbuild/');
  has(g, 'comment', '# c'); has(g, 'keyword', '!'); has(g, 'macro', '*');
  const h = colors('restclient', '### one\nGET {{host}}/x HTTP/1.1\nAccept: json');
  has(h, 'type', '### one'); has(h, 'keyword', 'GET'); has(h, 'macro', '{{host}}'); has(h, 'property', 'Accept');
});

test('zig, solidity, erlang, lua', () => {
  has(colors('zig', 'pub fn main() !void { const x: u32 = 5; } // c'), 'keyword', 'pub');
  has(colors('solidity', 'contract A { function f() public view returns (uint256) {} }'), 'type', 'uint256');
  has(colors('erlang', '-module(m).\nf(X) -> X + 1. % c'), 'comment', '% c');
  const l = colors('lua', 'local function f() end -- c\n--[[ multi\nline ]]\nprint("x")');
  has(l, 'keyword', 'local'); has(l, 'comment', '-- c'); has(l, 'comment', '--[[ multi'); has(l, 'function', 'print');
});

test('an unterminated string does not run into the next line', () => {
  const c = colors('kotlin', 'val a = "oops\nval b = 1');
  assert.ok(!c.some(([k, t]) => k === 'string' && t.includes('\n')));
  has(c, 'keyword', 'val');
  has(c, 'number', '1');
});
