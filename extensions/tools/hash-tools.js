// Hash Tools: SHA-1, SHA-256, SHA-384, SHA-512, HMAC and a pure JavaScript MD5 for the selection.

const hex = (buf) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');

async function digest(algo, text) {
  const data = new TextEncoder().encode(text);
  if (algo === 'MD5') return md5(data);
  if (typeof crypto === 'undefined' || !crypto.subtle) throw new Error('This editor build does not provide crypto.subtle.');
  return hex(await crypto.subtle.digest(algo, data));
}

async function hmac(algo, key, text) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: algo }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(text)));
}

// MD5 (RFC 1321). crypto.subtle has no MD5, and checksums of old files still use it.
function md5(bytes) {
  const K = new Uint32Array(64);
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0;
  const S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
  const len = bytes.length;
  const padded = new Uint8Array((((len + 8) >> 6) + 1) << 6);
  padded.set(bytes);
  padded[len] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 8, (len * 8) >>> 0, true);
  dv.setUint32(padded.length - 4, Math.floor((len * 8) / 4294967296), true);
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  for (let off = 0; off < padded.length; off += 64) {
    const M = new Uint32Array(16);
    for (let i = 0; i < 16; i++) M[i] = dv.getUint32(off + i * 4, true);
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F, g;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      F = (F + A + K[i] + M[g]) >>> 0;
      A = D; D = C; C = B;
      B = (B + ((F << S[i]) | (F >>> (32 - S[i])))) >>> 0;
    }
    a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
  }
  const out = new DataView(new ArrayBuffer(16));
  [a0, b0, c0, d0].forEach((v, i) => out.setUint32(i * 4, v, true));
  return hex(out.buffer);
}

exports._test = { digest, hmac, md5 };

exports.activate = function (context) {
  const reg = (id, fn) => context.subscriptions.push(ferrum.commands.register(id, fn));

  async function selectionOrFile() {
    const doc = await ferrum.editor.active();
    if (!doc) {
      ferrum.window.showMessage('Open a file first.', 'warn');
      return null;
    }
    return doc.selectedText || doc.text;
  }

  for (const [id, algo] of [['hashTools.md5', 'MD5'], ['hashTools.sha1', 'SHA-1'], ['hashTools.sha256', 'SHA-256'], ['hashTools.sha384', 'SHA-384'], ['hashTools.sha512', 'SHA-512']]) {
    reg(id, async () => {
      const text = await selectionOrFile();
      if (text === null) return;
      try {
        const h = await digest(algo, text);
        const pick = await ferrum.window.showQuickPick([{ label: 'Insert the hash', detail: h, act: 'insert' }, { label: 'Show the hash in a message', detail: h, act: 'show' }], { placeholder: algo + ' of ' + text.length + ' characters' });
        if (!pick) return;
        if (pick.act === 'insert') await ferrum.editor.insert(h);
        else ferrum.window.showMessage(algo + ': ' + h);
      } catch (e) {
        ferrum.window.showMessage(e.message, 'error');
      }
    });
  }

  reg('hashTools.hmacSha256', async () => {
    const text = await selectionOrFile();
    if (text === null) return;
    const key = await ferrum.window.showInputBox({ prompt: 'Secret key for the HMAC-SHA256' });
    if (key === undefined) return;
    try {
      await ferrum.editor.insert(await hmac('SHA-256', key, text));
    } catch (e) {
      ferrum.window.showMessage(e.message, 'error');
    }
  });

  reg('hashTools.all', async () => {
    const text = await selectionOrFile();
    if (text === null) return;
    try {
      const rows = [];
      for (const a of ['MD5', 'SHA-1', 'SHA-256', 'SHA-512']) rows.push({ label: a, detail: await digest(a, text) });
      await ferrum.window.showQuickPick(rows, { placeholder: 'Hashes of ' + text.length + ' characters' });
    } catch (e) {
      ferrum.window.showMessage(e.message, 'error');
    }
  });
};

exports.deactivate = function () {};
