# Lightbox Integration for MantisBT

Lightbox **1.1.0** is a maintained fork of the original Lightbox Integration plugin
by Karim Ratib, with contributions by Kaue Santoja. It opens image attachments in
[Lightbox2](https://github.com/lokesh/lightbox2), without changing the MantisBT core.

## Compatibility

- Target: MantisBT **2.28.x**, specifically the 2.28.4 attachment markup.
- Deployment target: Debian 13, Apache and PHP 8.4.
- Bundled Lightbox2: **2.12.0**, using MantisBT's existing jQuery.
- No extra jQuery, CDN, npm or build step is required for installation.
- The historical MantisCore 2.0.0 minimum remains in the plugin metadata; this is
  not a claim that every older MantisBT release has been tested.
- See [validation status](docs/TESTING.md) before deploying this candidate.

## Installation and upgrade

1. Back up the existing plugin directory.
2. Place this repository's contents in `plugins/Lightbox` in your MantisBT installation.
3. Install or enable **Lightbox Integration** in **Manage → Manage Plugins**.
4. Configure the plugin's independent preview and image-link preferences.
5. Refresh the issue page, bypassing cached JavaScript and CSS if necessary.

For an upgrade, replace the plugin files while keeping the directory name
`Lightbox`. Existing preferences remain in MantisBT's database; no database
migration is required. Test in a separate MantisBT installation before production.

## Behavior

On `view.php`, the plugin recognizes same-origin `file_download.php` links for bug
attachments. Filename links ending in PNG, JPG, JPEG, GIF or WebP are eligible,
case-insensitively. Actual image previews are eligible independently of filename
links. File icons, unrelated links and non-image filename links keep their normal
behavior. Existing attachment permissions and download URLs are unchanged.

The integration retains the fork's tested filename detection and re-applies it
after jQuery AJAX requests. Repeated scans are idempotent. Captions are rendered as
plain text, including names containing HTML-like characters.

Lightbox2 uses one `mantis-attachments` album with one entry per attachment ID
and download endpoint. Expanded/collapsed filename links and previews open the
same entry, respecting their independent preferences. Closing restores focus to
the link that was clicked. Repeated AJAX scans rebuild the unique entries.
DOM changes made without jQuery AJAX are not automatically observed.

## Security and CSP

Configuration is carried by `data-preview` and `data-link` attributes on an
external script. The plugin no longer creates inline JavaScript, a nonce or a
CSP header hook. It does not add `unsafe-inline` or `unsafe-eval` to script policy.

MantisBT 2.28.4 already allows same-origin scripts/images, `data:` images and
inline styles. A small inline style block supplies image URLs through
`plugin_file.php`; the library also sets runtime inline styles. A stricter custom
style policy may therefore require separate integration work. See
[the audit](docs/AUDIT.md).

## Development and release

Work on `master`. See [testing](docs/TESTING.md), [release steps](docs/RELEASING.md)
and [the changelog](CHANGELOG.md). Development test dependencies are optional and
are not used by the installed plugin.

## Credits and licenses

- Original plugin: **Karim Ratib**.
- Original contributor: **Kaue Santoja** (see [CONTRIBUTORS](CONTRIBUTORS)).
- Maintained fork and tested attachment fix: **sergiodevelop78**.
- Lightbox2: **Lokesh Dhakar**, under the [MIT license](files/lightbox/LICENSE).
- Plugin integration: **GNU GPL version 2**, preserving the original notices and
  [LICENSE](LICENSE).

Readable Lightbox2 JavaScript/CSS is included alongside distribution assets.
Vendored files come from upstream tag `v2.12.0`; attribution banners have been
retained/restored in minified assets. The obsolete 2.9.0 source map is removed.
