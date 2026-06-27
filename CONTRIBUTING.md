# Contributing to ContainerGate

First off, thank you for taking the time to contribute! 🎉 ContainerGate is a
community-driven Firefox extension, and contributions of all kinds are welcome:
bug reports, feature ideas, translations, documentation, and code.

This document describes how to get set up and the rules we follow so that
contributions can be reviewed and merged smoothly.

---

## Table of contents

- [Code of Conduct](#code-of-conduct)
- [Ways to contribute](#ways-to-contribute)
- [Development setup](#development-setup)
- [Running the extension locally](#running-the-extension-locally)
- [Project structure](#project-structure)
- [Translations (i18n)](#translations-i18n)
- [Branching & commit style](#branching--commit-style)
- [Pull request process](#pull-request-process)
- [Coding guidelines](#coding-guidelines)
- [Reporting bugs](#reporting-bugs)
- [Suggesting features](#suggesting-features)
- [License](#license)

---

## Code of Conduct

This project and everyone participating in it is governed by our
[Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to
uphold it. Please report unacceptable behaviour as described there.

---

## Ways to contribute

- **🐛 Report a bug** — open an issue using the bug report template.
- **✨ Suggest a feature** — open an issue using the feature request template.
- **🌐 Add or improve a translation** — see [Translations](#translations-i18n).
- **📖 Improve documentation** — fixes to the README or these docs are very welcome.
- **💻 Submit code** — pick an open issue (or open one first to discuss) and send a pull request.

If you plan to work on something non-trivial, please open an issue first so we
can agree on the approach before you invest time in a PR.

---

## Development setup

You only need **Firefox** (Developer Edition or Nightly recommended for
unsigned installs) and `git`. No build step or `npm install` is required — the
extension is plain JavaScript, HTML and CSS.

```bash
git clone https://github.com/AxelTinoco/ContainerGate.git
cd ContainerGate
```

You will also want the **Firefox Multi-Account Containers** extension installed,
since ContainerGate relies on containers being available.

### Optional: web-ext

[`web-ext`](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/)
is Mozilla's official CLI for developing and linting extensions. It is optional
but recommended:

```bash
npm install --global web-ext

# Launch a temporary Firefox profile with the extension loaded and auto-reload
web-ext run

# Lint the extension against AMO validation rules
web-ext lint

# Build a distributable .zip
web-ext build
```

---

## Running the extension locally

Without `web-ext`, load it as a temporary add-on:

1. Open Firefox and navigate to `about:debugging`
2. Click **"This Firefox"**
3. Click **"Load Temporary Add-on…"**
4. Select the `manifest.json` file at the root of the project

The extension stays active until you close Firefox. Reload it from the same
`about:debugging` page after making changes.

To test the full flow, open a URL from an **external application** (Slack, your
email client, a terminal) so the extension can detect that the tab has no
opener and show the container selection modal.

---

## Project structure

```
ContainerGate/
├── manifest.json          # Extension configuration (Manifest V2)
├── background.js          # Core interception logic
├── i18n.js                # i18n helper used by injected pages
├── _locales/              # Translations (en, es_MX, pt, ru, sk, …)
│   └── <locale>/messages.json
├── interstitial/          # Container selection screen
│   ├── interstitial.html
│   ├── interstitial.css
│   ├── interstitial.js
│   └── assets/
├── popup/                 # Toolbar panel (whitelist + rules management)
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
└── icons/                 # Extension icons (16/32/48/96)
```

---

## Translations (i18n)

ContainerGate uses the standard [WebExtension i18n](https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/Internationalization)
system. Strings live in `_locales/<locale>/messages.json`.

To add a new language:

1. Copy `_locales/en/messages.json` to `_locales/<your-locale>/messages.json`
   (use the correct [locale code](https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/Internationalization#locales), e.g. `fr`, `de`, `ja`).
2. Translate the `message` values only — **do not** change the keys or the
   `description` fields, and keep any `$PLACEHOLDERS$` intact.
3. Test by setting Firefox to that language and reloading the extension.

When you add a user-facing string in code, always add it to
`_locales/en/messages.json` (the default locale) and reference it via the i18n
API rather than hard-coding text.

---

## Branching & commit style

- Create a feature branch off `main`: `git checkout -b feat/short-description`
- Keep `main` clean — never commit build artifacts (`*.zip`, `*.xpi`). These
  are ignored via `.gitignore`.

This project follows **[Conventional Commits](https://www.conventionalcommits.org/)**,
matching the existing history:

```
feat(ui): implement glass style in container
fix(url): fix address bar to show pop up
feat(lang): add more langs
docs(readme): update project structure
```

Format: `type(scope): short summary`

Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `chore`, `i18n`.

---

## Pull request process

1. Fork the repository and create your branch from `main`.
2. Make your changes following the [coding guidelines](#coding-guidelines).
3. Test the extension manually in Firefox (see above). If you have `web-ext`,
   run `web-ext lint` and make sure there are no errors.
4. Update documentation (`README.md`, this file) if your change affects
   behaviour, permissions, or structure.
5. Add an entry to `CHANGELOG.md` under the "Unreleased" section.
6. Open a pull request using the PR template and link any related issue
   (`Closes #123`).
7. A maintainer will review. Please be responsive to feedback — small,
   focused PRs are reviewed much faster than large ones.

---

## Coding guidelines

- **Vanilla JS** — no frameworks or build step. Keep dependencies at zero unless
  there is a strong reason.
- Match the existing code style (indentation, naming, quotes) in the file you
  are editing.
- Keep functions small and focused; prefer clear names over comments, but
  comment non-obvious browser/WebExtension quirks.
- **Permissions:** do not add new `manifest.json` permissions unless strictly
  necessary, and document any new permission in the README table and your PR.
- Never log or transmit user browsing data. ContainerGate is privacy-first: all
  data (whitelist, rules) stays in local `storage`.
- Test against the **minimum supported Firefox** version declared in
  `manifest.json` (`strict_min_version`).

---

## Reporting bugs

Open an issue with the **Bug report** template and include:

- Firefox version and OS
- ContainerGate version (from `manifest.json` / `about:addons`)
- Whether Multi-Account Containers is installed
- Steps to reproduce, expected vs. actual behaviour
- Any errors from the **Browser Console** (`Ctrl+Shift+J`) or the extension's
  background script console in `about:debugging`

---

## Suggesting features

Open an issue with the **Feature request** template. Describe the problem you
are trying to solve, not just the solution — this helps us find the best fit
for the extension.

---

## License

By contributing, you agree that your contributions will be licensed under the
[Mozilla Public License 2.0](LICENSE), the same license that covers the project.
