# PAPER. – academic subject navigation

PAPER. is a static site built with HTML, CSS, and inline JavaScript. It has one home page and five subjects, each with six module pages. It has no framework, backend, build step, or external JavaScript files.

## Run locally

Serve the project root with a static server, for example `python -m http.server 8000`, then open `http://localhost:8000`. A server is required because the router fetches subject configuration and module content from HTML files.

## Structure

- `index.html`: site shell, inline theme toggle, hash router, and shared page rendering.
- `style.css`: shared notebook styling, responsive layout, theme variables, and reusable module components.
- `subs/<ID>.html`: subject-owned JSON configuration and a simple direct-access fallback link. The JSON is read by the router; it is not executable JavaScript.
- `subs/mods/<ID> mods/`: that subject's module pages and stylesheet.
  - `assets/style.css`: optional subject-specific overrides; shared components are defined in the root stylesheet.
  - `M1.html`–`M6.html`: module content. M1–M4 retain their content; M5–M6 are placeholders.

The only subjects are SE, CN, AISC, DWM, and WMC. Each subject defines exactly six modules in its own HTML configuration block.

## How it works

The JavaScript is inline in the HTML. The root page renders the home screen, reads the selected subject's JSON configuration from `subs/<ID>.html`, and loads that subject's stylesheet. For module routes, it fetches the corresponding module HTML and inserts its `#module-content` section. Scripts inside fetched module content are not executed; add interactive behavior to the inline router in `index.html` if needed.

Routes use short hashes such as `#/`, `#/SE`, and `#/SE/M1`. Navigation updates the hash, so browser back and forward work without a full page reload. Physical filenames and folder paths stay out of the address bar.

## Add or change a module

Edit the selected subject's JSON block in `subs/<ID>.html` and add the matching `M1.html`–`M6.html` file under that subject's module folder. Use the same module ID and filename in both places. Put lesson markup inside `<section id="module-content">`. Keep references to images or other module files relative to the module HTML file.

## Reusable module template

`MODULE_TEMPLATE.html` is a router-compatible starting point for new module content. Duplicate it into a subject module folder, replace its placeholders with the correct IDs and original academic material, remove optional unused sections, and add the module to that subject JSON block. It contains no generated lesson content or navigation/theme JavaScript.

## Change a subject

Edit its JSON block in `subs/<ID>.html`. Subject display names for the home cards are also listed in the small `subjects` map in `index.html`. Keep the set of five supported IDs in sync in both places. Subject-specific visual changes belong in that subject's `assets/style.css`.

## GitHub Pages

Publish the project root as the Pages source. The router resolves paths relative to the URL of `index.html`, including repository subpaths. Directory names with spaces are URL-encoded one segment at a time (`SE mods` becomes `SE%20mods`). Avoid root-relative asset paths and machine-specific paths.

