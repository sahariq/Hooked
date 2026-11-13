import { useEffect } from 'react';

/* Per-page SEO for a client-rendered React app.
   Sets the document title, meta description, canonical URL, Open Graph / Twitter tags and
   optional JSON-LD structured data, then restores everything when the page unmounts.

   Usage:
     useSeo({
       title: 'Page title',
       description: 'Page description',
       path: '/about',
       jsonLd: { '@context': 'https://schema.org', ... },   // optional
     });
*/

// Add or update a <meta> tag. Returns a function that undoes the change.
function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  const created = !el;
  const previous = el ? el.getAttribute('content') : null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
  return () => {
    if (created) el.remove();
    else el.setAttribute('content', previous ?? '');
  };
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  const created = !el;
  const previous = el ? el.getAttribute('href') : null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
  return () => {
    if (created) el.remove();
    else el.setAttribute('href', previous ?? '');
  };
}

function setJsonLd(data) {
  const el = document.createElement('script');
  el.type = 'application/ld+json';
  el.textContent = JSON.stringify(data);
  document.head.appendChild(el);
  return () => el.remove();
}

export default function useSeo({ title, description, path = '/', siteName = 'Hooked', jsonLd }) {
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    const url = `${window.location.origin}${path}`;
    const previousTitle = document.title;
    document.title = title;

    const undo = [
      setMeta('name', 'description', description),
      setCanonical(url),
      setMeta('property', 'og:type', 'website'),
      setMeta('property', 'og:site_name', siteName),
      setMeta('property', 'og:title', title),
      setMeta('property', 'og:description', description),
      setMeta('property', 'og:url', url),
      setMeta('name', 'twitter:card', 'summary'),
      setMeta('name', 'twitter:title', title),
      setMeta('name', 'twitter:description', description),
    ];
    if (jsonLdKey) undo.push(setJsonLd(JSON.parse(jsonLdKey)));

    return () => {
      document.title = previousTitle;
      undo.forEach((fn) => fn());
    };
  }, [title, description, path, siteName, jsonLdKey]);
}
