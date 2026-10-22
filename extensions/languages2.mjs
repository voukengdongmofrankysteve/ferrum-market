// Language packs, part 2: configuration, markup, templates, infrastructure and hardware languages.
import { S, snippets } from './lib/grammar.mjs';

const TAG_RULES = [
  { begin: '<!--', end: '-->', token: 'comment' },
];

export const LANGS2 = [
  {
    id: 'dockerfile', name: 'Dockerfile', icon: 'DK', ext: '.dockerfile', files: 'Dockerfile Containerfile', line: '#', str: 'ds', caps: false, calls: false, ignoreCase: true,
    kw: 'ADD ARG CMD COPY ENTRYPOINT ENV EXPOSE FROM HEALTHCHECK LABEL MAINTAINER ONBUILD RUN SHELL STOPSIGNAL USER VOLUME WORKDIR AS',
    mid: [{ match: '\\$\\{?[A-Za-z_][A-Za-z0-9_]*\\}?', token: 'property' }, { match: '--[a-z-]+', token: 'attribute' }],
    snippets: snippets(
      S('Node app', 'node', 'A Node.js image', 'FROM node:${1:22}-alpine', 'WORKDIR /app', 'COPY package*.json ./', 'RUN npm ci --omit=dev', 'COPY . .', 'CMD ["node", "${2:index.js}"]'),
      S('Multi-stage build', 'multi', 'A multi-stage build', 'FROM ${1:node:22} AS build', 'WORKDIR /src', 'COPY . .', 'RUN ${2:npm run build}', '', 'FROM ${3:nginx:alpine}', 'COPY --from=build /src/${4:dist} /usr/share/nginx/html'),
      S('Healthcheck', 'health', 'A health check', 'HEALTHCHECK --interval=30s --timeout=3s CMD ${1:curl -f http://localhost/ || exit 1}'),
      S('Non-root user', 'user', 'Run as a normal user', 'RUN adduser -D app', 'USER app'),
    ),
  },
  {
    id: 'yaml-plus', name: 'YAML', icon: 'YML', ext: '.yaml .yml', files: '.clang-format .gitlab-ci.yml', line: '#', str: 'ds', caps: false, calls: false,
    const: 'true false null yes no on off True False Null ~',
    mid: [{ match: '^\\s*-?\\s*[A-Za-z0-9_.\\-\\/"\']+(?=\\s*:(?:\\s|$))', token: 'property' }, { match: '[&*][A-Za-z0-9_\\-]+', token: 'macro' }, { match: '^---|^\\.\\.\\.', token: 'keyword' }, { match: '![A-Za-z!]+', token: 'type' }, { match: '[|>][-+]?\\s*$', token: 'keyword' }],
    snippets: snippets(
      S('GitHub Actions workflow', 'gha', 'A GitHub Actions workflow', 'name: ${1:CI}', 'on:', '  push:', '    branches: [main]', 'jobs:', '  build:', '    runs-on: ubuntu-latest', '    steps:', '      - uses: actions/checkout@v4', '      - run: ${2:echo hello}'),
      S('Docker Compose service', 'dcs', 'A compose service', '${1:app}:', '  image: ${2:nginx:alpine}', '  ports:', '    - "${3:8080}:80"', '  restart: unless-stopped'),
      S('Kubernetes deployment', 'k8s', 'A Deployment', 'apiVersion: apps/v1', 'kind: Deployment', 'metadata:', '  name: ${1:app}', 'spec:', '  replicas: ${2:2}', '  selector:', '    matchLabels:', '      app: ${1:app}', '  template:', '    metadata:', '      labels:', '        app: ${1:app}', '    spec:', '      containers:', '        - name: ${1:app}', '          image: ${3:image:tag}'),
    ),
  },
  {
    id: 'toml-plus', name: 'TOML', icon: 'TOM', ext: '.toml', files: 'Cargo.lock Pipfile poetry.lock', line: '#', str: 'ds', triple: "''' \"\"\"", caps: false, calls: false,
    const: 'true false inf nan',
    mid: [{ match: '^\\s*\\[\\[?[^\\]]+\\]\\]?', token: 'type' }, { match: '^\\s*[A-Za-z0-9_.\\-"]+(?=\\s*=)', token: 'property' }, { match: '\\d{4}-\\d{2}-\\d{2}(?:[T ]\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|[+-]\\d{2}:\\d{2})?)?', token: 'number' }],
    snippets: snippets(
      S('Table', 'tbl', 'A table', '[${1:section}]', '${2:key} = ${3:"value"}'),
      S('Cargo dependency', 'dep', 'A Cargo dependency', '${1:name} = { version = "${2:1}", features = [${3}] }'),
      S('pyproject', 'pyp', 'A pyproject header', '[project]', 'name = "${1:name}"', 'version = "${2:0.1.0}"', 'requires-python = ">=${3:3.10}"'),
    ),
  },
  {
    id: 'terraform', name: 'Terraform and HCL', icon: 'TF', ext: '.tf .tfvars .hcl .tfstate', line: '# //', block: ['/*', '*/'], str: 'd', triple: '<<EOF <<-EOF <<EOT', caps: false,
    kw: 'resource data variable output locals module provider terraform backend required_providers required_version for_each count depends_on lifecycle provisioner dynamic content moved import check',
    const: 'true false null', ty: 'string number bool list map set object tuple any', fn: 'file format join split lookup merge length element concat keys values tolist toset tomap jsonencode jsondecode templatefile cidrsubnet regex replace upper lower trimspace',
    mid: [{ match: '\\b(?:var|local|module|data|each|count|path|terraform|self)\\.[A-Za-z0-9_.\\-\\[\\]*]+', token: 'property' }, { match: '\\$\\{|\\}', token: 'macro' }],
    snippets: snippets(
      S('Resource', 'res', 'A resource', 'resource "${1:aws_instance}" "${2:name}" {', '\t$0', '}'),
      S('Variable', 'var', 'A variable', 'variable "${1:name}" {', '\ttype        = ${2:string}', '\tdescription = "${3}"', '\tdefault     = ${4:null}', '}'),
      S('Output', 'out', 'An output', 'output "${1:name}" {', '\tvalue = ${2:aws_instance.name.id}', '}'),
      S('Provider', 'prov', 'A provider', 'provider "${1:aws}" {', '\tregion = "${2:eu-west-1}"', '}'),
      S('Module', 'mod', 'A module call', 'module "${1:name}" {', '\tsource = "${2:./modules/name}"', '\t$0', '}'),
      S('Data source', 'data', 'A data source', 'data "${1:aws_ami}" "${2:name}" {', '\t$0', '}'),
    ),
  },
  {
    id: 'graphql', name: 'GraphQL', icon: 'GQL', ext: '.graphql .gql .graphqls', line: '#', str: 'd', triple: '"""', calls: false,
    kw: 'query mutation subscription fragment on type interface union enum scalar input extend schema directive implements repeatable', const: 'true false null', ty: 'Int Float String Boolean ID',
    mid: [{ match: '[@$][A-Za-z_][A-Za-z0-9_]*', token: 'macro' }, { match: '^\\s*[a-zA-Z_][A-Za-z0-9_]*(?=\\s*(?:\\(|:))', token: 'property' }],
    snippets: snippets(
      S('Query', 'query', 'A query', 'query ${1:Name}(\\$${2:id}: ID!) {', '\t${3:field}(id: \\$${2:id}) {', '\t\t$0', '\t}', '}'),
      S('Mutation', 'mut', 'A mutation', 'mutation ${1:Name}(\\$input: ${2:Input}!) {', '\t${3:field}(input: \\$input) {', '\t\t$0', '\t}', '}'),
      S('Type', 'type', 'A type', 'type ${1:Name} {', '\t${2:id}: ID!', '\t$0', '}'),
      S('Fragment', 'frag', 'A fragment', 'fragment ${1:Name} on ${2:Type} {', '\t$0', '}'),
    ),
  },
  {
    id: 'protobuf', name: 'Protocol Buffers', icon: 'PB', ext: '.proto', line: '//', block: ['/*', '*/'], str: 'ds', calls: false,
    kw: 'syntax package import option message enum service rpc returns stream oneof map reserved extensions extend repeated optional required public weak to max',
    const: 'true false', ty: 'double float int32 int64 uint32 uint64 sint32 sint64 fixed32 fixed64 sfixed32 sfixed64 bool string bytes',
    snippets: snippets(
      S('Message', 'msg', 'A message', 'message ${1:Name} {', '\t${2:string} ${3:field} = ${4:1};', '}'),
      S('Service', 'svc', 'A service', 'service ${1:Name} {', '\trpc ${2:Call}(${3:Request}) returns (${4:Response});', '}'),
      S('Enum', 'enum', 'An enum', 'enum ${1:Name} {', '\t${2:UNKNOWN} = 0;', '}'),
      S('File header', 'proto', 'A proto3 header', 'syntax = "proto3";', '', 'package ${1:example};', '', '$0'),
    ),
  },
  {
    id: 'nginx', name: 'Nginx config', icon: 'NG', ext: '.nginx .nginxconf', files: 'nginx.conf mime.types', line: '#', str: 'ds', caps: false, calls: false,
    kw: 'server location upstream http events map if set return rewrite proxy_pass listen server_name root index try_files include error_page ssl_certificate ssl_certificate_key add_header proxy_set_header fastcgi_pass gzip worker_processes access_log error_log',
    const: 'on off', mid: [{ match: '\\$[A-Za-z_][A-Za-z0-9_]*', token: 'property' }, { match: '^\\s*[a-z_0-9]+(?=\\s)', token: 'function' }],
    snippets: snippets(
      S('Server block', 'server', 'A server block', 'server {', '\tlisten 80;', '\tserver_name ${1:example.com};', '', '\tlocation / {', '\t\t$0', '\t}', '}'),
      S('Reverse proxy', 'proxy', 'A reverse proxy location', 'location ${1:/} {', '\tproxy_pass http://${2:127.0.0.1:3000};', '\tproxy_set_header Host \\$host;', '\tproxy_set_header X-Real-IP \\$remote_addr;', '}'),
      S('PHP-FPM', 'php', 'A PHP location', 'location ~ \\.php\\$ {', '\tfastcgi_pass unix:/run/php/php-fpm.sock;', '\tinclude fastcgi_params;', '}'),
      S('SSL', 'ssl', 'TLS settings', 'listen 443 ssl http2;', 'ssl_certificate ${1:/etc/ssl/cert.pem};', 'ssl_certificate_key ${2:/etc/ssl/key.pem};'),
    ),
  },
  {
    id: 'apache', name: 'Apache config', icon: 'AP', ext: '.htaccess .htpasswd', files: 'httpd.conf apache2.conf .htaccess', line: '#', str: 'ds', caps: false, calls: false, ignoreCase: true,
    kw: 'Alias AllowOverride AuthType Deny Allow DirectoryIndex DocumentRoot ErrorDocument Header Include LoadModule Options Order Redirect RedirectMatch RewriteBase RewriteCond RewriteEngine RewriteRule Require ServerAdmin ServerName SetEnv SetEnvIf Satisfy',
    const: 'On Off All None Indexes FollowSymLinks', mid: [{ match: '^\\s*</?[A-Za-z]+', token: 'tag' }, { match: '%\\{[A-Z_]+\\}|\\$\\d', token: 'property' }, { match: '\\[[A-Z,=]+\\]', token: 'attribute' }],
    snippets: snippets(
      S('Rewrite to index.php', 'rw', 'Front controller rewrite', 'RewriteEngine On', 'RewriteCond %{REQUEST_FILENAME} !-f', 'RewriteCond %{REQUEST_FILENAME} !-d', 'RewriteRule ^ index.php [L]'),
      S('Force HTTPS', 'https', 'Redirect to HTTPS', 'RewriteEngine On', 'RewriteCond %{HTTPS} off', 'RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]'),
      S('Deny access', 'deny', 'Deny all', 'Require all denied'),
      S('Cache static files', 'cache', 'Cache headers', '<FilesMatch "\\.(css|js|png|jpg|svg|woff2)\\$">', '\tHeader set Cache-Control "max-age=31536000, public"', '</FilesMatch>'),
    ),
  },
  {
    id: 'makefile', name: 'Makefile', icon: 'MK', ext: '.mk .mak', files: 'Makefile makefile GNUmakefile', line: '#', str: 'ds', caps: false, calls: false,
    kw: 'ifeq ifneq ifdef ifndef else endif include sinclude override export unexport define endef vpath', const: '.PHONY .DEFAULT .PRECIOUS .SUFFIXES',
    mid: [{ match: '^[A-Za-z0-9_./%-]+(?=\\s*:(?!=))', token: 'type' }, { match: '\\$[({][^)}]+[)}]|\\$[@<^?*]', token: 'property' }, { match: '^[A-Za-z_][A-Za-z0-9_]*(?=\\s*[:+?]?=)', token: 'function' }],
    snippets: snippets(
      S('Target', 'tgt', 'A target', '${1:target}: ${2:deps}', '\t$0'),
      S('Phony', 'phony', '.PHONY', '.PHONY: ${1:all clean}'),
      S('Variable', 'var', 'A variable', '${1:CC} := ${2:gcc}'),
      S('Clean', 'clean', 'A clean target', 'clean:', '\t$(RM) -r ${1:build}'),
    ),
  },
  {
    id: 'cmake', name: 'CMake', icon: 'CM', ext: '.cmake', files: 'CMakeLists.txt', line: '#', block: ['#[[', ']]'], str: 'd', ignoreCase: true, caps: false,
    kw: 'if else elseif endif foreach endforeach while endwhile function endfunction macro endmacro return break continue',
    fn: 'add_executable add_library add_subdirectory add_custom_command add_custom_target add_definitions cmake_minimum_required project find_package find_library include include_directories install link_directories list message option set target_compile_definitions target_compile_features target_include_directories target_link_libraries target_sources string file',
    const: 'ON OFF TRUE FALSE PUBLIC PRIVATE INTERFACE REQUIRED', mid: [{ match: '\\$\\{[A-Za-z0-9_]+\\}|\\$ENV\\{[A-Za-z0-9_]+\\}', token: 'property' }],
    snippets: snippets(
      S('Project', 'proj', 'A project header', 'cmake_minimum_required(VERSION ${1:3.20})', 'project(${2:name} LANGUAGES ${3:CXX})', 'set(CMAKE_CXX_STANDARD ${4:20})'),
      S('Executable', 'exe', 'An executable', 'add_executable(${1:app} ${2:main.cpp})'),
      S('Library', 'lib', 'A library', 'add_library(${1:lib} ${2:src.cpp})', 'target_include_directories(${1:lib} PUBLIC ${3:include})'),
      S('Find package', 'fp', 'find_package', 'find_package(${1:Package} REQUIRED)'),
    ),
  },
  {
    id: 'latex', name: 'LaTeX', icon: 'TEX', ext: '.tex .sty .cls .bib', line: '%', str: '', caps: false, calls: false, num: false,
    mid: [{ match: '\\\\(?:begin|end)\\{[A-Za-z*]+\\}', token: 'keyword' }, { match: '\\\\[A-Za-z]+\\*?', token: 'function' }, { match: '\\$\\$[^$]*\\$\\$|\\$[^$]+\\$', token: 'string' }, { match: '\\\\[\\\\{}%&$#_]', token: 'constant' }, { match: '[{}\\[\\]]', token: 'type' }],
    snippets: snippets(
      S('Document', 'doc', 'A document skeleton', '\\documentclass{${1:article}}', '\\usepackage[utf8]{inputenc}', '', '\\begin{document}', '$0', '\\end{document}'),
      S('Section', 'sec', 'A section', '\\section{${1:Title}}', '$0'),
      S('Environment', 'env', 'An environment', '\\begin{${1:itemize}}', '\t$0', '\\end{${1:itemize}}'),
      S('Figure', 'fig', 'A figure', '\\begin{figure}[h]', '\t\\centering', '\t\\includegraphics[width=0.8\\textwidth]{${1:file}}', '\t\\caption{${2:Caption}}', '\\end{figure}'),
      S('Equation', 'eq', 'An equation', '\\begin{equation}', '\t$0', '\\end{equation}'),
      S('Itemize', 'item', 'A bullet list', '\\begin{itemize}', '\t\\item $0', '\\end{itemize}'),
    ),
  },
  {
    id: 'scss', name: 'SCSS and Sass', icon: 'SS', ext: '.scss .sass', line: '//', block: ['/*', '*/'], str: 'ds', caps: false,
    kw: '@use @forward @import @mixin @include @function @return @if @else @each @for @while @extend @media @supports @keyframes @font-face @at-root @debug @warn @error',
    const: 'true false null', mid: [{ match: '\\$[A-Za-z_][A-Za-z0-9_-]*', token: 'property' }, { match: '@[a-z-]+', token: 'keyword' }, { match: '#[0-9a-fA-F]{3,8}\\b', token: 'number' }, { match: '[A-Za-z-]+(?=\\s*:(?!:))', token: 'attribute' }, { match: '[.#&][A-Za-z_][A-Za-z0-9_-]*', token: 'type' }, { match: '\\b\\d+(?:\\.\\d+)?(?:px|em|rem|%|vh|vw|s|ms|deg)?\\b', token: 'number' }],
    snippets: snippets(
      S('Mixin', 'mixin', 'A mixin', '@mixin ${1:name}(\\$${2:arg}) {', '\t$0', '}'),
      S('Include', 'inc', 'Use a mixin', '@include ${1:name}(${2});'),
      S('Variable', 'var', 'A variable', '\\$${1:name}: ${2:value};'),
      S('Media query', 'mq', 'A media query', '@media (min-width: ${1:768px}) {', '\t$0', '}'),
      S('Each', 'each', 'An each loop', '@each \\$${1:item} in ${2:\\$list} {', '\t$0', '}'),
      S('Flex center', 'fc', 'Center with flex', 'display: flex;', 'align-items: center;', 'justify-content: center;'),
    ),
  },
  {
    id: 'less', name: 'Less', icon: 'LS', ext: '.less', line: '//', block: ['/*', '*/'], str: 'ds', caps: false,
    kw: '@import @media @font-face @keyframes @plugin', mid: [{ match: '@[A-Za-z_][A-Za-z0-9_-]*', token: 'property' }, { match: '#[0-9a-fA-F]{3,8}\\b', token: 'number' }, { match: '[A-Za-z-]+(?=\\s*:(?!:))', token: 'attribute' }, { match: '[.#&][A-Za-z_][A-Za-z0-9_-]*', token: 'type' }, { match: '\\b\\d+(?:\\.\\d+)?(?:px|em|rem|%|vh|vw|s|ms)?\\b', token: 'number' }],
    snippets: snippets(
      S('Variable', 'var', 'A variable', '@${1:name}: ${2:value};'),
      S('Mixin', 'mixin', 'A mixin', '.${1:name}(@${2:arg}) {', '\t$0', '}'),
      S('Media query', 'mq', 'A media query', '@media (min-width: ${1:768px}) {', '\t$0', '}'),
    ),
  },
  {
    id: 'vue', name: 'Vue', icon: 'VUE', ext: '.vue', block: ['<!--', '-->'], str: 'ds', caps: false, calls: false, num: false,
    mid: [{ match: '</?[A-Za-z][A-Za-z0-9-]*', token: 'tag' }, { match: '[:@#]?v-[a-z-]+|[:@][A-Za-z.\\-]+|#[a-z]+(?==)', token: 'macro' }, { match: '[A-Za-z-]+(?==)', token: 'attribute' }, { match: '/?>', token: 'tag' }, { match: '\\{\\{|\\}\\}', token: 'keyword' }],
    snippets: snippets(
      S('Single file component', 'vue', 'A single file component', '<script setup lang="ts">', '$1', '</script>', '', '<template>', '\t$0', '</template>', '', '<style scoped>', '</style>'),
      S('Ref', 'ref', 'A ref', 'const ${1:name} = ref(${2:0})'),
      S('Computed', 'comp', 'A computed value', 'const ${1:name} = computed(() => ${2:value})'),
      S('Props', 'props', 'Define props', 'const props = defineProps<{ ${1:name}: ${2:string} }>()'),
      S('Emit', 'emit', 'Define emits', "const emit = defineEmits<{ (e: '${1:change}', value: ${2:string}): void }>()"),
      S('v-for', 'vfor', 'A v-for list', '<li v-for="${1:item} in ${2:items}" :key="${1:item}.id">{{ ${1:item} }}</li>'),
    ),
  },
  {
    id: 'svelte', name: 'Svelte', icon: 'SV', ext: '.svelte', block: ['<!--', '-->'], str: 'ds', caps: false, calls: false, num: false,
    mid: [{ match: '</?[A-Za-z][A-Za-z0-9-]*', token: 'tag' }, { match: '\\{[#:/@]\\w+', token: 'keyword' }, { match: '(?:on|bind|class|use|transition|in|out|animate):[A-Za-z]+', token: 'macro' }, { match: '[A-Za-z-]+(?==)', token: 'attribute' }, { match: '/?>', token: 'tag' }, { match: '[{}]', token: 'keyword' }],
    snippets: snippets(
      S('Component', 'svelte', 'A component', '<script>', '\t$1', '</script>', '', '$0', '', '<style>', '</style>'),
      S('If block', 'if', 'An if block', '{#if ${1:condition}}', '\t$0', '{/if}'),
      S('Each block', 'each', 'An each block', '{#each ${1:items} as ${2:item}}', '\t$0', '{/each}'),
      S('Await block', 'await', 'An await block', '{#await ${1:promise}}', '\t<p>Loading...</p>', '{:then ${2:value}}', '\t$0', '{:catch error}', '\t<p>{error.message}</p>', '{/await}'),
    ),
  },
  {
    id: 'blade', name: 'Laravel Blade', icon: 'BL', ext: '.blade.php', block: ['{{--', '--}}'], str: 'ds', caps: false, calls: false, num: false,
    extra: [{ begin: '<!--', end: '-->', token: 'comment' }],
    mid: [{ match: '@[A-Za-z]+', token: 'keyword' }, { match: '\\{\\{|\\}\\}|\\{!!|!!\\}', token: 'macro' }, { match: '</?[A-Za-z][A-Za-z0-9:-]*', token: 'tag' }, { match: '\\$[A-Za-z_][A-Za-z0-9_]*', token: 'property' }, { match: '[A-Za-z:@-]+(?==)', token: 'attribute' }, { match: '/?>', token: 'tag' }],
    snippets: snippets(
      S('If', 'if', '@if', '@if (${1:condition})', '\t$0', '@endif'),
      S('Foreach', 'foreach', '@foreach', '@foreach (${1:\\$items} as ${2:\\$item})', '\t$0', '@endforeach'),
      S('Extends', 'ext', '@extends', "@extends('${1:layouts.app}')"),
      S('Section', 'sec', '@section', "@section('${1:content}')", '\t$0', '@endsection'),
      S('Echo', 'e', 'Escaped output', '{{ ${1:\\$value} }}'),
      S('Include', 'inc', '@include', "@include('${1:partials.name}')"),
      S('Form', 'form', 'A form with CSRF', '<form method="POST" action="{{ route(\'${1:name}\') }}">', '\t@csrf', '\t$0', '</form>'),
    ),
  },
  {
    id: 'twig', name: 'Twig and Jinja', icon: 'TW', ext: '.twig .jinja .jinja2 .j2', block: ['{#', '#}'], str: 'ds', caps: false, calls: false, num: false,
    extra: [{ begin: '<!--', end: '-->', token: 'comment' }],
    mid: [{ match: '\\{%-?|-?%\\}|\\{\\{-?|-?\\}\\}', token: 'macro' }, { match: '\\b(?:if|else|elif|elseif|endif|for|endfor|in|block|endblock|extends|include|import|from|set|macro|endmacro|with|endwith|not|and|or|is|raw|endraw)\\b', token: 'keyword' }, { match: '\\|\\s*[A-Za-z_]+', token: 'function' }, { match: '</?[A-Za-z][A-Za-z0-9:-]*', token: 'tag' }, { match: '[A-Za-z:@-]+(?==)', token: 'attribute' }, { match: '/?>', token: 'tag' }],
    snippets: snippets(
      S('If', 'if', 'if block', '{% if ${1:condition} %}', '\t$0', '{% endif %}'),
      S('For', 'for', 'for block', '{% for ${1:item} in ${2:items} %}', '\t$0', '{% endfor %}'),
      S('Block', 'block', 'A block', '{% block ${1:content} %}', '\t$0', '{% endblock %}'),
      S('Extends', 'ext', 'extends', '{% extends "${1:base.html}" %}'),
      S('Output', 'e', 'Output a value', '{{ ${1:value} }}'),
    ),
  },
  {
    id: 'handlebars', name: 'Handlebars', icon: 'HB', ext: '.hbs .handlebars .mustache', block: ['{{!--', '--}}'], str: 'ds', caps: false, calls: false, num: false,
    extra: [{ begin: '<!--', end: '-->', token: 'comment' }, { match: '\\{\\{![^}]*\\}\\}', token: 'comment' }],
    mid: [{ match: '\\{\\{\\{?[#/^>&]?', token: 'macro' }, { match: '\\}?\\}\\}', token: 'macro' }, { match: '(?<=\\{\\{[#/^]?)[A-Za-z_]+', token: 'keyword' }, { match: '</?[A-Za-z][A-Za-z0-9-]*', token: 'tag' }, { match: '[A-Za-z-]+(?==)', token: 'attribute' }, { match: '/?>', token: 'tag' }],
    snippets: snippets(
      S('Each', 'each', '#each', '{{#each ${1:items}}}', '\t$0', '{{/each}}'),
      S('If', 'if', '#if', '{{#if ${1:condition}}}', '\t$0', '{{/if}}'),
      S('Partial', 'part', 'A partial', '{{> ${1:name}}}'),
    ),
  },
  {
    id: 'pug', name: 'Pug', icon: 'PUG', ext: '.pug .jade', line: '//', str: 'ds', caps: false, calls: false,
    kw: 'if else unless each for while case when default include extends block mixin', mid: [{ match: '^\\s*[a-z][a-z0-9-]*', token: 'tag' }, { match: '[.#][A-Za-z_][A-Za-z0-9_-]*', token: 'type' }, { match: '\\b[A-Za-z-]+(?==)', token: 'attribute' }, { match: '[+][A-Za-z_]+', token: 'function' }, { match: '#\\{[^}]*\\}', token: 'macro' }],
    snippets: snippets(
      S('Page skeleton', 'doc', 'A page', 'doctype html', 'html(lang="${1:en}")', '\thead', '\t\ttitle ${2:Title}', '\tbody', '\t\t$0'),
      S('Each', 'each', 'each', 'each ${1:item} in ${2:items}', '\t$0'),
      S('Mixin', 'mixin', 'A mixin', 'mixin ${1:name}(${2:args})', '\t$0'),
    ),
  },
  {
    id: 'solidity', name: 'Solidity', icon: 'SOL', ext: '.sol', line: '//', block: ['/*', '*/'], str: 'ds',
    kw: 'abstract address anonymous as assembly break calldata catch constant constructor continue contract delete do else emit enum error event external fallback for function if immutable import indexed interface internal is library mapping memory modifier new override payable pragma private public pure receive return returns revert require assert storage struct try type unchecked using view virtual while',
    const: 'true false wei gwei ether seconds minutes hours days weeks this super msg block tx', ty: 'bool string bytes bytes32 uint uint8 uint16 uint32 uint64 uint128 uint256 int int256 address',
    snippets: snippets(
      S('Contract', 'contract', 'A contract', '// SPDX-License-Identifier: MIT', 'pragma solidity ^${1:0.8.24};', '', 'contract ${2:Name} {', '\t$0', '}'),
      S('Function', 'fn', 'A function', 'function ${1:name}(${2:uint256 value}) public ${3:view} returns (${4:uint256}) {', '\t$0', '}'),
      S('Event', 'event', 'An event', 'event ${1:Name}(${2:address indexed from}, ${3:uint256 value});'),
      S('Modifier', 'mod', 'A modifier', 'modifier ${1:onlyOwner}() {', '\trequire(${2:msg.sender == owner}, "${3:Not allowed}");', '\t_;', '}'),
      S('Mapping', 'map', 'A mapping', 'mapping(${1:address} => ${2:uint256}) public ${3:balances};'),
    ),
  },
  {
    id: 'asm', name: 'Assembly', icon: 'ASM', ext: '.asm .s .S .nasm .masm', line: '; #', str: 'ds', ignoreCase: true, caps: false, calls: false,
    kw: 'mov push pop lea add sub mul imul div idiv inc dec and or xor not neg shl shr sar rol ror cmp test jmp je jne jz jnz jg jge jl jle ja jae jb jbe call ret int syscall nop loop leave enter cld std rep movsb movsw movsd stosb lodsb xchg cmov adc sbb cdq cqo db dw dd dq resb resw resd resq equ times section segment global extern bits org',
    ty: 'byte word dword qword ptr', const: 'rax rbx rcx rdx rsi rdi rbp rsp rip r8 r9 r10 r11 r12 r13 r14 r15 eax ebx ecx edx esi edi ebp esp ax bx cx dx al bl cl dl ah bh ch dh x0 x1 x2 sp lr pc',
    mid: [{ match: '^\\s*[A-Za-z_.$][A-Za-z0-9_.$]*:', token: 'type' }, { match: '\\.[a-z]+', token: 'macro' }, { match: '\\b[0-9][0-9A-Fa-f]*[hH]\\b|\\$[0-9A-Fa-f]+', token: 'number' }],
    snippets: snippets(
      S('Section text', 'text', 'The code section', 'section .text', 'global _start', '', '_start:', '\t$0'),
      S('Exit syscall', 'exit', 'Linux exit(0)', 'mov rax, 60', 'xor rdi, rdi', 'syscall'),
      S('Function', 'fn', 'A function with a frame', '${1:name}:', '\tpush rbp', '\tmov rbp, rsp', '\t$0', '\tpop rbp', '\tret'),
    ),
  },
  {
    id: 'vhdl', name: 'VHDL', icon: 'VHD', ext: '.vhd .vhdl', line: '--', str: 'd', ignoreCase: true, caps: false, calls: false,
    kw: 'abs access after alias all and architecture array assert attribute begin block body buffer bus case component configuration constant disconnect downto else elsif end entity exit file for function generate generic group guarded if impure in inertial inout is label library linkage literal loop map mod nand new next nor not null of on open or others out package port postponed procedure process pure range record register reject rem report return rol ror select severity shared signal sla sll sra srl subtype then to transport type unaffected units until use variable wait when while with xnor xor',
    ty: 'bit bit_vector boolean character integer natural positive real string time std_logic std_logic_vector std_ulogic unsigned signed', const: 'true false',
    snippets: snippets(
      S('Entity', 'ent', 'An entity and architecture', 'entity ${1:name} is', '\tport (', '\t\t${2:clk} : in std_logic', '\t);', 'end entity ${1:name};', '', 'architecture ${3:rtl} of ${1:name} is', 'begin', '\t$0', 'end architecture ${3:rtl};'),
      S('Process', 'proc', 'A clocked process', 'process(${1:clk})', 'begin', '\tif rising_edge(${1:clk}) then', '\t\t$0', '\tend if;', 'end process;'),
      S('Library', 'lib', 'IEEE library', 'library ieee;', 'use ieee.std_logic_1164.all;', 'use ieee.numeric_std.all;'),
    ),
  },
  {
    id: 'verilog', name: 'Verilog and SystemVerilog', icon: 'V', ext: '.v .vh .sv .svh', line: '//', block: ['/*', '*/'], str: 'd',
    kw: 'always always_comb always_ff always_latch assign automatic begin case casex casez class default defparam disable else end endcase endclass endfunction endgenerate endmodule endpackage endtask for force forever fork function generate genvar if initial inout input interface join localparam logic module negedge output package parameter posedge reg release repeat return signed task typedef unsigned wait while wire',
    ty: 'bit byte int integer logic longint real reg shortint time wire', const: '1\'b0 1\'b1 1\'bx 1\'bz', mid: [{ match: '`[A-Za-z_]+', token: 'macro' }, { match: '\\$[A-Za-z_]+', token: 'function' }, { match: "\\d*'[sS]?[bBoOdDhH][0-9a-fA-FxXzZ_]+", token: 'number' }],
    snippets: snippets(
      S('Module', 'mod', 'A module', 'module ${1:name} (', '\tinput  wire ${2:clk},', '\toutput reg  ${3:out}', ');', '\t$0', 'endmodule'),
      S('Always posedge', 'alw', 'A clocked block', 'always @(posedge ${1:clk}) begin', '\t$0', 'end'),
      S('Testbench', 'tb', 'A testbench skeleton', 'module ${1:tb};', '\treg clk = 0;', '\talways #5 clk = ~clk;', '\tinitial begin', '\t\t$0', '\t\t#100 $finish;', '\tend', 'endmodule'),
    ),
  },
  {
    id: 'glsl', name: 'GLSL and HLSL shaders', icon: 'GL', ext: '.glsl .vert .frag .geom .comp .hlsl .fx .wgsl', line: '//', block: ['/*', '*/'],
    kw: 'attribute break const continue discard do else flat for highp if in inout layout lowp mediump out precision return smooth struct switch uniform varying while buffer shared cbuffer technique pass',
    const: 'true false', ty: 'bool int uint float double void vec2 vec3 vec4 ivec2 ivec3 ivec4 uvec2 uvec3 uvec4 bvec2 bvec3 bvec4 mat2 mat3 mat4 sampler2D sampler3D samplerCube float2 float3 float4 float4x4 half Texture2D SamplerState',
    fn: 'abs acos asin atan clamp cos cross distance dot exp floor fract length log max min mix mod normalize pow reflect refract sign sin smoothstep sqrt step tan texture texture2D transpose inverse lerp saturate mul',
    mid: [{ match: '^\\s*#\\s*[a-z]+.*$', token: 'macro' }, { match: '\\bgl_[A-Za-z]+|\\bSV_[A-Za-z]+', token: 'constant' }],
    snippets: snippets(
      S('Fragment shader', 'frag', 'A fragment shader', '#version ${1:330 core}', 'out vec4 fragColor;', 'in vec2 uv;', '', 'void main() {', '\tfragColor = vec4($0);', '}'),
      S('Vertex shader', 'vert', 'A vertex shader', '#version ${1:330 core}', 'layout(location = 0) in vec3 position;', 'uniform mat4 mvp;', '', 'void main() {', '\tgl_Position = mvp * vec4(position, 1.0);', '}'),
      S('Uniform', 'uni', 'A uniform', 'uniform ${1:float} ${2:name};'),
    ),
  },
  {
    id: 'prolog', name: 'Prolog', icon: 'PRO', ext: '.pro .prolog .P', line: '%', block: ['/*', '*/'], str: 'ds', caps: false,
    kw: 'is mod rem div dynamic discontiguous initialization module use_module ensure_loaded op', const: 'true false fail nl halt', fn: 'write writeln print format assert asserta assertz retract findall bagof setof member append length reverse nth0 nth1 msort sort atom_codes atom_length',
    mid: [{ match: ':-|-->|\\\\\\+|=\\.\\.|\\\\=|=:=|=\\\\=|->|;', token: 'keyword' }, { match: '\\b[A-Z_][A-Za-z0-9_]*\\b', token: 'property' }],
    snippets: snippets(
      S('Fact', 'fact', 'A fact', '${1:parent}(${2:tom}, ${3:bob}).'),
      S('Rule', 'rule', 'A rule', '${1:head}(${2:X}) :-', '\t$0.'),
      S('List recursion', 'rec', 'Recursion on a list', '${1:len}([], 0).', '${1:len}([_|T], N) :-', '\t${1:len}(T, M),', '\tN is M + 1.'),
    ),
  },
  {
    id: 'lisp', name: 'Lisp and Scheme', icon: 'LSP', ext: '.lisp .lsp .cl .el .scm .ss .rkt', line: ';', block: ['#|', '|#'], str: 'd', caps: false, calls: false,
    kw: 'defun defvar defparameter defmacro defstruct defclass defgeneric defmethod define define-syntax lambda let let* letrec if cond case when unless do dolist dotimes loop progn setq setf quote quasiquote begin and or not require provide module',
    const: 't nil #t #f else', fn: 'car cdr cons list append reverse length map filter reduce apply funcall format print display newline mapcar assoc member eq eql equal',
    mid: [{ match: ":[A-Za-z0-9_\\-]+|'[A-Za-z0-9_\\-]+", token: 'constant' }, { match: '[()]', token: 'keyword' }],
    snippets: snippets(
      S('Function (Common Lisp)', 'defun', 'A function', '(defun ${1:name} (${2:args})', '  $0)'),
      S('Define (Scheme)', 'def', 'A definition', '(define (${1:name} ${2:args})', '  $0)'),
      S('Let', 'let', 'let bindings', '(let ((${1:x} ${2:1}))', '  $0)'),
    ),
  },
  {
    id: 'vim', name: 'Vim script', icon: 'VIM', ext: '.vim .vimrc', files: '.vimrc _vimrc', line: '"', str: 's', caps: false, calls: false,
    kw: 'let set setlocal unlet if else elseif endif for endfor while endwhile function endfunction return call execute command autocmd augroup syntax highlight map nmap imap vmap noremap nnoremap inoremap vnoremap source finish try catch endtry',
    const: 'true false v:true v:false', mid: [{ match: '[abglstvw]:[A-Za-z_][A-Za-z0-9_]*', token: 'property' }, { match: '<[A-Za-z\\-]+>', token: 'macro' }],
    snippets: snippets(
      S('Function', 'fun', 'A function', 'function! ${1:Name}(${2:args})', '\t$0', 'endfunction'),
      S('Autocmd group', 'aug', 'An autocmd group', 'augroup ${1:name}', '\tautocmd!', '\tautocmd ${2:BufWritePre} ${3:*} $0', 'augroup END'),
      S('Normal map', 'nn', 'A normal mode map', 'nnoremap <silent> ${1:<leader>x} ${2::command<CR>}'),
    ),
  },
  {
    id: 'fortran', name: 'Fortran', icon: 'F90', ext: '.f90 .f95 .f03 .f08 .f .for', line: '!', str: 'ds', ignoreCase: true, caps: false,
    kw: 'allocatable allocate call case character common complex contains cycle deallocate do else elseif end endif enddo exit function if implicit in inout integer intent interface kind logical module none only out parameter pointer print private program public read real recursive result return save select stop subroutine target then type use where while write',
    const: '.true. .false.', fn: 'abs sqrt sin cos exp log size len trim allocated sum maxval minval matmul',
    snippets: snippets(
      S('Program', 'prog', 'A program', 'program ${1:main}', '\timplicit none', '\t$0', 'end program ${1:main}'),
      S('Subroutine', 'sub', 'A subroutine', 'subroutine ${1:name}(${2:args})', '\timplicit none', '\t$0', 'end subroutine ${1:name}'),
      S('Do loop', 'do', 'A do loop', 'do ${1:i} = 1, ${2:n}', '\t$0', 'end do'),
    ),
  },
  {
    id: 'pascal', name: 'Pascal and Delphi', icon: 'PAS', ext: '.pas .pp .dpr .lpr .inc', line: '//', block: [['{', '}'], ['(*', '*)']], str: 's', ignoreCase: true, caps: false,
    kw: 'and array as asm begin case class const constructor destructor div do downto else end except exports file finalization finally for function goto if implementation in inherited initialization inline interface is label library mod nil not object of on or out packed private procedure program property protected public published raise record repeat resourcestring set shl shr string then threadvar to try type unit until uses var while with xor',
    const: 'true false nil', ty: 'integer string boolean char real double byte word longint cardinal pointer tobject', fn: 'writeln write readln read inc dec length setlength new dispose assigned',
    snippets: snippets(
      S('Program', 'prog', 'A program', 'program ${1:Name};', '', 'begin', '\t$0', 'end.'),
      S('Procedure', 'proc', 'A procedure', 'procedure ${1:Name}(${2:args});', 'begin', '\t$0', 'end;'),
      S('Function', 'func', 'A function', 'function ${1:Name}(${2:args}): ${3:Integer};', 'begin', '\tResult := $0;', 'end;'),
      S('For loop', 'for', 'A for loop', 'for ${1:i} := 1 to ${2:n} do', 'begin', '\t$0', 'end;'),
    ),
  },
  {
    id: 'tcl', name: 'Tcl', icon: 'TCL', ext: '.tcl .tk', line: '#', str: 'd', caps: false, calls: false,
    kw: 'after append array break catch cd close concat continue else elseif eval exec exit expr for foreach format gets global if incr info join lappend lindex linsert list llength lrange lreplace lsearch lset lsort namespace open package proc puts read regexp regsub rename return scan set split string subst switch then time trace unset uplevel upvar variable vwait while',
    mid: [{ match: '\\$\\{?[A-Za-z_][A-Za-z0-9_:]*\\}?', token: 'property' }],
    snippets: snippets(
      S('Proc', 'proc', 'A procedure', 'proc ${1:name} {${2:args}} {', '\t$0', '}'),
      S('Foreach', 'fe', 'foreach', 'foreach ${1:item} ${2:\\$list} {', '\t$0', '}'),
      S('If', 'if', 'if', 'if {${1:condition}} {', '\t$0', '}'),
    ),
  },
  {
    id: 'log', name: 'Log files', icon: 'LOG', ext: '.log .out', files: 'npm-debug.log', str: '', caps: false, calls: false, num: false,
    mid: [{ match: '\\b(?:FATAL|CRITICAL|SEVERE|ERROR|ERR|FAIL(?:ED|URE)?|Exception|Traceback|panic)\\b', token: 'macro' }, { match: '\\b(?:WARN(?:ING)?|DEPRECATED)\\b', token: 'keyword' }, { match: '\\b(?:INFO|NOTICE|SUCCESS|OK)\\b', token: 'string' }, { match: '\\b(?:DEBUG|TRACE|VERBOSE)\\b', token: 'comment' }, { match: '\\d{4}-\\d{2}-\\d{2}[T ]\\d{2}:\\d{2}:\\d{2}(?:[.,]\\d+)?(?:Z|[+-]\\d{2}:?\\d{2})?|\\b\\d{2}:\\d{2}:\\d{2}(?:[.,]\\d+)?\\b', token: 'number' }, { match: '\\b\\d{1,3}(?:\\.\\d{1,3}){3}\\b', token: 'constant' }, { match: '\\[[^\\]]*\\]', token: 'type' }, { match: 'https?://[^\\s)\\]>"\']+', token: 'string' }, { match: '\\b(?:at|in)\\s+[\\w./\\\\:-]+:\\d+(?::\\d+)?', token: 'function' }],
    snippets: snippets(),
  },
  {
    id: 'gitfiles', name: 'Git files', icon: 'GIT', ext: '.gitignore .gitattributes .gitmodules .dockerignore .npmignore .eslintignore', files: '.gitignore .gitattributes .gitmodules .dockerignore .npmignore .gitkeep CODEOWNERS', line: '#', str: '', caps: false, calls: false, num: false,
    mid: [{ match: '^\\s*!', token: 'keyword' }, { match: '\\*\\*?|\\?', token: 'macro' }, { match: '^\\s*\\[[^\\]]+\\]', token: 'type' }, { match: '^\\s*[A-Za-z0-9_.-]+(?=\\s*=)', token: 'property' }, { match: '/$', token: 'constant' }],
    snippets: snippets(
      S('Node ignore', 'node', 'Common Node ignores', 'node_modules/', 'dist/', '.env', '*.log'),
      S('Rust ignore', 'rust', 'Common Rust ignores', 'target/', 'Cargo.lock', '**/*.rs.bk'),
      S('Python ignore', 'py', 'Common Python ignores', '__pycache__/', '*.pyc', '.venv/', '.env', 'dist/'),
      S('Laravel ignore', 'laravel', 'Common Laravel ignores', '/vendor', '/node_modules', '.env', '/storage/*.key', '/public/storage'),
    ),
  },
  {
    id: 'diff', name: 'Diff and Patch', icon: 'DIF', ext: '.diff .patch .rej', str: '', caps: false, calls: false, num: false,
    mid: [{ match: '^diff --git .*$|^index [0-9a-f]+\\.\\.[0-9a-f]+.*$|^(?:---|\\+\\+\\+) .*$', token: 'type' }, { match: '^@@.*@@', token: 'macro' }, { match: '^\\+.*$', token: 'string' }, { match: '^-.*$', token: 'keyword' }, { match: '^\\\\ No newline.*$', token: 'comment' }],
    snippets: snippets(),
  },
  {
    id: 'dotenv', name: 'Dotenv', icon: 'ENV', ext: '.env .envrc .env.example .env.local .env.production .env.development .env.test', files: '.env .env.example .env.local .env.production .env.development .env.test .envrc', line: '#', str: 'ds', caps: false, calls: false,
    const: 'true false null', mid: [{ match: '^\\s*(?:export\\s+)?[A-Za-z_][A-Za-z0-9_]*(?==)', token: 'property' }, { match: '\\$\\{?[A-Za-z_][A-Za-z0-9_]*\\}?', token: 'macro' }, { match: '(?<==)[^#\\s"\'][^#\\s]*', token: 'string' }],
    snippets: snippets(
      S('Database URL', 'db', 'A database URL', 'DATABASE_URL=${1:postgres://user:password@localhost:5432/name}'),
      S('App settings', 'app', 'Common app settings', 'APP_ENV=${1:local}', 'APP_DEBUG=${2:true}', 'APP_URL=${3:http://localhost}'),
    ),
  },
  {
    id: 'csv', name: 'CSV and TSV', icon: 'CSV', ext: '.csv .tsv .psv', str: 'd', caps: false, calls: false,
    mid: [{ match: '[,;\\t|]', token: 'keyword' }, { match: '(?<=^|[,;\\t|])-?\\d+(?:\\.\\d+)?(?=$|[,;\\t|])', token: 'number' }, { match: '\\b(?:true|false|null|NULL|NaN)\\b', token: 'constant' }],
    snippets: snippets(),
  },
  {
    id: 'ini-cfg', name: 'INI and Properties', icon: 'INI', ext: '.ini .cfg .properties .editorconfig .desktop .service .conf', files: '.editorconfig setup.cfg tox.ini pytest.ini', line: '; #', str: 'ds', caps: false, calls: false,
    const: 'true false yes no on off null',
    mid: [{ match: '^\\s*\\[[^\\]]+\\]', token: 'type' }, { match: '^\\s*[A-Za-z0-9_.\\-]+(?=\\s*[=:])', token: 'property' }, { match: '\\$\\{[^}]*\\}|%\\([^)]*\\)s', token: 'macro' }],
    snippets: snippets(
      S('Section', 'sec', 'A section', '[${1:section}]', '${2:key} = ${3:value}'),
      S('EditorConfig', 'ec', 'A basic .editorconfig', 'root = true', '', '[*]', 'indent_style = space', 'indent_size = ${1:2}', 'end_of_line = lf', 'insert_final_newline = true'),
    ),
  },
  {
    id: 'cobol', name: 'COBOL', icon: 'COB', ext: '.cob .cbl .cpy', line: '*>', str: 'ds', ignoreCase: true, caps: false, calls: false,
    kw: 'ACCEPT ADD ALTER CALL CANCEL CLOSE COMPUTE CONTINUE DELETE DISPLAY DIVIDE ELSE END-IF END-PERFORM EVALUATE EXIT GO GOBACK IF INITIALIZE INSPECT MERGE MOVE MULTIPLY OPEN PERFORM READ RELEASE RETURN REWRITE SEARCH SET SORT START STOP STRING SUBTRACT UNSTRING WRITE WHEN THEN UNTIL VARYING TIMES GIVING USING FROM TO INTO BY',
    ty: 'PIC PICTURE COMP COMP-3 VALUE OCCURS REDEFINES', const: 'ZERO ZEROS SPACE SPACES HIGH-VALUES LOW-VALUES TRUE FALSE',
    mid: [{ match: '\\b(?:IDENTIFICATION|ENVIRONMENT|DATA|PROCEDURE) DIVISION\\b|\\b[A-Z0-9-]+ SECTION\\b|\\bPROGRAM-ID\\b|\\bWORKING-STORAGE\\b', token: 'macro' }],
    snippets: snippets(
      S('Program skeleton', 'prog', 'A program', 'IDENTIFICATION DIVISION.', 'PROGRAM-ID. ${1:HELLO}.', 'PROCEDURE DIVISION.', '    DISPLAY "${2:Hello}".', '    STOP RUN.'),
      S('Perform until', 'perf', 'PERFORM UNTIL', 'PERFORM UNTIL ${1:condition}', '    $0', 'END-PERFORM.'),
    ),
  },
  {
    id: 'sql-plus', name: 'SQL Dialects', icon: 'SQL', ext: '.psql .pgsql .mysql .plsql .tsql .ddl .dml .prc .fnc', line: '-- #', block: ['/*', '*/'], str: 'sd', ignoreCase: true, caps: false,
    kw: 'add all alter and any as asc begin between by case cascade check column commit constraint create cross database default delete desc distinct drop else end exists foreign from full grant group having if in index inner insert into is join key left like limit materialized not null offset on or order outer primary references replace restrict returning revoke right rollback select set table temporary then transaction trigger truncate union unique update using values view when where with recursive over partition window explain analyze declare cursor fetch loop return returns language procedure function schema sequence extension',
    const: 'true false null', ty: 'int integer bigint smallint serial bigserial text varchar char boolean bool date time timestamp timestamptz numeric decimal float double real json jsonb uuid bytea blob', fn: 'count sum avg min max coalesce nullif now cast concat length lower upper trim substring replace round floor ceil row_number rank dense_rank lag lead string_agg array_agg json_build_object date_trunc extract',
    snippets: snippets(
      S('Create table', 'ct', 'CREATE TABLE', 'CREATE TABLE ${1:name} (', '\tid BIGSERIAL PRIMARY KEY,', '\t${2:column} ${3:TEXT} NOT NULL,', '\tcreated_at TIMESTAMPTZ NOT NULL DEFAULT now()', ');'),
      S('Select', 'sel', 'SELECT', 'SELECT ${1:*}', 'FROM ${2:table}', 'WHERE ${3:condition};'),
      S('Join', 'jn', 'JOIN', 'JOIN ${1:other} ON ${1:other}.${2:id} = ${3:table}.${4:other_id}'),
      S('CTE', 'cte', 'A common table expression', 'WITH ${1:name} AS (', '\tSELECT $0', ')', 'SELECT * FROM ${1:name};'),
      S('Index', 'idx', 'CREATE INDEX', 'CREATE INDEX ${1:idx_name} ON ${2:table} (${3:column});'),
      S('Upsert (Postgres)', 'ups', 'INSERT ... ON CONFLICT', 'INSERT INTO ${1:table} (${2:cols}) VALUES (${3:vals})', 'ON CONFLICT (${4:id}) DO UPDATE SET ${5:col} = EXCLUDED.${5:col};'),
    ),
  },
  {
    id: 'restclient', name: 'HTTP requests', icon: 'HTTP', ext: '.http .rest', line: '# //', str: 'd', caps: false, calls: false,
    kw: 'GET POST PUT PATCH DELETE HEAD OPTIONS TRACE CONNECT HTTP', extra: [{ match: '^###.*$', token: 'type' }], mid: [{ match: '^[A-Za-z][A-Za-z0-9-]*(?=:)', token: 'property' }, { match: '\\{\\{[^}]+\\}\\}', token: 'macro' }, { match: 'https?://[^\\s]+', token: 'string' }, { match: '^@[A-Za-z_]+(?=\\s*=)', token: 'constant' }],
    snippets: snippets(
      S('GET', 'get', 'A GET request', 'GET ${1:https://example.com/api} HTTP/1.1', 'Accept: application/json'),
      S('POST JSON', 'post', 'A POST with JSON', 'POST ${1:https://example.com/api} HTTP/1.1', 'Content-Type: application/json', '', '{', '\t"${2:key}": "${3:value}"', '}'),
      S('Bearer auth', 'auth', 'An Authorization header', 'Authorization: Bearer ${1:token}'),
      S('Separator', 'sep', 'Separate requests', '###'),
    ),
  },
];
