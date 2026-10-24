<?php

// The documentation pages in resources/docs/, in reading order. `group` makes the sidebar sections.
return [
    'pages' => [
        'overview' => ['title' => 'Overview', 'group' => 'Get started', 'summary' => 'What Ferrum extensions can do and how the marketplace works.'],
        'getting-started' => ['title' => 'Your first extension', 'group' => 'Get started', 'summary' => 'Build, test, package and publish a Hello World extension in ten minutes.'],
        'anatomy' => ['title' => 'Anatomy of an extension', 'group' => 'Get started', 'summary' => 'The files in an extension and how Ferrum loads them.'],
        'manifest' => ['title' => 'Extension manifest', 'group' => 'Reference', 'summary' => 'Every field of ferrum.json.'],
        'activation-events' => ['title' => 'Activation events', 'group' => 'Reference', 'summary' => 'When Ferrum starts your extension code.'],
        'contribution-points' => ['title' => 'Contribution points', 'group' => 'Reference', 'summary' => 'Commands, keybindings, themes, icon themes, languages, snippets, settings and sidebar views.'],
        'api' => ['title' => 'JavaScript API', 'group' => 'Reference', 'summary' => 'The ferrum object your extension code uses.'],
        'permissions' => ['title' => 'Permissions and security', 'group' => 'Reference', 'summary' => 'What an extension may do and how users stay safe.'],
        'themes' => ['title' => 'Color themes', 'group' => 'Guides', 'summary' => 'Make a theme, or reuse a VS Code theme.'],
        'languages' => ['title' => 'Languages and highlighting', 'group' => 'Guides', 'summary' => 'Add a language with its own syntax colors.'],
        'snippets' => ['title' => 'Snippets', 'group' => 'Guides', 'summary' => 'Ship code snippets with tab stops.'],
        'commands' => ['title' => 'Commands and keybindings', 'group' => 'Guides', 'summary' => 'Add commands to the palette and bind keys.'],
        'webviews' => ['title' => 'Panels with HTML', 'group' => 'Guides', 'summary' => 'Show your own page inside the editor.'],
        'decorations' => ['title' => 'Decorations', 'group' => 'Guides', 'summary' => 'Paint backgrounds, underlines, gutter marks and notes on top of the text.'],
        'views' => ['title' => 'Sidebar views', 'group' => 'Guides', 'summary' => 'Add an activity bar icon with a tree or a page in the sidebar.'],
        'testing' => ['title' => 'Testing and debugging', 'group' => 'Guides', 'summary' => 'Try an extension locally before you publish.'],
        'publishing' => ['title' => 'Publishing', 'group' => 'Marketplace', 'summary' => 'Accounts, publishers, tokens, versions and the rules.'],
        'cli' => ['title' => 'The ferrum-ext tool', 'group' => 'Marketplace', 'summary' => 'Create, package and publish from the command line.'],
        'api-rest' => ['title' => 'Marketplace API', 'group' => 'Marketplace', 'summary' => 'The HTTP API the editor uses.'],
        'ai-plan' => ['title' => 'Ferrum AI', 'group' => 'Marketplace', 'summary' => 'The built-in AI plan: sign in, daily allowance, and how the server is run.'],
        'faq' => ['title' => 'FAQ and troubleshooting', 'group' => 'Marketplace', 'summary' => 'Common questions and errors.'],
    ],
];
