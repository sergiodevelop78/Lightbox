# Audit for 1.1.0

Audit date: 2026-10-09 (America/Lima).

## Reference versions

- Fork `master` baseline: `f8220ba689378054ca433f718d909dc41a803def`.
- MantisBT `release-2.28.4`: `ceb74c8056753e0d4089af95bde794e47fa2ef53`.
- Lightbox2 latest stable, verified through GitHub's latest release endpoint:
  [`v2.12.0`](https://github.com/lokesh/lightbox2/releases/tag/v2.12.0), published
  2026-02-28; commit `fc01875e2175926c048bf3eb2a6b89a4b545f392`.
- User supplied a local `files/Lightbox.js` diff already verified in production.
  Its filename matching, preferences and AJAX refresh form the integration base.

## Original repository review

| Area | Finding | Candidate change |
| --- | --- | --- |
| `Lightbox.php` | Dynamic nonce property and inline global variables | Remove nonce and pass integer preferences through script data attributes |
| `files/Lightbox.js` | Original positional selector depends on old note markup | Use filename detection and actual preview containers |
| Captions | Lightbox2 can interpret titles as HTML by default | Enable `sanitizeTitle` before eligible links are marked |
| Download URLs | Extension is absent from `file_download.php` | Use rendered filename; validate origin, endpoint, numeric ID and bug type |
| CSP | Plugin adds script nonce and `img-src data:` | Remove header hook; rely on MantisBT's existing policy |
| Configuration pages | CSRF validation and management access checks exist | Preserve both pages and their configuration keys |
| Translation files | Original English/Brazilian Portuguese strings and notices | Preserve existing translations |
| Vendor assets | Lightbox2 2.9.0, no separate MIT license file | Update to 2.12.0; include MIT license and readable sources |
| README/credits | Very limited setup instructions | English compatibility, upgrade, testing and release documentation |

No MantisBT core changes are included. The library's jquery-free distribution is
used; MantisBT 2.28.4 supplies jQuery 2.2.4. Upstream's npm dependency is jQuery
3.7.1, so compatibility must be checked explicitly instead of assumed.

## CSP scope

MantisBT 2.28.4 `core/http_api.php::http_security_headers()` already supplies
`script-src 'self'`, `style-src 'self' 'unsafe-inline'` and `img-src 'self' data:`.
The plugin's former `data:` addition was redundant. Its nonce property was not
declared and would be deprecated under PHP 8.4.

The candidate adds no CSP directives. Image overrides retain `plugin_file()` URLs
because relative image URLs in a stylesheet served through `plugin_file.php` do
not resolve to the vendor image directory. Inline CSS remains necessary for these
overrides, and Lightbox2 uses inline styles during animation. Compatibility is
with the standard MantisBT policy, not arbitrary strict custom policies.

## Library update decision

2.12.0 contains image load error handling, navigation race fixes, focus restoration
and focus trapping, corrected navigation selectors and safer album selector
handling. These justify evaluating the update. It also changes overlay positioning
to fixed positioning, so visual/scroll behavior must be checked in a browser.

The update remains a candidate until the browser and PHP 8.4/MantisBT integration
checks in `TESTING.md` pass. A DOM test alone does not validate layout or CSP.
