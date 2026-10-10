// DOM regression tests; these do not replace the browser/integration checklist.
const { JSDOM } = require('jsdom');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
if (!process.env.MANTISBT_SOURCE) throw new Error('Set MANTISBT_SOURCE to MantisBT 2.28.4 source');
const jquery = fs.readFileSync(path.join(process.env.MANTISBT_SOURCE, 'js/jquery-2.2.4.min.js'), 'utf8');
const lightbox = fs.readFileSync(path.join(root, 'files/lightbox/js/lightbox.min.js'), 'utf8');
const integration = fs.readFileSync(path.join(root, 'files/Lightbox.js'), 'utf8');
const sleep = ms => new Promise(resolve=>setTimeout(resolve,ms));
(async () => {
  for (const preview of [0,1]) for (const link of [0,1]) {
    const dom = new JSDOM(`<script id="mantis-lightbox-config" data-preview="${preview}" data-link="${link}"></script><div class="bug-attach-tags"><div class="well well-xs"><a id="icon" href="file_download.php?file_id=1&type=bug"><i></i></a><a id="filename" href="file_download.php?file_id=1&type=bug">photo.PNG</a><div class="bug-attachment-preview-image"><a id="preview" href="file_download.php?file_id=1&type=bug"><img alt="photo.PNG"></a></div><a id="collapsed" href="file_download.php?type=bug&file_id=1">photo.PNG</a><a id="pdf" href="file_download.php?file_id=2&type=bug">notes.pdf</a><a id="external" href="https://example.com/file_download.php?file_id=1&type=bug">external.png</a><a id="fake" href="fake_file_download.php?file_id=1&type=bug">fake.png</a><a id="project" href="file_download.php?file_id=1&type=doc">project.png</a><a id="badid" href="file_download.php?file_id=x&type=bug">invalid.png</a></div></div><div id="bugnotes"><div class="well well-xs"><a id="note" href="file_download.php?file_id=3&type=bug">note.jpg</a></div></div><a id="outside" href="file_download.php?file_id=1&type=bug">outside.png</a>`, {url:'https://mantis.example/mantis/view.php?id=1',runScripts:'outside-only',pretendToBeVisual:true});
    const w=dom.window;
    w.eval(jquery); w.eval(lightbox); w.eval(integration);
    await sleep(25);
    const $=w.jQuery;
    assert.equal($.fn.jquery,'2.2.4');
    assert.equal(w.lightbox.options.sanitizeTitle,true);
    assert.equal($('#filename').attr('data-lightbox'),link?'mantis-attachments':undefined);
    assert.equal($('#preview').attr('data-mantis-lightbox-trigger'),preview?'1':undefined);
    assert.equal($('#collapsed').attr('data-mantis-lightbox-trigger'),link?'1':undefined);
    assert.equal($('#note').attr('data-lightbox'),link?'mantis-attachments':undefined);
    for(const id of ['icon','pdf','external','fake','project','badid','outside']) assert.equal($('#'+id).attr('data-lightbox'),undefined);
    let nextId = 4;
    for(const [id,name] of [['jpeg','scan.JPEG'],['gif','animated.gif'],['webp','modern.webp'],['xss','<img src=x onerror=window.pwned=1>.png'],['suffix','photo.png.exe']]) {
      const a=w.document.createElement('a'); a.id=id; a.href='file_download.php?file_id=' + nextId++ + '&type=bug'; a.textContent=name;
      w.document.querySelector('#bugnotes .well').append(a);
    }
    $(w.document).trigger('ajaxComplete'); $(w.document).trigger('ajaxComplete');
    for(const id of ['jpeg','gif','webp','xss']) assert.equal($('#'+id).attr('data-lightbox'),link?'mantis-attachments':undefined);
    assert.equal($('#suffix').attr('data-lightbox'),undefined);
    assert.equal($('[data-lightbox]').length,link?6:(preview?1:0));
    if (preview || link) {
      const originalChangeImage = w.lightbox.changeImage;
      w.lightbox.changeImage = index => { w.lightbox.currentImageIndex = index; };
      for (const id of [link && 'filename', link && 'collapsed', preview && 'preview'].filter(Boolean)) {
        $('#' + id).trigger('click');
        assert.equal(w.lightbox.album.length, link ? 6 : 1);
        assert.equal(w.lightbox.currentImageIndex, 0);
        assert.equal(w.lightbox.$triggerElement[0].id, id);
      }
      w.lightbox.changeImage = originalChangeImage;
    }
    w.lightbox.album=[{link:'file_download.php?file_id=4&type=bug',title:'<img src=x onerror=window.pwned=1>.png'}];
    w.lightbox.currentImageIndex=0;
    $.fx.off=true;
    w.lightbox.updateDetails();
    assert.equal($('.lb-caption').text(),'<img src=x onerror=window.pwned=1>.png');
    assert.equal($('.lb-caption img').length,0);
    assert.equal(w.pwned,undefined);
    dom.window.close();
    console.log(`PASS preview=${preview} link=${link}: selectors, types, AJAX, repeat, sanitized caption`);
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
