// Run with: MANTISBT_SOURCE=/path/to/mantisbt node tests/browser.cjs
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const mantis = process.env.MANTISBT_SOURCE;
if (!mantis) throw new Error('Set MANTISBT_SOURCE to a MantisBT 2.28.4 source checkout');
// Reuse a valid, nontrivial PNG so the fixture thumbnail has a realistic hit area.
const image = fs.readFileSync(path.join(root, 'files/lightbox/img/prev.png'));
const pluginImageFiles = new Map([
  ['Lightbox/lightbox/img/prev.png', path.join(root, 'files/lightbox/img/prev.png')],
  ['Lightbox/lightbox/img/next.png', path.join(root, 'files/lightbox/img/next.png')],
  ['Lightbox/lightbox/img/close.png', path.join(root, 'files/lightbox/img/close.png')],
  ['Lightbox/lightbox/img/loading.gif', path.join(root, 'files/lightbox/img/loading.gif')],
]);
function attachment(id, name, preview = false) {
  return `<div class="well well-xs"><a id="icon${id}" href="file_download.php?file_id=${id}&type=bug"><i></i></a><a id="file${id}" href="file_download.php?file_id=${id}&type=bug">${name}</a>${preview ? `<div class="bug-attachment-preview-image"><a id="preview${id}" href="file_download.php?file_id=${id}&type=bug"><img alt="${name}" loading="lazy" style="border:0;max-height:250px" src="file_download.php?file_id=${id}&type=bug&show_inline=1"></a></div><div style="display:none"><a id="collapsed${id}" href="file_download.php?type=bug&file_id=${id}">${name}</a></div>` : ''}</div>`;
}
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'");
  if (url.pathname.endsWith('/file_download.php')) {
    if (url.searchParams.get('file_id') === '99') { res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Type', 'image/png'); res.end(image); return;
  }
  if (url.pathname === '/plugin_file.php') {
    const file = pluginImageFiles.get(url.searchParams.get('file'));
    if (!file) { res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Type', file.endsWith('.gif') ? 'image/gif' : 'image/png');
    res.end(fs.readFileSync(file));
    return;
  }
  if (url.pathname === '/ajax') { res.end(attachment(8, 'dynamic.webp')); return; }
  if (url.pathname === '/view.php') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<style>.well{padding:19px;margin-bottom:20px;background-color:#f5f5f5;border:1px solid #e3e3e3;border-radius:4px}.well-xs{padding:4px 9px;margin-bottom:10px;border-radius:3px}.bug-attachment-preview-image{margin:1em;padding:1em}.bug-attachment-preview-image img{max-width:100%}</style><link rel="stylesheet" href="/files/lightbox/css/lightbox.min.css"><style>.lb-nav a.lb-prev{background-image:url('/plugin_file.php?file=Lightbox/lightbox/img/prev.png')}.lb-nav a.lb-next{background-image:url('/plugin_file.php?file=Lightbox/lightbox/img/next.png')}.lb-data .lb-close{background-image:url('/plugin_file.php?file=Lightbox/lightbox/img/close.png')}.lb-cancel{background-image:url('/plugin_file.php?file=Lightbox/lightbox/img/loading.gif')}</style><div class="bug-attach-tags">${attachment(1, 'photo.PNG', true)}${attachment(2, 'scan.jpeg')}${attachment(3, 'anim.gif')}${attachment(4, 'modern.webp')}${attachment(5, 'notes.pdf')}${attachment(6, '&lt;img src=x onerror=window.pwned=1&gt;.png')}<div class="well"><a id="external" href="https://example.com/file_download.php?file_id=7&type=bug">other.png</a><a id="fake" href="fake_file_download.php?file_id=7&type=bug">fake.png</a></div></div><div id="bugnotes">${attachment(7, 'note.jpg')}</div><a id="outside" href="file_download.php?file_id=7&type=bug">outside.png</a><script src="/jquery.js"></script><script src="/files/lightbox/js/lightbox.min.js"></script><script id="mantis-lightbox-config" data-preview="${url.searchParams.get('preview')}" data-link="${url.searchParams.get('link')}" src="/files/Lightbox.js"></script>`); return;
  }
  let file = url.pathname === '/jquery.js' ? path.join(mantis, 'js/jquery-2.2.4.min.js') : path.join(root, url.pathname);
  // Mantis source currently uses jquery-2.2.4.min.js.
  if (!file.startsWith(root) && url.pathname !== '/jquery.js') { res.writeHead(403); res.end(); return; }
  try { res.setHeader('Content-Type', file.endsWith('.js') ? 'application/javascript' : file.endsWith('.css') ? 'text/css' : 'application/octet-stream'); res.end(fs.readFileSync(file)); }
  catch { res.writeHead(404); res.end(); }
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({headless:true});
  try {
    const page = await browser.newPage();
    const errors = [];
    const consoleErrors = [];
    const failedResponses = [];
    const wrongImageRequests = [];
    const pluginImageResponses = new Map();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') {
        consoleErrors.push({ text: message.text(), url: message.location().url });
      }
    });
    page.on('request', request => {
      if (new URL(request.url()).pathname.includes('/files/lightbox/images/')) {
        wrongImageRequests.push(request.url());
      }
    });
    page.on('response', response => {
      const url = new URL(response.url());
      if (response.status() >= 400) failedResponses.push({ status: response.status(), url: response.url() });
      const asset = url.searchParams.get('file');
      if (url.pathname === '/plugin_file.php' && pluginImageFiles.has(asset)) {
        pluginImageResponses.set(asset, {
          status: response.status(),
          contentType: response.headers()['content-type'],
        });
      }
    });
    await page.addInitScript(() => {window.cspViolations=[]; document.addEventListener('securitypolicyviolation', e=>window.cspViolations.push(e.violatedDirective));});
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const preview of [0,1]) for (const link of [0,1]) {
      await page.goto(`${base}/view.php?preview=${preview}&link=${link}`);
      await page.waitForFunction(() => window.lightbox && window.lightbox.options.sanitizeTitle);
      assert.equal(await page.locator('#preview1').getAttribute('data-mantis-lightbox-trigger'), preview ? '1' : null);
      assert.equal(await page.locator('#collapsed1').getAttribute('data-mantis-lightbox-trigger'), link ? '1' : null);
      for (const id of [1,2,3,4,6,7]) assert.equal(await page.locator(`#file${id}`).getAttribute('data-lightbox'), link ? 'mantis-attachments' : null);
      for (const id of ['file5','icon1','external','fake','outside']) assert.equal(await page.locator(`#${id}`).getAttribute('data-lightbox'), null);
      await page.evaluate(() => new Promise(resolve => jQuery.get('/ajax', html => {jQuery('#bugnotes').append(html);}).always(()=>setTimeout(resolve,0))));
      assert.equal(await page.locator('#file8').getAttribute('data-lightbox'), link ? 'mantis-attachments' : null);
      assert.deepEqual(await page.evaluate(()=>window.cspViolations), []);
      console.log(`PASS preferences preview=${preview} link=${link}, initial + AJAX`);
    }
    assert.equal(await page.evaluate(()=>jQuery.fn.jquery), '2.2.4');
    await page.evaluate(()=>lightbox.option({fadeDuration:0,imageFadeDuration:0,resizeDuration:0}));
    await page.locator('#file6').click();
    await page.waitForFunction(()=>document.querySelector('.lb-caption').textContent.includes('onerror'));
    assert.equal(await page.locator('.lb-caption img').count(),0);
    assert.equal(await page.evaluate(()=>window.pwned),undefined);
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>jQuery('#lightbox').css('display')==='none');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'file6');
    await page.locator('#preview1').click();
    await page.waitForFunction(()=>jQuery('.lb-image').is(':visible'));
    assert.equal(await page.evaluate(()=>lightbox.album.length), 7);
    assert.equal(await page.evaluate(()=>lightbox.currentImageIndex), 0);
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(()=>lightbox.currentImageIndex === 1);
    await page.waitForFunction(()=>document.querySelector('.lb-number').textContent === 'Image 2 of 7');
    await page.keyboard.press('ArrowLeft');
    await page.waitForFunction(()=>lightbox.currentImageIndex === 0);
    await page.waitForFunction(()=>document.querySelector('.lb-number').textContent === 'Image 1 of 7');
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>jQuery('#lightbox').css('display')==='none');
    assert.equal(await page.evaluate(()=>document.activeElement.id), 'preview1');
    await page.evaluate(()=>jQuery('#collapsed1').trigger('click'));
    assert.equal(await page.evaluate(()=>lightbox.album.length), 7);
    assert.equal(await page.evaluate(()=>lightbox.currentImageIndex), 0);
    await page.keyboard.press('Escape');
    // Exact regression: two attachments, each with two headers and a preview.
    await page.evaluate(() => {
      jQuery('.bug-attach-tags').html(
        [1, 2].map(id => `<div class="well"><a id="two-name${id}" href="file_download.php?file_id=${id}&type=bug">photo${id}.png</a><div class="bug-attachment-preview-image"><a id="two-preview${id}" href="file_download.php?file_id=${id}&type=bug"><img alt="photo${id}.png" src="file_download.php?file_id=${id}&type=bug"></a></div><a id="two-collapsed${id}" href="file_download.php?type=bug&file_id=${id}">photo${id}.png</a></div>`).join('')
      );
      jQuery('#bugnotes').empty();
      jQuery(document).trigger('ajaxComplete').trigger('ajaxComplete');
    });
    assert.equal(await page.locator('a[data-lightbox]').count(), 2);
    for (const id of [1, 2]) for (const trigger of ['name', 'preview', 'collapsed']) {
      const imageChanged = page.evaluate(() => new Promise(resolve => {
        jQuery(document).one('lightbox:change', (_event, data) => resolve(data.currentImageIndex));
      }));
      await page.locator(`#two-${trigger}${id}`).click();
      assert.equal(await imageChanged, id - 1);
      await page.waitForFunction(expected => document.querySelector('.lb-number').textContent === `Image ${expected} of 2`, id);
      assert.equal(await page.evaluate(()=>lightbox.album.length), 2);
      await page.keyboard.press(id === 1 ? 'ArrowRight' : 'ArrowLeft');
      await page.waitForFunction(expected => document.querySelector('.lb-number').textContent === `Image ${expected} of 2`, 3 - id);
      await page.keyboard.press('Escape');
      await page.waitForFunction(()=>jQuery('#lightbox').css('display')==='none');
      assert.equal(await page.evaluate(()=>document.activeElement.id), `two-${trigger}${id}`);
    }
    await page.evaluate(()=>lightbox.open('/file_download.php?file_id=99&type=bug'));
    await page.waitForFunction(()=>jQuery('.lb-loader').css('display')==='none');
    await page.evaluate(()=>lightbox.close());
    assert.deepEqual(await page.evaluate(()=>window.cspViolations),[]);
    assert.deepEqual(errors,[]);
    assert.deepEqual(wrongImageRequests, []);
    assert.deepEqual([...pluginImageResponses.keys()].sort(), [...pluginImageFiles.keys()].sort());
    for (const [file, response] of pluginImageResponses) {
      assert.equal(response.status, 200, `${file} response status`);
      assert.match(response.contentType, file.endsWith('.gif') ? /^image\/gif/ : /^image\/png/);
    }
    const intentional404 = `${base}/file_download.php?file_id=99&type=bug`;
    assert.deepEqual(failedResponses, [{ status: 404, url: intentional404 }]);
    assert.equal(consoleErrors.length, 1);
    assert.match(consoleErrors[0].text, /status of 404/);
    assert.equal(consoleErrors[0].url, intentional404);
    console.log('PASS jQuery 2.2.4, modal, preview, navigation, Escape, focus, text captions, failed image, CSP, four plugin images');
  } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
