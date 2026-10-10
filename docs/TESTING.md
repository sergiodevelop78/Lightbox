# Testing 1.1.0

## Validation completed in development (2026-10-09)

MantisBT's `print_bug_attachment()` renders the filename header twice when a
preview exists; `print_bug_attachment_preview_image()` adds the third link.
The integration now assigns `data-lightbox` to one eligible link per download
endpoint and attachment ID. Other eligible links open that entry via an external
JavaScript handler. Lightbox2 itself, CSP configuration and download URLs are unchanged.

- `node tests/duplicates.cjs`, `node tests/dom.cjs` and `node tests/browser.cjs`
  passed. All four combinations of the independent preview and filename-link
  preferences passed, including initial page setup and jQuery AJAX refreshes.
- The suites cover duplicate-link reduction to one album entry per attachment,
  alternate filename/preview triggers, gallery counters, ArrowRight/ArrowLeft,
  Escape and focus restoration. They also cover plain-text captions for
  HTML-like filenames, CSP enforcement with no violations, and failed-image
  handling.
- JavaScript syntax checks, PHP 8.4 syntax checks and `git diff --check` passed.
- Manual checks on MantisBT 2.28.4 in Firefox passed for JPG, PNG and WebP. A
  three-image gallery opened without duplicate entries, and the Firefox console
  had no errors or CSP violations.

### IDM Integration Module observation

During Firefox testing, IDM Integration Module intercepted requests to
`file_download.php`. With IDM disabled, Lightbox displayed the images correctly,
including WebP. This was an observed interference with an external module; it is
not a confirmed defect in Lightbox Integration.

These validations were performed in development. They do not represent a
production deployment or validation of every MantisBT version and configuration.

## Reproduce automated tests

The dependency-free regression runs from the plugin root:

```sh
node tests/duplicates.cjs
```

Install optional test tools in a separate development directory:

```sh
npm install --prefix /tmp/lightbox-test-tools jsdom@26.1.0 playwright@1.62.1
export NODE_PATH=/tmp/lightbox-test-tools/node_modules
export MANTISBT_SOURCE=/path/to/mantisbt-2.28.4-source
node tests/dom.cjs
node /tmp/lightbox-test-tools/node_modules/playwright/cli.js install chromium
node tests/browser.cjs
```

The browser test uses a local HTTP fixture with the standard MantisBT CSP and
its exact jQuery version. It does not require a MantisBT database. It exercises
preferences, AJAX, real image opening, navigation, Escape, focus restoration,
plain-text captions and a failed image. It does not emulate all production
download permissions and responses.

PHP syntax checks in the target environment:

```sh
php -v
php -l Lightbox.php
php -l pages/config.php
php -l pages/config_page.php
php -l lang/strings_english.txt
php -l lang/strings_portuguese_brazil.txt
```

## MantisBT 2.28.4 / PHP 8.4 checklist

Use a separate staging installation; production deployment needs explicit approval.

- Verify plugin installation, version and configuration save with CSRF protection.
- Test ON/ON, ON/OFF, OFF/ON and OFF/OFF for filename links and previews.
- Test PNG, JPG, JPEG, GIF and WebP, mixed-case extensions and names with spaces.
- Test attachments in the ticket and notes, expanded/collapsed and without previews.
- Verify icons, PDFs, text, audio/video, deletion and restricted attachments.
- Check normal/large images, scrolled pages, repeated opening/closing, next/previous,
  Escape, Tab focus trap and focus restoration, Firefox and Chromium.
- Verify names with HTML-like text do not create HTML elements or execute scripts.
- Inspect console/network for errors and CSP violations; verify all four plugin
  images load via `plugin_file.php` and download responses display correctly.
- Check an inaccessible/deleted image exits its loading state.
- Check PHP/Apache logs for warnings, including dynamic-property deprecations.
- Verify a non-issue page does not receive Lightbox resources.
- Confirm stored preferences survive the upgrade and rollback.
