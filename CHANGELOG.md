# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Open-source community files: `LICENSE` (MPL-2.0), `CONTRIBUTING.md`,
  `CODE_OF_CONDUCT.md`, `SECURITY.md`, GitHub issue/PR templates, and `.gitignore`.

## [1.0.0] - 2026-06-24

### Added
- Interception of externally opened URLs (from Slack, email, terminals, etc.).
- Container selection modal showing all available Firefox containers.
- Whitelist of domains that open directly without prompting.
- Per-domain rules that remember the chosen container automatically.
- Option to open a URL without any container.
- Toolbar popup to manage rules and the whitelist.
- Glass-style UI for the container selection screen.
- Localization for English, Spanish (es_MX), Portuguese, Russian, and Slovak.

[Unreleased]: https://github.com/AxelTinoco/ContainerGate/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/AxelTinoco/ContainerGate/releases/tag/v1.0.0
