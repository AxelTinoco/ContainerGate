# Security Policy

ContainerGate is a privacy-focused Firefox extension that intercepts external
navigation and can read container/cookie information. We take security and
privacy seriously.

## Supported Versions

Only the latest released version receives security fixes.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Privacy posture

- All user data (whitelist and per-domain rules) is stored **locally** via the
  WebExtension `storage` API.
- ContainerGate does **not** send browsing data, URLs, or any telemetry to any
  remote server.
- The extension requests `<all_urls>` and `webRequest` permissions solely to
  intercept externally opened navigation; see the README for the full
  permission rationale.

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, report them privately:

- Preferred: use GitHub's **[Private vulnerability reporting](https://docs.github.com/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)**
  (Security tab → "Report a vulnerability").
- Or email **axeltm8@gmail.com** with the details.

Please include:

- A description of the vulnerability and its impact
- Steps to reproduce or a proof of concept
- Affected version(s) and Firefox version

### What to expect

- We aim to acknowledge your report within **72 hours**.
- We will keep you informed of the progress toward a fix.
- We ask that you give us a reasonable amount of time to release a fix before
  any public disclosure. We will credit you in the release notes unless you
  prefer to remain anonymous.

Thank you for helping keep ContainerGate and its users safe.
