/* Lightbox Integration, GPL-2.0. Original integration by Karim Ratib.
 * Updated 2026-10-09 for the sergiodevelop78 fork, based on its tested fix.
 */
(function ($) {
  'use strict';

  $(function () {
    var config = document.getElementById('mantis-lightbox-config');
    if (!config || !window.lightbox) {
      return;
    }
    var previewEnabled = config.getAttribute('data-preview') === '1';
    var linkEnabled = config.getAttribute('data-link') === '1';

    // Attachment names are untrusted text, never HTML captions.
    window.lightbox.option({ sanitizeTitle: true });

    function applyLightbox() {
      var attachments = Object.create(null);
      // Rebuild only our registrations, including after AJAX replacements/removals.
      $('a[data-mantis-lightbox-trigger]').removeAttr('data-lightbox data-title data-mantis-lightbox-trigger')
        .removeData('mantisLightboxEntry');
      $('.bug-attach-tags .well a[href], #bugnotes .well a[href]').each(function () {
        var url;
        try {
          url = new URL(this.href, window.location.href);
        } catch (error) {
          return;
        }
        if (url.origin !== window.location.origin ||
            !/\/file_download\.php$/.test(url.pathname) ||
            url.searchParams.get('type') !== 'bug' ||
            !/^\d+$/.test(url.searchParams.get('file_id') || '')) {
          return;
        }

        var $link = $(this);
        var $image = $link.find('img');
        var isPreview = $link.closest('.bug-attachment-preview-image').length > 0 &&
          $image.length > 0;
        var filename = isPreview ? ($image.attr('alt') || '') : $link.text().trim();
        if ((isPreview && previewEnabled) ||
            (!isPreview && linkEnabled && /\.(png|jpe?g|gif|webp)$/i.test(filename))) {
          var key = url.pathname + ':' + url.searchParams.get('file_id').replace(/^0+(?=\d)/, '');
          var entry = attachments[key];
          if (!entry) {
            entry = this;
            attachments[key] = entry;
            $link.attr('data-lightbox', 'mantis-attachments');
          }
          $link.attr('data-mantis-lightbox-trigger', '1');
          $link.data('mantisLightboxEntry', entry);
          $link.attr('data-title', filename);
        }
      });
    }

    applyLightbox();
    // Alternate headers and previews open the single album entry for their file.
    $('body').on('click.mantisLightbox', 'a[data-mantis-lightbox-trigger]', function (event) {
      if ($(this).attr('data-lightbox')) {
        return; // The canonical entry uses Lightbox2's normal delegated handler.
      }
      event.preventDefault();
      window.lightbox.start($($(this).data('mantisLightboxEntry')));
      window.lightbox.$triggerElement = $(this);
      return false;
    });
    // Retain support for attachments inserted by jQuery AJAX integrations.
    $(document).on('ajaxComplete.mantisLightbox', applyLightbox);
  });
})(jQuery);
