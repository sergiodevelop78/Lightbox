# Lightbox 1.1.0

This fork updates image attachment integration for MantisBT 2.28.x, preserving the
original plugin's credits, licenses and independent preferences.

- PNG, JPG, JPEG, GIF and WebP filename links, plus actual image previews.
- AJAX refresh support based on the fork's tested attachment fix.
- Plain-text captions and stricter attachment URL selection.
- Lightbox2 2.12.0 using the existing MantisBT jQuery.
- External JavaScript configuration; no plugin nonce or CSP header additions.
- English installation, security, testing and release documentation.

Upgrade by replacing `plugins/Lightbox` after backing it up. Existing preferences
remain in the database. No MantisBT core or database migration is required.

The planned automated, browser and MantisBT 2.28.4 development validations are
complete; results and the observed IDM Integration Module interference are
recorded in `docs/TESTING.md`. These notes describe a development-validated
candidate. They do not indicate that 1.1.0 has been published or deployed to
production.
