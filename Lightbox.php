<?php

/**
 * Lightbox Integration
 * Copyright (C) Karim Ratib (karim@meedan.com)
 *
 * Lightbox Integration is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License 2
 * as published by the Free Software Foundation.
 *
 * Lightbox Integration is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Lightbox Integration; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA
 * or see http://www.gnu.org/licenses/.
 */
class LightboxPlugin extends MantisPlugin {

    function register() {
        $this->name = plugin_lang_get('title');
        $this->description = plugin_lang_get('description');
        $this->version = '1.1.0';
        $this->page = 'config_page';
        $this->requires = array(
            'MantisCore' => '2.0.0',
        );
        $this->author = 'Karim Ratib';
        $this->contact = 'karim@meedan.com';
        $this->url = 'https://github.com/sergiodevelop78/Lightbox';
    }

    /**
     * Default plugin configuration.
     */
    function config() {
        return array(
            'display_on_img_preview' => ON,
            'display_on_img_link' => ON,
        );
    }

    function hooks() {
        return array(
            'EVENT_LAYOUT_RESOURCES' => 'add_lightbox',
        );
    }

    // Updated 2026-10-09: external configuration and Lightbox2 2.12.0.
    function add_lightbox($event) {
        $currentUrl = explode('/', $_SERVER['PHP_SELF']);
        if (end($currentUrl) !== 'view.php') return;

        $lightbox_display_on_img_preview = (int) (ON == plugin_config_get('display_on_img_preview'));
        $lightbox_display_on_img_link = (int) (ON == plugin_config_get('display_on_img_link'));
        $lightboxJs = plugin_file('lightbox/js/lightbox.min.js');
        $lightboxCss = plugin_file('lightbox/css/lightbox.min.css');
        $lightboxMantis = plugin_file('Lightbox.js');
        $images = [
          'prev' => plugin_file('lightbox/img/prev.png'),
          'next' => plugin_file('lightbox/img/next.png'),
          'close' => plugin_file('lightbox/img/close.png'),
          'loading' => plugin_file('lightbox/img/loading.gif'),
        ];

        return <<<LIGHTBOX
<link href="{$lightboxCss}" rel="stylesheet">
<script src="{$lightboxJs}"></script>
<script id="mantis-lightbox-config" src="{$lightboxMantis}"
 data-preview="{$lightbox_display_on_img_preview}" data-link="{$lightbox_display_on_img_link}"></script>
<style>
.lb-nav a.lb-prev {
  background-image: url({$images['prev']});
}
.lb-nav a.lb-next {
  background-image: url({$images['next']});
}
.lb-data .lb-close {
  background-image: url({$images['close']});
}
.lb-cancel {
  background-image: url({$images['loading']});
}
</style>
LIGHTBOX;
    }

}
