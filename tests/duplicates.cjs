// Dependency-free integration regression. The DOM/browser suites cover real jQuery.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('files/Lightbox.js', 'utf8');
function run(preview, link) {
  let anchors = [];
  const handlers = {};
  const document = { getElementById: () => ({ getAttribute: n => String(n === 'data-preview' ? preview : link) }) };
  const body = {};
  function anchor(id, file, name, image = false, href) {
    const a = { id, href: new URL(href || `file_download.php?file_id=${file}&type=bug`, 'https://mantis.test/view.php').href,
      attrs: {}, data: {}, text: image ? '' : name, image: image ? { attrs: { alt: name } } : null };
    a.attrs.href = a.href;
    anchors.push(a);
    return a;
  }
  function $(value) {
    if (typeof value === 'function') { value(); return; }
    let items;
    if (value === 'body') items = [body];
    else if (value === 'a[data-mantis-lightbox-trigger]') items = anchors.filter(a => a.attrs['data-mantis-lightbox-trigger']);
    else if (typeof value === 'string') { assert.equal(value, '.bug-attach-tags .well a[href], #bugnotes .well a[href]'); items = anchors; }
    else items = [value];
    const q = { 0: items[0], length: items.length,
      each(fn) { items.forEach(a => fn.call(a)); return q; },
      attr(n, v) { if (v === undefined) return items[0]?.attrs[n]; items.forEach(a => a.attrs[n] = v); return q; },
      removeAttr(ns) { items.forEach(a => ns.split(' ').forEach(n => delete a.attrs[n])); return q; },
      data(n, v) { if (v === undefined) return items[0]?.data[n]; items.forEach(a => a.data[n] = v); return q; },
      removeData(n) { items.forEach(a => delete a.data[n]); return q; },
      find(n) { assert.equal(n, 'img'); return items[0].image ? $(items[0].image) : { length: 0 }; },
      closest(n) { assert.equal(n, '.bug-attachment-preview-image'); return { length: items[0].image ? 1 : 0 }; },
      text() { return items[0].text; },
      on(event, selector, fn) { handlers[event] = fn || selector; return q; }
    };
    return q;
  }
  const lightbox = { option(o) { this.options = o; }, start(q) {
    this.album = anchors.filter(a => a.attrs['data-lightbox']).map(a => a.href);
    this.currentImageIndex = this.album.indexOf(q[0].href);
    this.$triggerElement = q;
  } };
  const window = { location: new URL('https://mantis.test/view.php'), lightbox };
  for (const file of [1, 2]) {
    anchor(`name${file}`, file, file === 1 ? 'one.PNG' : 'two.jpg');
    anchor(`preview${file}`, file, 'preview', true);
    anchor(`collapsed${file}`, file, file === 1 ? 'one.PNG' : 'two.jpg', false, `file_download.php?type=bug&file_id=0${file}`);
    anchor(`icon${file}`, file, '');
  }
  anchor('pdf', 3, 'doc.pdf');
  anchor('external', 4, 'external.png', false, 'https://other.test/file_download.php?file_id=4&type=bug');
  vm.runInNewContext(source, { jQuery: $, document, window, URL });
  assert.equal(lightbox.options.sanitizeTitle, true);
  function check(count) {
    assert.equal(anchors.filter(a => a.attrs['data-lightbox']).length, count);
    for (const a of anchors) {
      const enabled = a.id.startsWith('name') || a.id.startsWith('collapsed') ? link : a.id.startsWith('preview') ? preview : false;
      assert.equal(!!a.attrs['data-mantis-lightbox-trigger'], !!enabled, a.id);
      if (!enabled) continue;
      if (a.attrs['data-lightbox']) lightbox.start($(a));
      else {
        let prevented = false;
        assert.equal(handlers['click.mantisLightbox'].call(a, { preventDefault() { prevented = true; } }), false);
        assert.equal(prevented, true);
      }
      assert.equal(lightbox.album.length, count);
      assert.equal(lightbox.currentImageIndex, Number(a.id.match(/\d+$/)[0]) - 1);
      assert.equal(lightbox.$triggerElement[0], a);
    }
  }
  check(preview || link ? 2 : 0);
  handlers['ajaxComplete.mantisLightbox']();
  handlers['ajaxComplete.mantisLightbox']();
  check(preview || link ? 2 : 0);
  // Removing a canonical header must promote a surviving trigger on rescan.
  anchors = anchors.filter(a => !a.id.startsWith('name'));
  handlers['ajaxComplete.mantisLightbox']();
  check(preview || link ? 2 : 0);
  // A new eligible attachment appears exactly once after AJAX.
  anchor('name3', 3, 'three.webp');
  anchor('collapsed3', 3, 'three.webp');
  handlers['ajaxComplete.mantisLightbox']();
  check(link ? 3 : preview ? 2 : 0);
  console.log(`PASS preview=${preview} link=${link}: two files/three triggers, distinct IDs, URL variants, AJAX, removal, focus`);
}
for (const preview of [0, 1]) for (const link of [0, 1]) run(preview, link);
