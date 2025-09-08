// src/apod.js
import { $, show, hide } from './ui.js';

const API = 'https://api.nasa.gov/planetary/apod';
const API_KEY = '2lWc2sGkMOhTHRThafaKdNcYGP9dHqgawJs6jG2Y'; // or your own

// --- helpers ---
const toHttps = (u) => (typeof u === 'string' ? u.replace(/^http:\/\//i, 'https://') : u);

// convert watch URLs to embeddable ones (YouTube/Vimeo minimal support)
function toEmbed(url) {
  if (!url) return '';
  const u = toHttps(url);
  // YouTube
  const yt1 = u.match(/youtube\.com\/watch\?v=([^&]+)/i);
  if (yt1) return `https://www.youtube.com/embed/${yt1[1]}`;
  const yt2 = u.match(/youtu\.be\/([^?]+)/i);
  if (yt2) return `https://www.youtube.com/embed/${yt2[1]}`;
  // Vimeo
  const vm = u.match(/vimeo\.com\/(\d+)/i);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return u; // fallback: try as-is
}

function setLoading(v) {
  const load = $('#loading');
  const btn = $('#loadBtn');
  if (load) (v ? show(load) : hide(load));
  if (btn) {
    if (v) { btn.setAttribute('disabled', 'true'); btn.classList.add('opacity-50','cursor-not-allowed'); }
    else { btn.removeAttribute('disabled'); btn.classList.remove('opacity-50','cursor-not-allowed'); }
  }
}

function setError(msg = '') {
  const box = $('#errorBox');
  if (!box) return;
  if (!msg) hide(box);
  else { box.textContent = msg; show(box); }
}

// --- render ---
function render(apod) {
  const img = $('#apodImg');
  const iframe = $('#apodVideo');
  const title = $('#apodTitle');
  const date = $('#apodDate');
  const desc = $('#apodDesc');

  if (title) title.textContent = apod.title || 'Astronomy Picture of the Day';
  if (date)  date.textContent  = apod.date || '';
  if (desc)  desc.textContent  = apod.explanation || '';

  // Reset sources
  if (img) img.removeAttribute('src');
  if (iframe) iframe.removeAttribute('src');

  if (apod.media_type === 'image') {
    if (iframe) hide(iframe);
    if (img) {
      img.src = toHttps(apod.hdurl || apod.url || apod.thumbnail_url || '');
      img.alt = apod.title || 'APOD';
      show(img);
    }
  } else if (apod.media_type === 'video') {
    // Prefer showing an embed; also set thumbnail as a fallback image for preview
    if (img && apod.thumbnail_url) {
      img.src = toHttps(apod.thumbnail_url);
      img.alt = apod.title || 'APOD video thumbnail';
      show(img);
    } else if (img) {
      hide(img); // no thumbnail available
    }
    if (iframe) {
      iframe.src = toEmbed(apod.url);
      show(iframe);
    }
  } else {
    // Unknown type
    if (img) hide(img);
    if (iframe) hide(iframe);
  }
}

// --- fetch ---
async function fetchAPOD(specifiedDate) {
  const params = new URLSearchParams({
    api_key: API_KEY,
    thumbs: 'true',              // get thumbnail for videos
  });
  if (specifiedDate) params.set('date', specifiedDate);

  const res = await fetch(`${API}?${params.toString()}`);
  if (!res.ok) {
    let txt = '';
    try { txt = await res.text(); } catch {}
    throw new Error(`APOD request failed (${res.status}): ${txt || 'Unknown error'}`);
  }
  return res.json();
}

async function load() {
  setError('');
  setLoading(true);
  try {
    const d = $('#apodDateInput')?.value || ''; // if you have a date picker; else leave ''
    const apod = await fetchAPOD(d);
    render(apod);
  } catch (e) {
    console.error(e);
    const msg = String(e);
    if (/403/.test(msg)) setError('NASA API key may be invalid or rate-limited. Try again or use your own key.');
    else if (/Failed to fetch|NetworkError/i.test(msg)) setError('Network error fetching APOD.');
    else setError('Could not load APOD today. Try selecting another date.');
  } finally {
    setLoading(false);
  }
}

// --- init ---
function initAPOD() {
  // Optional: prefill a date input to today
  const di = $('#apodDateInput');
  if (di && !di.value) di.value = new Date().toISOString().slice(0,10);

  $('#loadBtn')?.addEventListener('click', load);
  load(); // initial load
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAPOD);
} else {
  initAPOD();
}
