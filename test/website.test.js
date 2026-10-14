import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(here, '..', 'website');
const htmlPages = ['index.html', 'services.html', 'about.html', 'contact.html', 'privacy.html', 'terms.html', '404.html'];

function readSiteFile(relativePath) {
  return fs.readFileSync(path.join(siteRoot, relativePath), 'utf8');
}

test('website contains the planned static pages and core SEO files', () => {
  for (const file of [...htmlPages, 'styles.css', 'script.js', 'config.js', 'robots.txt', 'sitemap.xml', '_headers']) {
    assert.ok(fs.existsSync(path.join(siteRoot, file)), 'missing website file: ' + file);
  }
});

test('HTML pages declare a language, viewport, title and stylesheet', () => {
  for (const page of htmlPages) {
    const html = readSiteFile(page);
    assert.match(html, /<html lang="en">/i, page + ' should set a language');
    assert.match(html, /<meta name="viewport"/i, page + ' should set a mobile viewport');
    assert.match(html, /<title>[^<]+<\/title>/i, page + ' should have a title');
    assert.match(html, /href="styles\.css"/i, page + ' should use the local stylesheet');
  }
});

test('index and all indexable pages have a meta description and canonical URL', () => {
  for (const page of htmlPages.filter((item) => item !== '404.html')) {
    const html = readSiteFile(page);
    assert.match(html, /<meta name="description" content="[^"]+"/i, page + ' should have a description');
    assert.match(html, /<link rel="canonical" href="https:\/\/ha-digital-agency-site\.pages\.dev/i, page + ' should have a canonical URL');
  }
  assert.match(readSiteFile('404.html'), /<meta name="robots" content="noindex,follow"/i);
});

test('all local HTML href and src references point to files or in-page anchors', () => {
  for (const page of htmlPages) {
    const html = readSiteFile(page);
    const attrs = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
    for (const value of attrs) {
      if (/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(value) || value.startsWith('#')) continue;
      const pathname = value.split('#')[0].split('?')[0];
      if (!pathname) continue;
      const target = pathname === '/' ? 'index.html' : path.normalize(path.join(path.dirname(page), pathname));
      assert.ok(fs.existsSync(path.join(siteRoot, target)), page + ' contains a broken local reference: ' + value);
    }
  }
});

test('sitemap entries map to real public pages and robots points to the sitemap', () => {
  const sitemap = readSiteFile('sitemap.xml');
  const robots = readSiteFile('robots.txt');
  assert.match(robots, /Sitemap:\s*https:\/\/ha-digital-agency-site\.pages\.dev\/sitemap\.xml/i);
  const urls = [...sitemap.matchAll(/<loc>(https:\/\/ha-digital-agency-site\.pages\.dev[^<]*)<\/loc>/g)].map((match) => match[1]);
  assert.ok(urls.length >= 5, 'sitemap should contain the key pages');
  for (const url of urls) {
    const pathname = new URL(url).pathname;
    const page = pathname === '/' ? 'index.html' : pathname.slice(1);
    assert.ok(fs.existsSync(path.join(siteRoot, page)), 'sitemap points to a missing page: ' + url);
  }
});

test('project brief remains local and email sending is configurable rather than fabricated', () => {
  const contact = readSiteFile('contact.html');
  const script = readSiteFile('script.js');
  const config = readSiteFile('config.js');
  assert.match(contact, /does not send or store your information/i);
  assert.match(script, /mailto:/);
  assert.match(config, /contactEmail:\s*""/);
  assert.doesNotMatch(config, /sk-[A-Za-z0-9]{20,}/);
});
