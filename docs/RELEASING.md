# Preparing and publishing 1.1.0

Work on `master` only. Do not overwrite the production plugin or push/publish
without the repository owner's explicit confirmation.

1. Preserve the production-tested local change in its own commit before importing
   the candidate. This makes its provenance and rollback point explicit.
2. Review the candidate diff and run `docs/TESTING.md`, including PHP 8.4 and a real
   MantisBT 2.28.4/browser check. Resolve failures before tagging.
3. Update validation status and change the changelog heading from release candidate
   to the actual release date. Commit that documentation.
4. After successful validation, create an annotated local tag:

   ```sh
   git switch master
   git status --short
   git tag -a v1.1.0 -m "Lightbox Integration 1.1.0"
   ```

5. Present commits, final diff, test results and tag target for owner review.
6. Only after confirmation, push `master` and the tag, then publish the release:

   ```sh
   git push origin master
   git push origin v1.1.0
   gh release create v1.1.0 --verify-tag --title "Lightbox 1.1.0" \
     --notes-file docs/RELEASE_NOTES.md
   ```

Never run these push/publication commands during candidate preparation.
Do not move an existing public tag to different code.
