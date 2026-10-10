# Changelog

## 1.1.0 — release candidate

- Deduplicate gallery entries by attachment ID while keeping both filename
  headers and previews clickable, including focus restoration and AJAX rescans.
- Retain the fork's production-tested PNG/JPG/JPEG/GIF/WebP filename detection.
- Respect independent preview and image-link preferences, including AJAX scans.
- Restrict enhancement to same-origin bug attachment links in attachment areas.
- Treat captions as text with Lightbox2 `sanitizeTitle`.
- Update bundled Lightbox2 from 2.9.0 to 2.12.0, without bundling another jQuery.
- Replace inline script configuration with external-script data attributes.
- Remove redundant CSP additions and dynamic nonce property (PHP 8.4 deprecation).
- Include upstream readable sources and MIT license; preserve plugin GPL credits.
- Add English audit, test checklist and release documentation.

## 1.0 — original plugin

- Lightbox2 2.9.0 integration and independent preview/link preferences.
