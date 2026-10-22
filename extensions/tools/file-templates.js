// File Templates: create a new file from a template, and add a LICENSE, README or .gitignore to your project.

const year = () => new Date().getFullYear();

const LICENSES = {
  MIT: (a) => `MIT License\n\nCopyright (c) ${year()} ${a}\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.\n`,
  ISC: (a) => `ISC License\n\nCopyright (c) ${year()} ${a}\n\nPermission to use, copy, modify, and/or distribute this software for any\npurpose with or without fee is hereby granted, provided that the above\ncopyright notice and this permission notice appear in all copies.\n\nTHE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH\nREGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY\nAND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,\nINDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM\nLOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR\nOTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR\nPERFORMANCE OF THIS SOFTWARE.\n`,
  'BSD-2-Clause': (a) => `BSD 2-Clause License\n\nCopyright (c) ${year()}, ${a}\nAll rights reserved.\n\nRedistribution and use in source and binary forms, with or without\nmodification, are permitted provided that the following conditions are met:\n\n1. Redistributions of source code must retain the above copyright notice, this\n   list of conditions and the following disclaimer.\n\n2. Redistributions in binary form must reproduce the above copyright notice,\n   this list of conditions and the following disclaimer in the documentation\n   and/or other materials provided with the distribution.\n\nTHIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"\nAND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE\nIMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE\nDISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE\nFOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL\nDAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR\nSERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER\nCAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,\nOR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE\nOF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\n`,
  Unlicense: () => `This is free and unencumbered software released into the public domain.\n\nAnyone is free to copy, modify, publish, use, compile, sell, or distribute this\nsoftware, either in source code form or as a compiled binary, for any purpose,\ncommercial or non-commercial, and by any means.\n\nIn jurisdictions that recognize copyright laws, the author or authors of this\nsoftware dedicate any and all copyright interest in the software to the public\ndomain. We make this dedication for the benefit of the public at large and to\nthe detriment of our heirs and successors. We intend this dedication to be an\novert act of relinquishment in perpetuity of all present and future rights to\nthis software under copyright law.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN\nACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION\nWITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n\nFor more information, please refer to <https://unlicense.org>\n`,
};

const TEMPLATES = {
  'HTML page': { name: 'index.html', body: (n) => `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>${n}</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>${n}</h1>\n  <script src="app.js" defer></script>\n</body>\n</html>\n` },
  'CSS reset': { name: 'style.css', body: () => `*, *::before, *::after { box-sizing: border-box; }\nbody { margin: 0; font-family: system-ui, sans-serif; line-height: 1.5; }\nimg { max-width: 100%; display: block; }\n` },
  'JavaScript module': { name: 'index.js', body: () => `export function main() {\n  console.log('hello');\n}\n\nmain();\n` },
  'TypeScript module': { name: 'index.ts', body: () => `export function main(): void {\n  console.log('hello');\n}\n\nmain();\n` },
  'Python script': { name: 'main.py', body: () => `def main() -> None:\n    print("hello")\n\n\nif __name__ == "__main__":\n    main()\n` },
  'Rust binary (main.rs)': { name: 'src/main.rs', body: () => `fn main() {\n    println!("hello");\n}\n` },
  'Go program': { name: 'main.go', body: () => `package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("hello")\n}\n` },
  'Bash script': { name: 'script.sh', body: () => `#!/usr/bin/env bash\nset -euo pipefail\n\necho "hello"\n` },
  'Dockerfile (Node)': { name: 'Dockerfile', body: () => `FROM node:22-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --omit=dev\nCOPY . .\nEXPOSE 3000\nCMD ["node", "index.js"]\n` },
  'Docker Compose': { name: 'docker-compose.yml', body: (n) => `services:\n  app:\n    build: .\n    ports:\n      - "3000:3000"\n    restart: unless-stopped\n    container_name: ${n.toLowerCase().replace(/[^a-z0-9]+/g, '-')}\n` },
  'GitHub Actions workflow': { name: '.github/workflows/ci.yml', body: () => `name: CI\non:\n  push:\n    branches: [main]\n  pull_request:\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: echo "add your build and test steps"\n` },
  '.gitignore (general)': { name: '.gitignore', body: () => `.DS_Store\nThumbs.db\n.env\n.env.local\n*.log\nnode_modules/\ndist/\nbuild/\ntarget/\n__pycache__/\n.venv/\n.idea/\n.vscode/\n` },
  '.editorconfig': { name: '.editorconfig', body: () => `root = true\n\n[*]\nindent_style = space\nindent_size = 2\nend_of_line = lf\ncharset = utf-8\ntrim_trailing_whitespace = true\ninsert_final_newline = true\n` },
  'README': { name: 'README.md', body: (n) => `# ${n}\n\nOne line about what this is.\n\n## Install\n\n\`\`\`\n\n\`\`\`\n\n## Usage\n\n\n## License\n\nMIT\n` },
  'CHANGELOG': { name: 'CHANGELOG.md', body: () => `# Changelog\n\n## Unreleased\n\n- \n` },
  'CONTRIBUTING': { name: 'CONTRIBUTING.md', body: (n) => `# Contributing to ${n}\n\nThanks for helping. Open an issue first for big changes.\n\n1. Fork and create a branch.\n2. Make your change with tests.\n3. Open a pull request that says what and why.\n` },
  'package.json': { name: 'package.json', body: (n) => `{\n  "name": "${n.toLowerCase().replace(/[^a-z0-9-]+/g, '-')}",\n  "version": "0.1.0",\n  "private": true,\n  "type": "module",\n  "scripts": {\n    "start": "node index.js"\n  }\n}\n` },
  'JSON file': { name: 'data.json', body: () => `{\n  \n}\n` },
  'Markdown note': { name: 'notes.md', body: () => `# Notes\n\n- \n` },
  'Makefile': { name: 'Makefile', body: () => `.PHONY: all build test clean\n\nall: build\n\nbuild:\n\t@echo "build"\n\ntest:\n\t@echo "test"\n\nclean:\n\t@echo "clean"\n` },
};

const safeRel = (p) => {
  const s = String(p).trim().replace(/\\/g, '/');
  if (!s || s.startsWith('/') || /^[A-Za-z]:/.test(s) || s.split('/').includes('..')) throw new Error('Use a path inside the project, like src/app.js');
  return s;
};

exports._test = { LICENSES, TEMPLATES, safeRel };

exports.activate = function (context) {
  const reg = (id, fn) => context.subscriptions.push(ferrum.commands.register(id, fn));
  const root = () => {
    if (!ferrum.workspace.root) throw new Error('Open a folder first.');
    return ferrum.workspace.root.replace(/[\\/]+$/, '');
  };
  const join = (rel) => root() + '/' + rel;
  const project = () => root().split(/[\\/]/).pop();

  async function create(rel, text) {
    const existing = await ferrum.workspace.listFiles(rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) + '/*' : '*');
    if (existing.includes(rel) && !(await ferrum.window.confirm(rel + ' already exists. Replace it?', 'Replace'))) return false;
    await ferrum.workspace.writeFile(join(rel), text);
    await ferrum.editor.openFile(join(rel));
    return true;
  }

  reg('fileTemplates.newFile', async () => {
    try {
      root();
      const pick = await ferrum.window.showQuickPick(Object.entries(TEMPLATES).map(([label, t]) => ({ label, detail: t.name })), { placeholder: 'New file from a template' });
      if (!pick) return;
      const rel = await ferrum.window.showInputBox({ prompt: 'Where should it go (relative to the project)?', value: TEMPLATES[pick.label].name });
      if (!rel) return;
      await create(safeRel(rel), TEMPLATES[pick.label].body(project()));
    } catch (e) {
      ferrum.window.showMessage(e.message, 'warn');
    }
  });

  reg('fileTemplates.addLicense', async () => {
    try {
      root();
      const pick = await ferrum.window.showQuickPick(Object.keys(LICENSES).map((l) => ({ label: l })), { placeholder: 'Which license?' });
      if (!pick) return;
      const author = (await ferrum.window.showInputBox({ prompt: 'Name of the copyright holder', value: ferrum.settings.get('fileTemplates.author') || '' })) || '';
      if (!author && pick.label !== 'Unlicense') return;
      await create('LICENSE', LICENSES[pick.label](author));
    } catch (e) {
      ferrum.window.showMessage(e.message, 'warn');
    }
  });

  for (const [id, label] of [['fileTemplates.addReadme', 'README'], ['fileTemplates.addGitignore', '.gitignore (general)'], ['fileTemplates.addEditorconfig', '.editorconfig'], ['fileTemplates.addGithubAction', 'GitHub Actions workflow'], ['fileTemplates.addDockerfile', 'Dockerfile (Node)']]) {
    reg(id, async () => {
      try {
        const t = TEMPLATES[label];
        await create(t.name, t.body(project()));
      } catch (e) {
        ferrum.window.showMessage(e.message, 'warn');
      }
    });
  }
};

exports.deactivate = function () {};
